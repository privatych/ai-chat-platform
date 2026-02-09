import { FastifyRequest, FastifyReply } from 'fastify';
import { db, chats } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

interface DeleteChatParams {
  chatId: string;
}

export async function deleteChatHandler(
  request: FastifyRequest<{ Params: DeleteChatParams }>,
  reply: FastifyReply
) {
  try {
    const { chatId } = request.params;
    const userId = (request.user as any).userId;

    console.log('[Delete Chat Handler] Received request:', { chatId, userId });

    // Delete chat (only if it belongs to the user)
    const result = await db
      .delete(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .returning();

    console.log('[Delete Chat Handler] DB result:', result);

    if (result.length === 0) {
      console.log('[Delete Chat Handler] Chat not found or not owned by user');
      return reply.code(404).send({
        success: false,
        error: { code: 'CHAT_NOT_FOUND', message: 'Chat not found' },
      });
    }

    console.log('[Delete Chat Handler] Chat deleted successfully');
    return reply.send({
      success: true,
      data: { message: 'Chat deleted successfully' },
    });
  } catch (error) {
    console.error('[Delete Chat Handler] Error:', error);
    throw error;
  }
}
