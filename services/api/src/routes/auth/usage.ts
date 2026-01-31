import { FastifyRequest, FastifyReply } from 'fastify';
import { db, messages, chats } from '@ai-chat/database';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function usageStatsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any).userId;

    // Get today's start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count messages sent today by this user
    const messagesResult = await db
      .select({
        count: sql<number>`count(*)`,
        totalTokens: sql<number>`sum(${messages.tokensUsed})`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.role, 'user'),
          gte(messages.createdAt, today),
          sql`${messages.chatId} IN (SELECT id FROM chats WHERE user_id = ${userId})`
        )
      );

    const messagesUsedToday = Number(messagesResult[0]?.count || 0);
    const tokensUsedToday = Number(messagesResult[0]?.totalTokens || 0);

    return reply.send({
      success: true,
      data: {
        messagesUsedToday,
        tokensUsedToday,
      },
    });
  } catch (error) {
    throw error;
  }
}
