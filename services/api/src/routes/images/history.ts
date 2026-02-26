import { FastifyRequest, FastifyReply } from 'fastify';
import { db, imageGenerations } from '@ai-chat/database';
import { eq, desc } from 'drizzle-orm';

interface HistoryQuery {
  limit?: string;
  offset?: string;
}

export async function historyHandler(
  request: FastifyRequest<{ Querystring: HistoryQuery }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
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
    data: generations.map(g => {
      // Convert storage path to API URL path
      // Storage: /uploads/images/userId/filename.png
      // API URL: /api/images/userId/filename.png
      const apiImagePath = g.imageUrl.replace('/uploads/images/', '/api/images/');
      
      return {
        ...g,
        imageUrl: `https://ai.itoq.ru${apiImagePath}`,
      };
    }),
  });
}
