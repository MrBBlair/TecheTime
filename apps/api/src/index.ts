/**
 * Standalone Express server (for local development or traditional hosting)
 * For Vercel, use api/[...].ts instead
 */

import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 Tech eTime API server running on http://localhost:${PORT}`);
});
