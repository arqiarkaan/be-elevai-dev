import type { Context, Next } from 'hono';

// Simple in-memory rate limiter
// For production, consider using Redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  return async (c: Context, next: Next) => {
    const { windowMs, max, message } = options;

    // Use user ID if authenticated, otherwise use IP
    const user = c.get('user');
    const identifier = user?.id || c.req.header('x-forwarded-for') || 'unknown';
    const key = `${identifier}:${c.req.path}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      await next();
      return;
    }

    if (entry.count >= max) {
      return c.json(
        {
          success: false,
          error: message || 'Too many requests, please try again later',
          retry_after: Math.ceil((entry.resetAt - now) / 1000),
        },
        429
      );
    }

    entry.count++;
    await next();
  };
}

// Preset rate limiters
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests, please try again later',
});

export const featureRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many feature requests, please slow down',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts',
});
