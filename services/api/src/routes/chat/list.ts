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

  // Debug logging
  console.log('[List Chats] Total chats:', userChats.length);
  if (userChats.length > 0) {
    console.log('[List Chats] First chat:', JSON.stringify(userChats[0], null, 2));
    console.log('[List Chats] Chats with projects:', userChats.filter(c => c.project?.name).length);
    console.log('[List Chats] Chats with projectId but no project.name:',
      userChats.filter(c => c.projectId && !c.project?.name).map(c => ({
        chatId: c.id,
        projectId: c.projectId,
        project: c.project
      }))
    );
  }

  return reply.send({
    success: true,
    data: userChats,
  });
}
