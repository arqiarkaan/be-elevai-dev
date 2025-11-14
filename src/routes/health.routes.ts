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
 * GET /
 * Root endpoint
 */
health.get('/', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ElevAI Backend API',
  });
});

export default health;
