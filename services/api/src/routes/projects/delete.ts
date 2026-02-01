import { FastifyRequest, FastifyReply } from 'fastify';
import { db, projects } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

interface DeleteProjectParams {
  projectId: string;
}

export async function deleteProjectHandler(
  request: FastifyRequest<{ Params: DeleteProjectParams }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { projectId } = request.params;

  // Check if project exists and belongs to user
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

  // Prevent deletion of default project
  if (project.isDefault) {
    return reply.status(400).send({
      success: false,
      error: 'Cannot delete default project',
    });
  }

  // Delete the project
  await db
    .delete(projects)
    .where(eq(projects.id, projectId));

  return reply.send({
    success: true,
    data: { message: 'Project deleted successfully' },
  });
}
