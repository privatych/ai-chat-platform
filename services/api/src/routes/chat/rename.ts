import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, chats } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

interface RenameChatParams {
  chatId: string;
}

const renameChatSchema = z.object({
  title: z.string().min(1).max(255),
});

export async function renameChatHandler(
  request: FastifyRequest<{ Params: RenameChatParams }>,
  reply: FastifyReply
) {
  try {
    const { chatId } = request.params;
    const userId = (request.user as any).userId;
    const body = renameChatSchema.parse(request.body);

    // Update chat title (only if it belongs to the user)
    const result = await db
      .update(chats)
      .set({
        title: body.title,
        updatedAt: new Date(),
      })
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({
        success: false,
        error: { code: 'CHAT_NOT_FOUND', message: 'Chat not found' },
      });
    }

    return reply.send({
      success: true,
      data: result[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
    }
    throw error;
  }
}
