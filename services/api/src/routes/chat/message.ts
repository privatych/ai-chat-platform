import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, chats, messages } from '@ai-chat/database';
import { eq } from 'drizzle-orm';
import { streamChatCompletion } from '../../services/openrouter';

const sendMessageSchema = z.object({
  content: z.string().min(1),
});

export async function sendMessageHandler(
  request: FastifyRequest<{ Params: { chatId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { chatId } = request.params;
  const body = sendMessageSchema.parse(request.body);

  // Verify chat ownership
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.userId !== userId) {
    return reply.code(404).send({
      success: false,
      error: { code: 'CHAT_NOT_FOUND', message: 'Chat not found' },
    });
  }

  // Save user message
  await db.insert(messages).values({
    chatId,
    role: 'user',
    content: body.content,
  });

  // Get chat history
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt)
    .limit(20);

  const chatMessages = history.map(m => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }));

  // Setup SSE
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');

  let assistantMessage = '';

  await streamChatCompletion(
    chat.model,
    chatMessages,
    (chunk) => {
      assistantMessage += chunk;
      reply.raw.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
    },
    async (tokensUsed) => {
      // Save assistant message
      await db.insert(messages).values({
        chatId,
        role: 'assistant',
        content: assistantMessage,
        tokensUsed,
      });

      reply.raw.write(`data: ${JSON.stringify({ done: true, tokensUsed })}\n\n`);
      reply.raw.end();
    }
  );
}
