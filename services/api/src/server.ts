import 'dotenv/config';
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
