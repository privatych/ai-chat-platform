import { FastifyRequest, FastifyReply } from 'fastify';
import { db, chats, projects } from '@ai-chat/database';
import { eq, desc } from 'drizzle-orm';

export async function listChatsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;

  const userChats = await db
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
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt))
    .limit(50);

  return reply.send({
    success: true,
    data: userChats,
  });
}
