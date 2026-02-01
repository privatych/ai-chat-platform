import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, projects } from '@ai-chat/database';

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export async function createProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any).userId;
    const body = createProjectSchema.parse(request.body);

    const [project] = await db
      .insert(projects)
      .values({
        userId,
        name: body.name,
        description: body.description,
        isDefault: false,
      })
      .returning();

    return reply.send({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        error: error.errors,
      });
    }
    throw error;
  }
}
