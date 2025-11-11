import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../utils/supabase.js';
import { TokenManager } from '../utils/token-manager.js';
import type { Variables } from '../types/hono.js';
import type { AuthUser } from '../types/index.js';

const user = new Hono<{ Variables: Variables }>();

// All routes require authentication
user.use('*', authMiddleware);

/**
 * GET /api/user/profile
 * Get current user profile
 */
user.get('/profile', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;

    // Check and update premium status if expired
    const profile = await TokenManager.checkAndUpdatePremiumStatus(authUser.id);

    return c.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get profile',
      },
      500
    );
  }
});

/**
 * GET /api/user/tokens
 * Get token balance and usage history
 */
user.get('/tokens', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;

    const balance = await TokenManager.getBalance(authUser.id);
    const logs = await db.getTokenLogs(authUser.id, 50);

    return c.json({
      success: true,
      data: {
        balance,
        logs,
      },
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get token information',
      },
      500
    );
  }
});

/**
 * GET /api/user/transactions
 * Get user's transaction history
 */
user.get('/transactions', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;

    const transactions = await db.getUserTransactions(authUser.id, 50);

    return c.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get transactions',
      },
      500
    );
  }
});

/**
 * GET /api/user/usage
 * Get feature usage statistics
 */
user.get('/usage', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;

    const usageLogs = await db.getUserUsageLogs(authUser.id, 100);

    return c.json({
      success: true,
      data: usageLogs,
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get usage data',
      },
      500
    );
  }
});

/**
 * GET /api/user/subscription
 * Get subscription status
 */
user.get('/subscription', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;

    const isPremium = await TokenManager.isPremium(authUser.id);
    const profile = await db.getProfile(authUser.id);

    return c.json({
      success: true,
      data: {
        is_premium: isPremium,
        plan: profile?.premium_plan,
        expires_at: profile?.premium_expires_at,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get subscription status',
      },
      500
    );
  }
});

export default user;
