import { FastifyInstance } from 'fastify';
import { createChatHandler } from './create';
import { listChatsHandler } from './list';
import { sendMessageHandler } from './message';

export async function chatRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', app.authenticate);

  app.post('/', createChatHandler);
  app.get('/', listChatsHandler);
  app.post('/:chatId/message', sendMessageHandler);
}
