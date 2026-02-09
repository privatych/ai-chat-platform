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

const createSectionSchema = z.object({
  sectionType: z.enum(['about_project', 'about_user', 'technical', 'documents']),
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  files: z.array(fileSchema).optional(),
});

export async function createSectionHandler(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { projectId } = request.params;
  const body = createSectionSchema.parse(request.body);

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

  // Extract text from files
  let extractedText = '';
  if (body.files && body.files.length > 0) {
    const textParts: string[] = [];

    for (const file of body.files) {
      try {
        const text = await extractTextFromFile(file);
        textParts.push(`### ${file.name}\n\n${text}`);
      } catch (error) {
        console.error(`Failed to extract text from ${file.name}:`, error);
      }
    }

    extractedText = truncateText(textParts.join('\n\n'));
  }

  const [section] = await db
    .insert(contextSections)
    .values({
      projectId,
      sectionType: body.sectionType,
      title: body.title,
      content: body.content,
      extractedText,
      files: body.files || null,
    })
    .returning();

  return reply.send({
    success: true,
    data: section,
  });
}
