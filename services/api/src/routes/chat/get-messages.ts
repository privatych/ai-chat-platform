import { FastifyRequest, FastifyReply } from 'fastify';
import { db, messages, chats } from '@ai-chat/database';
import { eq, and, asc } from 'drizzle-orm';

interface GetMessagesParams {
  chatId: string;
}

export async function getMessagesHandler(
  request: FastifyRequest<{ Params: GetMessagesParams }>,
  reply: FastifyReply
) {
  try {
    const { chatId } = request.params;
    const userId = (request.user as any).userId;

    // Verify chat belongs to user
    const chatResult = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .limit(1);

    if (chatResult.length === 0) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'CHAT_NOT_FOUND',
          message: 'Chat not found',
        },
      });
    }

    // Get all messages for this chat, ordered by creation time
    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));

    return reply.send({
      success: true,
      data: chatMessages,
    });
  } catch (error) {
    throw error;
  }
}
