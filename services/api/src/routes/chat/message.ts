import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, chats, messages, projects, contextSections, usageLogs } from '@ai-chat/database';
import { eq } from 'drizzle-orm';
import { streamChatCompletion, formatMessageWithAttachments } from '../../services/openrouter';
import { calculateCost } from '../../services/pricing';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 10;
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
  // Archives (if needed)
  'application/zip',
];

const attachmentSchema = z.object({
  type: z.enum(['image', 'file']),
  name: z.string(),
  mimeType: z.string(),
  data: z.string(),
  size: z.number().max(MAX_FILE_SIZE, `Размер файла не должен превышать ${MAX_FILE_SIZE / 1024 / 1024}MB`),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  model: z.string().optional(),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS, `Максимум ${MAX_ATTACHMENTS} файлов`).optional(),
});

async function buildSystemPromptWithContext(
  chatId: string,
  userId: string,
  basePrompt?: string
): Promise<string> {
  // Get chat with project reference
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || !chat.useProjectContext || !chat.projectId) {
    return basePrompt || '';
  }

  // Get all context sections for this project
  const sections = await db
    .select()
    .from(contextSections)
    .where(eq(contextSections.projectId, chat.projectId))
    .orderBy(contextSections.createdAt);

  if (sections.length === 0) {
    return basePrompt || '';
  }

  // Build context prompt
  const contextParts = sections.map(section => {
    let text = `## ${section.title}\n\n`;
    if (section.content) {
      text += section.content + '\n\n';
    }
    if (section.extractedText) {
      text += section.extractedText + '\n\n';
    }
    return text;
  });

  const contextPrompt = `# Project Context\n\n${contextParts.join('\n---\n\n')}`;

  return basePrompt
    ? `${contextPrompt}\n\n---\n\n${basePrompt}`
    : contextPrompt;
}

export async function sendMessageHandler(
  request: FastifyRequest<{ Params: { chatId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { chatId } = request.params;
  const body = sendMessageSchema.parse(request.body);
  const { content, model, attachments } = body;

  // Validate attachments
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(attachment.mimeType)) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Тип файла ${attachment.mimeType} не поддерживается`,
          },
        });
      }

      // Check file size (already validated by Zod, but double-check)
      if (attachment.size > MAX_FILE_SIZE) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `Файл ${attachment.name} слишком большой (максимум ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
          },
        });
      }
    }
  }

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

  // Update chat model if provided
  let currentModel = chat.model;
  if (body.model && body.model !== chat.model) {
    await db
      .update(chats)
      .set({ model: body.model, updatedAt: new Date() })
      .where(eq(chats.id, chatId));
    currentModel = body.model;
    console.log(`[Message Handler] Updated chat model from ${chat.model} to ${body.model}`);
  }

  // Save user message
  await db.insert(messages).values({
    chatId,
    role: 'user',
    content: body.content,
    attachments: attachments || null,
  });

  // Build system prompt with context if enabled
  const systemPrompt = await buildSystemPromptWithContext(
    chatId,
    userId,
    chat.systemPrompt || undefined
  );

  // Get chat history
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt)
    .limit(20);

  const chatMessages = await Promise.all(
    history.map(async (m, index) => {
      // Check if this is the latest user message with attachments
      const isLatestUserMessage = index === history.length - 1 && m.role === 'user';
      const messageAttachments = isLatestUserMessage ? attachments : (m.attachments as any);

      return {
        role: m.role as 'user' | 'assistant' | 'system',
        content: await formatMessageWithAttachments(m.content, messageAttachments),
      };
    })
  );

  // Prepend system prompt if exists
  if (systemPrompt) {
    chatMessages.unshift({
      role: 'system',
      content: systemPrompt,
    });
  }

  // Setup SSE - hijack reply to prevent Fastify from auto-sending
  reply.hijack();
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  let assistantMessage = '';
  let chunkCount = 0;

  try {
    console.log(`[Message Handler] Using model: ${currentModel}`);
    await streamChatCompletion(
      currentModel,
      chatMessages,
      (chunk) => {
        chunkCount++;
        assistantMessage += chunk;
        const data = JSON.stringify({ delta: chunk });
        console.log(`[Message Handler] Sending chunk ${chunkCount}:`, data);
        reply.raw.write(`data: ${data}\n\n`);
      },
      async (usage) => {
        console.log(`[Message Handler] Stream complete, total chunks: ${chunkCount}, tokens:`, usage);

        // Calculate cost
        const costUsd = await calculateCost(currentModel, usage.promptTokens, usage.completionTokens);

        // Save assistant message
        await db.insert(messages).values({
          chatId,
          role: 'assistant',
          content: assistantMessage,
          tokensUsed: usage.totalTokens,
        });

        // Log usage for analytics
        await db.insert(usageLogs).values({
          userId,
          eventType: 'chat_message',
          model: currentModel,
          tokensInput: usage.promptTokens,
          tokensOutput: usage.completionTokens,
          tokensTotal: usage.totalTokens,
          costUsd: (costUsd || 0).toString(),
          metadata: { chatId },
        });

        console.log(`[Message Handler] Logged usage: ${usage.totalTokens} tokens, $${costUsd?.toFixed(6) || 0}`);

        reply.raw.write(`data: ${JSON.stringify({ done: true, tokensUsed: usage.totalTokens })}\n\n`);
        reply.raw.end();
      }
    );
  } catch (error) {
    console.error('[Message Handler] Error during streaming:', error);
    const errorMessage = error instanceof Error ? error.message : 'Streaming failed';
    reply.raw.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    reply.raw.end();
  }
}
