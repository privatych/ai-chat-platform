import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/jwt';
import { generateHandler } from './generate';
import { historyHandler } from './history';
import { serveImageHandler } from './serve';

export async function imageRoutes(app: FastifyInstance) {
  // Public route for serving images (MUST be registered before auth hook)
  app.get('/:userId/:filename', serveImageHandler);
  
  // Apply authentication to remaining routes
  app.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticate);
    
    protectedRoutes.post('/generate', {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    }, generateHandler);

    protectedRoutes.get('/history', historyHandler);
  });
}
