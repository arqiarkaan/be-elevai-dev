import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Global error handling middleware
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);

    if (error instanceof HTTPException) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        error.status
      );
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Insufficient tokens')) {
        return c.json(
          {
            success: false,
            error: error.message,
          },
          402
        );
      }

      if (error.message.includes('Premium subscription required')) {
        return c.json(
          {
            success: false,
            error: error.message,
          },
          403
        );
      }

      return c.json(
        {
          success: false,
          error: error.message,
        },
        500
      );
    }

    return c.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      500
    );
  }
}

/**
 * 404 handler
 */
export function notFoundHandler(c: Context) {
  return c.json(
    {
      success: false,
      error: 'Route not found',
      path: c.req.path,
    },
    404
  );
}
