/**
 * Vercel Serverless Function - Express API Handler
 * Routes all /api/* requests to the Express app
 * Everything runs on Vercel - no external services needed!
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../apps/api/src/app.js';

// Create Express app instance (cached for performance)
let appInstance: ReturnType<typeof createApp> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Lazy initialization - create app on first request
  if (!appInstance) {
    appInstance = createApp();
  }
  
  // Use Express app to handle the request
  return appInstance(req, res);
}
