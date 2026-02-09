import { FastifyRequest, FastifyReply } from 'fastify';
import { db, contextSections } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

interface DeleteSectionParams {
  projectId: string;
  id: string;
}

export async function deleteSectionHandler(
  request: FastifyRequest<{ Params: DeleteSectionParams }>,
  reply: FastifyReply
) {
  const { projectId, id } = request.params;
  const userId = (request.user as any).userId;

  console.log('[Delete Section] Request:', { projectId, id, userId });

  // Verify project ownership before deleting section
  const [section] = await db
    .select()
    .from(contextSections)
    .where(eq(contextSections.id, id))
    .limit(1);

  console.log('[Delete Section] Found section:', section);

  if (!section) {
    return reply.code(404).send({
      success: false,
      error: { code: 'SECTION_NOT_FOUND', message: 'Context section not found' },
    });
  }

  if (section.projectId !== projectId) {
    return reply.code(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Section does not belong to this project' },
    });
  }

  // Delete the section
  await db
    .delete(contextSections)
    .where(eq(contextSections.id, id));

  return reply.send({
    success: true,
    data: { message: 'Context section deleted successfully' },
  });
}
