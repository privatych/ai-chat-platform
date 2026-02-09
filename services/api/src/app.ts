import Fastify from 'fastify';
import { ZodError } from 'zod';
import rateLimit from '@fastify/rate-limit';
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

  // Rate limiting
  await app.register(rateLimit, {
    max: 100, // 100 requests
    timeWindow: '15 minutes',
    errorResponseBuilder: (req, context) => {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
          retryAfter: context.after,
        },
      };
    },
  });

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
    if (error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number') {
      return reply.code(error.statusCode).send({
        success: false,
        error: {
          code: ('code' in error && typeof error.code === 'string') ? error.code : 'ERROR',
          message: ('message' in error && typeof error.message === 'string') ? error.message : 'Unknown error',
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
