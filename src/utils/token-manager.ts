import { db } from './supabase.js';
import type { Profile, UsageLog } from '../types/index.js';

export class TokenManager {
  /**
   * Check if user has sufficient tokens
   */
  static async hasEnoughTokens(
    userId: string,
    requiredTokens: number
  ): Promise<boolean> {
    const profile = await db.getProfile(userId);
    if (!profile) return false;
    return profile.tokens >= requiredTokens;
  }

  /**
   * Consume tokens for a feature usage
   * Returns the created usage log or null if failed
   */
  static async consumeTokens(
    userId: string,
    featureId: string,
    category: string,
    tokensToConsume: number,
    llmTokens?: number
  ): Promise<UsageLog | null> {
    const profile = await db.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.tokens < tokensToConsume) {
      throw new Error('Insufficient tokens');
    }

    const balanceBefore = profile.tokens;
    const balanceAfter = balanceBefore - tokensToConsume;

    // Update profile tokens
    const updatedProfile = await db.updateTokens(userId, balanceAfter);
    if (!updatedProfile) {
      throw new Error('Failed to update token balance');
    }

    // Create usage log
    const usageLog = await db.createUsageLog({
      user_id: userId,
      feature_id: featureId,
      category,
      tokens_consumed: tokensToConsume,
      llm_tokens: llmTokens,
    });

    if (!usageLog) {
      // Rollback token deduction
      await db.updateTokens(userId, balanceBefore);
      throw new Error('Failed to create usage log');
    }

    // Create token log for tracking
    await db.createTokenLog({
      user_id: userId,
      type: 'consume',
      amount: -tokensToConsume,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      usage_log_id: usageLog.id,
      description: `Used ${tokensToConsume} tokens for ${featureId}`,
    });

    return usageLog;
  }

  /**
   * Refund tokens (e.g., when an operation fails)
   */
  static async refundTokens(
    userId: string,
    usageLogId: string,
    tokensToRefund: number,
    reason: string
  ): Promise<boolean> {
    const profile = await db.getProfile(userId);
    if (!profile) return false;

    const balanceBefore = profile.tokens;
    const balanceAfter = balanceBefore + tokensToRefund;

    const updatedProfile = await db.updateTokens(userId, balanceAfter);
    if (!updatedProfile) return false;

    await db.createTokenLog({
      user_id: userId,
      type: 'refund',
      amount: tokensToRefund,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      usage_log_id: usageLogId,
      description: reason,
    });

    return true;
  }

  /**
   * Add tokens (purchase or bonus)
   */
  static async addTokens(
    userId: string,
    tokensToAdd: number,
    type: 'purchase' | 'bonus',
    transactionId?: string,
    description?: string
  ): Promise<boolean> {
    const profile = await db.getProfile(userId);
    if (!profile) return false;

    const balanceBefore = profile.tokens;
    const balanceAfter = balanceBefore + tokensToAdd;

    const updatedProfile = await db.updateTokens(userId, balanceAfter);
    if (!updatedProfile) return false;

    await db.createTokenLog({
      user_id: userId,
      type,
      amount: tokensToAdd,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      transaction_id: transactionId,
      description: description || `Added ${tokensToAdd} tokens`,
    });

    return true;
  }

  /**
   * Get user's current token balance
   */
  static async getBalance(userId: string): Promise<number> {
    const profile = await db.getProfile(userId);
    return profile?.tokens || 0;
  }

  /**
   * Check if user is premium
   */
  static async isPremium(userId: string): Promise<boolean> {
    const profile = await db.getProfile(userId);
    if (!profile || !profile.is_premium) return false;

    // Check if premium is still valid
    if (profile.premium_expires_at) {
      const expiresAt = new Date(profile.premium_expires_at);
      const now = new Date();
      return expiresAt > now;
    }

    return false;
  }

  /**
   * Check if premium has expired and update if needed
   */
  static async checkAndUpdatePremiumStatus(
    userId: string
  ): Promise<Profile | null> {
    const profile = await db.getProfile(userId);
    if (!profile || !profile.is_premium) return profile;

    if (profile.premium_expires_at) {
      const expiresAt = new Date(profile.premium_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        // Premium expired, update status
        return await db.updateProfile(userId, {
          is_premium: false,
          premium_plan: null,
        });
      }
    }

    return profile;
  }
}
