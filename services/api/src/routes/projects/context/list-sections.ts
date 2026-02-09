import { FastifyRequest, FastifyReply } from 'fastify';
import { db, projects, contextSections } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

export async function listSectionsHandler(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { projectId } = request.params;

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return reply.code(404).send({
      success: false,
      error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
    });
  }

  const sections = await db
    .select()
    .from(contextSections)
    .where(eq(contextSections.projectId, projectId))
    .orderBy(contextSections.createdAt);

  return reply.send({
    success: true,
    data: sections,
  });
}
