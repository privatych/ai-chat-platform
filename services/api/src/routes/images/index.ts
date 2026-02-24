import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/jwt';
import { generateHandler } from './generate';
import { historyHandler } from './history';

export async function imageRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/generate', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, generateHandler);

  app.get('/history', historyHandler);
}
