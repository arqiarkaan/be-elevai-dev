import { cors } from 'hono/cors';
import { env } from '../config/env.js';

export const corsMiddleware = cors({
  origin: [env.frontendUrl, 'http://localhost:8000', 'http://localhost:8001'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
});
