import Fastify from 'fastify';
import { corsPlugin } from './plugins/cors';
import { jwtPlugin } from './plugins/jwt';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register plugins
  await app.register(corsPlugin);
  await app.register(jwtPlugin);

  // Health check
  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  return app;
}
