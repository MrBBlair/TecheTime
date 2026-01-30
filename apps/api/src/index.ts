/**
 * Express API Server for Tech eTime
 * Vercel-compatible serverless function
 */

// Load environment variables from .env.local (for local development)
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from api directory or root
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import clientAdminRoutes from './routes/client-admin';
import kioskRoutes from './routes/kiosk';
import superRoutes from './routes/super';
import notificationRoutes from './routes/notifications';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client-admin', clientAdminRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/super', superRoutes);
app.use('/api/notifications', notificationRoutes);

// Vercel serverless function handler
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}
