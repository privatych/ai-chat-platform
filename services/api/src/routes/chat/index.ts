import { FastifyInstance } from 'fastify';
import { createChatHandler } from './create';
import { listChatsHandler } from './list';
import { sendMessageHandler } from './message';
import { getMessagesHandler } from './get-messages';
import { deleteChatHandler } from './delete';
import { renameChatHandler } from './rename';
import { authenticate } from '../../plugins/jwt';

export async function chatRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  app.post('/', createChatHandler);
  app.get('/', listChatsHandler);
  app.get('/:chatId/messages', getMessagesHandler);
  app.post('/:chatId/message', sendMessageHandler);
  app.delete('/:chatId', deleteChatHandler);
  app.patch('/:chatId', renameChatHandler);
}
