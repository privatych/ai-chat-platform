import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, chats, projects } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

const createChatSchema = z.object({
  title: z.string().min(1).max(255),
  model: z.string(),
  projectId: z.string().uuid().optional(),
});

export async function createChatHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const body = createChatSchema.parse(request.body);

  const [insertedChat] = await db
    .insert(chats)
    .values({
      userId,
      projectId: body.projectId || null,
      title: body.title,
      model: body.model,
      useProjectContext: body.projectId ? true : false,
    })
    .returning();

  // Fetch the chat with project information (matching list endpoint structure)
  const [chatWithProject] = await db
    .select({
      id: chats.id,
      userId: chats.userId,
      title: chats.title,
      model: chats.model,
      systemPrompt: chats.systemPrompt,
      temperature: chats.temperature,
      projectId: chats.projectId,
      useProjectContext: chats.useProjectContext,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
      project: {
        id: projects.id,
        name: projects.name,
        description: projects.description,
      },
    })
    .from(chats)
    .leftJoin(projects, eq(chats.projectId, projects.id))
    .where(eq(chats.id, insertedChat.id))
    .limit(1);

  return reply.send({
    success: true,
    data: chatWithProject,
  });
}
