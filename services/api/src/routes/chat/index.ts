import { FastifyInstance } from 'fastify';
import { createChatHandler } from './create';
import { listChatsHandler } from './list';
import { sendMessageHandler } from './message';
import { authenticate } from '../../plugins/jwt';

export async function chatRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  app.post('/', createChatHandler);
  app.get('/', listChatsHandler);
  app.post('/:chatId/message', sendMessageHandler);
}
