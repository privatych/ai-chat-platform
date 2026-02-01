import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, projects } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

interface UpdateProjectParams {
  projectId: string;
}

export async function updateProjectHandler(
  request: FastifyRequest<{ Params: UpdateProjectParams }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any).userId;
    const { projectId } = request.params;
    const body = updateProjectSchema.parse(request.body);

    // Check if project exists and belongs to user
    const [existingProject] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.userId, userId)
        )
      );

    if (!existingProject) {
      return reply.status(404).send({
        success: false,
        error: 'Project not found',
      });
    }

    // Update the project
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return reply.send({
      success: true,
      data: updatedProject,
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
