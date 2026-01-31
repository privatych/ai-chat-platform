import { FastifyRequest, FastifyReply } from 'fastify';
import { db, chats } from '@ai-chat/database';
import { eq, desc } from 'drizzle-orm';

export async function listChatsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;

  const userChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt))
    .limit(50);

  return reply.send({
    success: true,
    data: userChats,
  });
}
