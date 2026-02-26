import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@ai-chat/database';
import { imageGenerations } from '@ai-chat/database/schema';
import { eq, desc } from 'drizzle-orm';

interface HistoryQuery {
  limit?: string;
  offset?: string;
}

export async function historyHandler(
  request: FastifyRequest<{ Querystring: HistoryQuery }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).id;
  const limit = parseInt(request.query.limit || '20', 10);
  const offset = parseInt(request.query.offset || '0', 10);

  const generations = await db
    .select()
    .from(imageGenerations)
    .where(eq(imageGenerations.userId, userId))
    .orderBy(desc(imageGenerations.createdAt))
    .limit(limit)
    .offset(offset);

  return reply.send({
    success: true,
    data: generations.map(g => ({
      ...g,
      imageUrl: `https://ai.itoq.ru${g.imageUrl}`,
    })),
  });
}
