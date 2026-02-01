import { FastifyRequest, FastifyReply } from 'fastify';
import { db, projects } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

interface GetProjectParams {
  projectId: string;
}

export async function getProjectHandler(
  request: FastifyRequest<{ Params: GetProjectParams }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { projectId } = request.params;

  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      )
    );

  if (!project) {
    return reply.status(404).send({
      success: false,
      error: 'Project not found',
    });
  }

  return reply.send({
    success: true,
    data: project,
  });
}
