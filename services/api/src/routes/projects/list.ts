import { FastifyRequest, FastifyReply } from 'fastify';
import { db, projects } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

export async function listProjectsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId));

  return reply.send({
    success: true,
    data: userProjects,
  });
}
