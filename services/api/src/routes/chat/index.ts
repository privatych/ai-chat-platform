import { FastifyInstance } from 'fastify';
import { createChatHandler } from './create';
import { listChatsHandler } from './list';
import { sendMessageHandler } from './message';
import { getMessagesHandler } from './get-messages';
import { deleteChatHandler } from './delete';
import { renameChatHandler } from './rename';
import { authenticate } from '../../plugins/jwt';
import { checkMessageLimit } from '../../middleware/message-limit';

export async function chatRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  app.post('/', createChatHandler);
  app.get('/', listChatsHandler);
  app.get('/:chatId/messages', getMessagesHandler);
  // Apply message limit middleware only to message sending
  app.post('/:chatId/message', async (request, reply) => {
    await checkMessageLimit(request, reply);
    if (!reply.sent) {
      await sendMessageHandler(request as any, reply);
    }
  });
  app.delete('/:chatId', deleteChatHandler);
  app.patch('/:chatId', renameChatHandler);
}
