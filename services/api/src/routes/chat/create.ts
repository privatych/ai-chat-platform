import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, chats } from '@ai-chat/database';

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

  const [chat] = await db
    .insert(chats)
    .values({
      userId,
      projectId: body.projectId || null,
      title: body.title,
      model: body.model,
      useProjectContext: body.projectId ? true : false,
    })
    .returning();

  return reply.send({
    success: true,
    data: chat,
  });
}
