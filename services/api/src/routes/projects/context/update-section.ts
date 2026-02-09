import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, projects, contextSections } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';
import { extractTextFromFile, truncateText } from '../../../utils/text-extractor';

const fileSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  data: z.string(),
  size: z.number(),
});

const updateSectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  files: z.array(fileSchema).optional(),
});

export async function updateSectionHandler(
  request: FastifyRequest<{ Params: { projectId: string; id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { projectId, id } = request.params;
  const body = updateSectionSchema.parse(request.body);

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

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (body.title) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;

  // Extract text from files if provided
  if (body.files !== undefined) {
    updateData.files = body.files;

    if (body.files.length > 0) {
      const textParts: string[] = [];

      for (const file of body.files) {
        try {
          const text = await extractTextFromFile(file);
          textParts.push(`### ${file.name}\n\n${text}`);
        } catch (error) {
          console.error(`Failed to extract text from ${file.name}:`, error);
        }
      }

      updateData.extractedText = truncateText(textParts.join('\n\n'));
    } else {
      updateData.extractedText = null;
    }
  }

  const [updated] = await db
    .update(contextSections)
    .set(updateData)
    .where(and(eq(contextSections.id, id), eq(contextSections.projectId, projectId)))
    .returning();

  if (!updated) {
    return reply.code(404).send({
      success: false,
      error: { code: 'SECTION_NOT_FOUND', message: 'Section not found' },
    });
  }

  return reply.send({
    success: true,
    data: updated,
  });
}
