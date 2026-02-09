import { FastifyRequest, FastifyReply } from 'fastify';
import { db, chats, projects } from '@ai-chat/database';
import { eq, desc } from 'drizzle-orm';

export async function listChatsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;

  // Get chats with projects - using flat structure first
  const results = await db
    .select({
      // Chat fields
      chatId: chats.id,
      chatUserId: chats.userId,
      chatTitle: chats.title,
      chatModel: chats.model,
      chatSystemPrompt: chats.systemPrompt,
      chatTemperature: chats.temperature,
      chatProjectId: chats.projectId,
      chatUseProjectContext: chats.useProjectContext,
      chatCreatedAt: chats.createdAt,
      chatUpdatedAt: chats.updatedAt,
      // Project fields (will be null if no project)
      projectId: projects.id,
      projectName: projects.name,
      projectDescription: projects.description,
    })
    .from(chats)
    .leftJoin(projects, eq(chats.projectId, projects.id))
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt))
    .limit(50);

  // Transform to expected structure
  const userChats = results.map(row => ({
    id: row.chatId,
    userId: row.chatUserId,
    title: row.chatTitle,
    model: row.chatModel,
    systemPrompt: row.chatSystemPrompt,
    temperature: row.chatTemperature,
    projectId: row.chatProjectId,
    useProjectContext: row.chatUseProjectContext,
    createdAt: row.chatCreatedAt,
    updatedAt: row.chatUpdatedAt,
    project: row.projectId ? {
      id: row.projectId,
      name: row.projectName,
      description: row.projectDescription,
    } : null,
  }));

  return reply.send({
    success: true,
    data: userChats,
  });
}
