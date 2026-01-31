import Fastify from 'fastify';
import { corsPlugin } from './plugins/cors';
import { jwtPlugin } from './plugins/jwt';
import { authRoutes } from './routes/auth';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register plugins
  await app.register(corsPlugin);
  await app.register(jwtPlugin);

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });

  // Health check
  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  return app;
}
