import { Hono } from 'hono';
import { getAllFeatures } from '../config/features.js';

const health = new Hono();

/**
 * GET /health
 * Health check endpoint
 */
health.get('/', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ElevAI Backend API',
  });
});

/**
 * GET /features
 * Get all available features
 */
health.get('/features', (c) => {
  const features = getAllFeatures();
  
  return c.json({
    success: true,
    data: features,
  });
});

/**
 * GET /
 * Root endpoint
 */
health.get('/', (c) => {
  return c.json({
    success: true,
    message: 'ElevAI Backend API',
    version: '1.0.0',
    documentation: '/api/features',
  });
});

export default health;
