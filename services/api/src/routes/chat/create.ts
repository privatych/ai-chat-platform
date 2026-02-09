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
  const [result] = await db
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
      // Project fields
      projectId: projects.id,
      projectName: projects.name,
      projectDescription: projects.description,
    })
    .from(chats)
    .leftJoin(projects, eq(chats.projectId, projects.id))
    .where(eq(chats.id, insertedChat.id))
    .limit(1);

  // Transform to expected structure
  const chatWithProject = {
    id: result.chatId,
    userId: result.chatUserId,
    title: result.chatTitle,
    model: result.chatModel,
    systemPrompt: result.chatSystemPrompt,
    temperature: result.chatTemperature,
    projectId: result.chatProjectId,
    useProjectContext: result.chatUseProjectContext,
    createdAt: result.chatCreatedAt,
    updatedAt: result.chatUpdatedAt,
    project: result.projectId ? {
      id: result.projectId,
      name: result.projectName,
      description: result.projectDescription,
    } : null,
  };

  return reply.send({
    success: true,
    data: chatWithProject,
  });
}
