import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { env } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiRateLimit } from './middleware/rate-limit.js';
import type { Variables } from './types/hono.js';

// Import routes
import healthRoutes from './routes/health.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import userRoutes from './routes/user.routes.js';
import studentDevRoutes from './routes/student-development.routes.js';
import asistenLombaRoutes from './routes/asisten-lomba.routes.js';
import personalBrandingRoutes from './routes/personal-branding.routes.js';
import dailyToolsRoutes from './routes/daily-tools.routes.js';

// Initialize Hono app
const app = new Hono<{ Variables: Variables }>();

// Global middleware
app.use('*', logger());
app.use('*', corsMiddleware);
app.use('*', prettyJSON());
app.use('*', errorHandler);

// Root route
app.get('/', (c) => {
  return c.json({
    success: true,
    message: '🚀 ElevAI Backend API',
    version: '1.0.0',
    description: 'Your No. 1 Holistic Student Development with Smart AI-Personalized',
    endpoints: {
      health: '/health',
      features: '/features',
      api: '/api',
    },
    documentation: 'https://github.com/arqiarkaan/be-elevai-dev',
  });
});

// Health & Info routes
app.route('/health', healthRoutes);
app.route('/features', healthRoutes);

// API routes with rate limiting
app.use('/api/*', apiRateLimit);

// Mount API routes
app.route('/api/payment', paymentRoutes);
app.route('/api/user', userRoutes);
app.route('/api/student-development', studentDevRoutes);
app.route('/api/asisten-lomba', asistenLombaRoutes);
app.route('/api/personal-branding', personalBrandingRoutes);
app.route('/api/daily-tools', dailyToolsRoutes);

// 404 handler
app.notFound(notFoundHandler);

// Start server
const port = env.port;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log('\n🚀 ElevAI Backend Server Started!');
    console.log(`📍 Server running at: http://localhost:${info.port}`);
    console.log(`🌍 Environment: ${env.nodeEnv}`);
    console.log(`📝 API Documentation: http://localhost:${info.port}/features`);
    console.log(`💚 Health Check: http://localhost:${info.port}/health`);
    console.log('\n✨ Ready to serve requests!\n');
  }
);

export default app;
