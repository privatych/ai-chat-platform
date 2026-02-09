import Fastify from 'fastify';
import { ZodError } from 'zod';
import { corsPlugin } from './plugins/cors';
import { jwtPlugin } from './plugins/jwt';
import { authRoutes } from './routes/auth';
import { chatRoutes } from './routes/chat';
import { projectRoutes } from './routes/projects';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    bodyLimit: 20 * 1024 * 1024, // 20MB to handle base64 encoded files
  });

  // Register plugins
  await app.register(corsPlugin);
  await app.register(jwtPlugin);

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(projectRoutes, { prefix: '/api' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    // Zod validation errors
    if (error instanceof ZodError) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    }

    // Fastify errors (already have statusCode)
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        success: false,
        error: {
          code: error.code || 'ERROR',
          message: error.message,
        },
      });
    }

    // Unexpected errors
    console.error('[Error Handler] Unexpected error:', error);
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  return app;
}
