import type { Context, Next } from 'hono';
import { supabaseAdmin, db } from '../utils/supabase.js';
import type { AuthUser } from '../types/index.js';

/**
 * Auth middleware - Verifies Supabase JWT token
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          error: 'Missing or invalid authorization header',
        },
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return c.json(
        {
          success: false,
          error: 'Invalid or expired token',
        },
        401
      );
    }

    // Get user profile
    const profile = await db.getProfile(user.id);

    if (!profile) {
      return c.json(
        {
          success: false,
          error: 'User profile not found',
        },
        404
      );
    }

    // Attach user to context
    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      profile,
    };

    c.set('user', authUser);

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json(
      {
        success: false,
        error: 'Authentication failed',
      },
      500
    );
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);

      if (user) {
        const profile = await db.getProfile(user.id);
        if (profile) {
          const authUser: AuthUser = {
            id: user.id,
            email: user.email!,
            profile,
          };
          c.set('user', authUser);
        }
      }
    }

    await next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    await next();
  }
}
