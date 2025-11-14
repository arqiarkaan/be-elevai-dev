import { Hono } from 'hono';
import { getAllFeatures } from '../config/features.js';

const features = new Hono();

/**
 * GET /features
 * Get all available features
 */
features.get('/', (c) => {
  const featuresList = getAllFeatures();

  return c.json({
    success: true,
    data: featuresList,
  });
});

export default features;
