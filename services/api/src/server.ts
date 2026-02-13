import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from api directory (using process.cwd() for tsx compatibility)
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { buildApp } from './app';
import { validateEnv } from './config/env';
import { initializePricing } from './services/pricing';

const start = async () => {
  try {
    // Validate environment variables before starting
    validateEnv();

    // Initialize pricing service
    await initializePricing();

    const app = await buildApp();

    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });

    console.log(`🚀 Server ready at http://${host}:${port}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
