import { env } from '../config/env.js';
import { db } from '../utils/supabase.js';
import { TokenManager } from '../utils/token-manager.js';
import {
  generateOrderId,
  verifyMidtransSignature,
  calculatePremiumExpiry,
} from '../utils/helpers.js';
import {
  SUBSCRIPTION_PLANS,
  TOKEN_PACKAGES,
} from '../config/features.js';
import type { CreatePaymentRequest, MidtransNotification } from '../types/index.js';

/**
 * Payment Service for Midtrans integration
 */
export class PaymentService {
  private serverKey = env.midtransServerKey;
  private isProduction = env.midtransIsProduction;
  private snapApiUrl = this.isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  /**
   * Create payment transaction
   */
  async createPayment(userId: string, request: CreatePaymentRequest) {
    try {
      const orderId = generateOrderId(
        request.type === 'subscription' ? 'SUB' : 'TOKEN'
      );

      // Create transaction in database
      const transaction = await db.createTransaction({
        user_id: userId,
        order_id: orderId,
        type: request.type,
        item: request.item,
        amount: request.amount,
        tokens_amount: request.tokens_amount,
        status: 'pending',
      });

      if (!transaction) {
        throw new Error('Failed to create transaction');
      }

      // Get user profile for customer details
      const profile = await db.getProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Prepare Midtrans Snap request
      const snapRequest = {
        transaction_details: {
          order_id: orderId,
          gross_amount: request.amount,
        },
        customer_details: {
          email: profile.email,
          first_name: profile.full_name || 'User',
        },
        item_details: [
          {
            id: request.item,
            price: request.amount,
            quantity: 1,
            name: this.getItemName(request.type, request.item),
          },
        ],
        callbacks: {
          finish: `${env.frontendUrl}/payment/success`,
          error: `${env.frontendUrl}/payment/error`,
          pending: `${env.frontendUrl}/payment/pending`,
        },
      };

      // Call Midtrans Snap API
      const response = await fetch(this.snapApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(this.serverKey + ':').toString('base64')}`,
        },
        body: JSON.stringify(snapRequest),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Midtrans API error:', error);
        throw new Error('Failed to create payment');
      }

      const result = await response.json();

      // Update transaction with snap token
      await db.updateTransaction(orderId, {
        snap_token: result.token,
      });

      return {
        order_id: orderId,
        snap_token: result.token,
        redirect_url: result.redirect_url,
      };
    } catch (error) {
      console.error('Create payment error:', error);
      throw error;
    }
  }

  /**
   * Handle payment notification (webhook)
   */
  async handleNotification(notification: MidtransNotification) {
    try {
      const { order_id, transaction_status, fraud_status, signature_key, gross_amount, status_code } = notification;

      // Verify signature
      const expectedSignature = verifyMidtransSignature(
        order_id,
        status_code,
        gross_amount,
        this.serverKey
      );

      if (signature_key !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      // Get transaction
      const transaction = await db.getTransaction(order_id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Already processed
      if (transaction.status === 'completed') {
        return { success: true, message: 'Already processed' };
      }

      // Handle transaction status
      let newStatus: 'pending' | 'completed' | 'failed' = 'pending';

      if (transaction_status === 'capture' || transaction_status === 'settlement') {
        if (fraud_status === 'accept' || !fraud_status) {
          newStatus = 'completed';
          await this.processSuccessfulPayment(transaction);
        }
      } else if (
        transaction_status === 'cancel' ||
        transaction_status === 'deny' ||
        transaction_status === 'expire'
      ) {
        newStatus = 'failed';
      }

      // Update transaction status
      await db.updateTransaction(order_id, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
      });

      return { success: true, status: newStatus };
    } catch (error) {
      console.error('Handle notification error:', error);
      throw error;
    }
  }

  /**
   * Process successful payment
   */
  private async processSuccessfulPayment(transaction: any) {
    try {
      if (transaction.type === 'subscription') {
        // Handle subscription payment
        const plan = transaction.item as 'monthly' | 'yearly';
        const planDetails = SUBSCRIPTION_PLANS[plan];

        if (!planDetails) {
          throw new Error('Invalid subscription plan');
        }

        const expiresAt = calculatePremiumExpiry(plan);

        // Update user profile
        await db.updateProfile(transaction.user_id, {
          is_premium: true,
          premium_plan: plan,
          premium_expires_at: expiresAt.toISOString(),
        });

        // Add bonus tokens
        await TokenManager.addTokens(
          transaction.user_id,
          planDetails.tokens,
          'bonus',
          transaction.id,
          `Bonus tokens from ${planDetails.name} subscription`
        );
      } else if (transaction.type === 'tokens') {
        // Handle token purchase
        const packageKey = transaction.item as keyof typeof TOKEN_PACKAGES;
        const tokenPackage = TOKEN_PACKAGES[packageKey];

        if (!tokenPackage) {
          throw new Error('Invalid token package');
        }

        // Add purchased tokens
        await TokenManager.addTokens(
          transaction.user_id,
          tokenPackage.amount,
          'purchase',
          transaction.id,
          `Purchased ${tokenPackage.name}`
        );
      }
    } catch (error) {
      console.error('Process payment error:', error);
      throw error;
    }
  }

  /**
   * Get item name for display
   */
  private getItemName(type: string, item: string): string {
    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[item as keyof typeof SUBSCRIPTION_PLANS];
      return plan?.name || 'Premium Subscription';
    } else {
      const pkg = TOKEN_PACKAGES[item as keyof typeof TOKEN_PACKAGES];
      return pkg?.name || 'Token Package';
    }
  }

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans() {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * Get available token packages
   */
  getTokenPackages() {
    return TOKEN_PACKAGES;
  }
}

export const paymentService = new PaymentService();
