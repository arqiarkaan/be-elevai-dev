import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { paymentService } from '../services/payment.service.js';
import type { Variables } from '../types/hono.js';
import type { AuthUser } from '../types/index.js';

const payment = new Hono<{ Variables: Variables }>();

// Validation schemas
const createPaymentSchema = z.object({
  type: z.enum(['subscription', 'tokens']),
  item: z.string(),
  amount: z.number().positive(),
  tokens_amount: z.number().optional(),
});

const webhookSchema = z.object({
  transaction_status: z.string(),
  order_id: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
  status_code: z.string(),
  transaction_id: z.string(),
  fraud_status: z.string().optional(),
});

/**
 * GET /api/payment/plans
 * Get available subscription plans and token packages
 */
payment.get('/plans', (c) => {
  return c.json({
    success: true,
    data: {
      subscriptions: paymentService.getSubscriptionPlans(),
      tokens: paymentService.getTokenPackages(),
    },
  });
});

/**
 * POST /api/payment/create
 * Create a new payment transaction
 */
payment.post(
  '/create',
  authMiddleware,
  zValidator('json', createPaymentSchema),
  async (c) => {
    try {
      const user = c.get('user') as AuthUser;
      const request = c.req.valid('json');

      const result = await paymentService.createPayment(user.id, request);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Create payment error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create payment',
        },
        500
      );
    }
  }
);

/**
 * POST /api/payment/webhook
 * Handle Midtrans payment notification
 */
payment.post('/webhook', zValidator('json', webhookSchema), async (c) => {
  try {
    const notification = c.req.valid('json');

    const result = await paymentService.handleNotification(notification);

    return c.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      500
    );
  }
});

export default payment;
