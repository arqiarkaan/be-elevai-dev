import type { AuthUser } from './index.js';
import type { FeatureConfig } from './index.js';

/**
 * Hono context variables
 */
export type Variables = {
  user?: AuthUser;
  feature?: FeatureConfig;
};
