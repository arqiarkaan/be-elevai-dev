import type { Context, Next } from 'hono';
import { TokenManager } from '../utils/token-manager.js';
import { getFeatureById } from '../config/features.js';
import type { AuthUser } from '../types/index.js';

/**
 * Feature access middleware - checks premium status and token balance
 */
export function featureAccessMiddleware(featureId: string) {
  return async (c: Context, next: Next) => {
    try {
      const user = c.get('user') as AuthUser;

      if (!user) {
        return c.json(
          {
            success: false,
            error: 'Authentication required',
          },
          401
        );
      }

      const feature = getFeatureById(featureId);

      if (!feature) {
        return c.json(
          {
            success: false,
            error: 'Feature not found',
          },
          404
        );
      }

      // Check premium status if feature is premium
      if (feature.isPremium) {
        const isPremium = await TokenManager.isPremium(user.id);
        if (!isPremium) {
          return c.json(
            {
              success: false,
              error: 'Premium subscription required',
              feature: feature.name,
              upgrade_required: true,
            },
            403
          );
        }
      }

      // Check token balance
      const hasTokens = await TokenManager.hasEnoughTokens(
        user.id,
        feature.tokenCost
      );

      if (!hasTokens) {
        const balance = await TokenManager.getBalance(user.id);
        return c.json(
          {
            success: false,
            error: 'Insufficient tokens',
            required_tokens: feature.tokenCost,
            current_balance: balance,
            need_to_purchase: feature.tokenCost - balance,
          },
          402
        );
      }

      // Store feature info in context for later use
      c.set('feature', feature);

      await next();
    } catch (error) {
      console.error('Feature access middleware error:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to verify feature access',
        },
        500
      );
    }
  };
}
