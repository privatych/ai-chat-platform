import { NextResponse } from 'next/server';
import { db, chats, messages, users } from '@/lib/db';
import { getSession, generateId } from '@/lib/auth';
import { streamMockResponse } from '@/lib/mock-openrouter';
import { streamOpenRouterResponse, isOpenRouterConfigured, VISION_MODELS, Message } from '@/lib/openrouter';
import { optimizeContext, DEFAULT_CONTEXT_CONFIG, ContextConfig } from '@/lib/context-manager';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Convert local image to base64 data URL
function imageToBase64(imagePath: string): string | null {
  try {
    // Remove leading slash and 'uploads/' prefix to get relative path
    const relativePath = imagePath.replace(/^\/uploads\//, '');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', relativePath);

    if (!fs.existsSync(fullPath)) {
      console.error('Image not found:', fullPath);
      return null;
    }

    const imageBuffer = fs.readFileSync(fullPath);
    const base64 = imageBuffer.toString('base64');

    // Determine MIME type from extension
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}

const FREE_TIER_LIMITS = {
  messagesPerDay: 50,
};

// Premium models that require paid subscription
const PREMIUM_MODELS = ['gpt-4o', 'claude-3.5-sonnet', 'gemini-1.5-pro', 'grok-2'];

const attachmentSchema = z.object({
  url: z.string(),
  filename: z.string(),
  type: z.string(),
  size: z.number(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(32000),
  parentMessageId: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
  contextSize: z.enum(['small', 'medium', 'large']).optional(),
});

// POST /api/chats/[id]/messages - Send message and stream response
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id: chatId } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, parentMessageId, attachments, contextSize } = sendMessageSchema.parse(body);

    // Get chat and verify ownership
    const chat = db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, session.userId)))
      .get();

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Get user and check rate limits
    const user = db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .get();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Check if free user is trying to use premium model
    if (user.tier === 'free' && PREMIUM_MODELS.includes(chat.model)) {
      return NextResponse.json(
        {
          error: 'This model requires a premium subscription. Please upgrade to continue.',
          premiumRequired: true,
          model: chat.model,
        },
        { status: 403 }
      );
    }

    // Check daily message limit for free tier
    if (user.tier === 'free') {
      // Reset counter if new day
      const today = new Date().toISOString().split('T')[0];
      const lastReset = user.messagesResetAt?.split('T')[0];

      if (lastReset !== today) {
        db.update(users)
          .set({
            messagesUsedToday: 0,
            messagesResetAt: new Date().toISOString(),
          })
          .where(eq(users.id, user.id))
          .run();
        user.messagesUsedToday = 0;
      }

      if (user.messagesUsedToday >= FREE_TIER_LIMITS.messagesPerDay) {
        return NextResponse.json(
          {
            error: 'Daily message limit reached. Upgrade to premium for unlimited messages.',
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    // Save user message
    const userMessageId = generateId();
    const now = new Date().toISOString();

    db.insert(messages)
      .values({
        id: userMessageId,
        chatId,
        role: 'user',
        content,
        parentMessageId: parentMessageId || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        createdAt: now,
      })
      .run();

    // Increment message counter
    db.update(users)
      .set({
        messagesUsedToday: user.messagesUsedToday + 1,
      })
      .where(eq(users.id, user.id))
      .run();

    // Update chat timestamp
    db.update(chats)
      .set({ updatedAt: now })
      .where(eq(chats.id, chatId))
      .run();

    // Get chat history for context
    const chatMessages = db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt))
      .all();

    // Check if model supports vision
    const isVisionModel = VISION_MODELS.includes(chat.model);

    const fullMessageHistory: Message[] = chatMessages.map((msg) => {
      // Parse attachments if present
      let attachments: Array<{ url: string; filename: string; type: string; size: number }> = [];
      if (msg.attachments) {
        try {
          attachments = JSON.parse(msg.attachments);
        } catch {
          // Ignore invalid JSON
        }
      }

      // Filter image attachments
      const imageAttachments = attachments.filter((a) =>
        a.type.startsWith('image/')
      );

      // For vision models with image attachments, use multimodal format
      if (isVisionModel && msg.role === 'user' && imageAttachments.length > 0) {
        const content: Array<
          | { type: 'text'; text: string }
          | { type: 'image_url'; image_url: { url: string } }
        > = [];

        // Add images first
        for (const img of imageAttachments) {
          const base64Url = imageToBase64(img.url);
          if (base64Url) {
            content.push({
              type: 'image_url',
              image_url: { url: base64Url },
            });
          }
        }

        // Add text content
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }

        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content,
        };
      }

      // For non-vision models or messages without images, use text format
      let textContent = msg.content;
      if (attachments.length > 0 && !isVisionModel) {
        // For non-vision models, just mention attachments in text
        const attachmentInfo = attachments
          .map((a) => `[Attached: ${a.filename}]`)
          .join(' ');
        textContent = `${attachmentInfo}\n${msg.content}`;
      }

      return {
        role: msg.role as 'user' | 'assistant' | 'system',
        content: textContent,
      };
    });

    // Optimize context to save tokens based on user preference and tier
    const contextSizeConfigs: Record<string, ContextConfig> = {
      small: { maxRecentMessages: 10, maxContextTokens: 4000, enableSummarization: true },
      medium: { maxRecentMessages: 20, maxContextTokens: 8000, enableSummarization: true },
      large: { maxRecentMessages: 40, maxContextTokens: 16000, enableSummarization: true },
    };

    // Use client-specified size, default to medium, premium users can use large
    const requestedSize = contextSize || 'medium';
    const allowedSize = user.tier === 'premium' ? requestedSize :
      (requestedSize === 'large' ? 'medium' : requestedSize);
    const contextConfig = contextSizeConfigs[allowedSize];

    const optimizedContext = optimizeContext(chatId, fullMessageHistory, contextConfig);
    const messageHistory = optimizedContext.messages;

    // Log context optimization stats
    if (optimizedContext.wasSummarized || optimizedContext.summaryIncluded) {
      console.log(`Context optimized for chat ${chatId}: ${optimizedContext.originalCount} → ${optimizedContext.optimizedCount} messages, ~${optimizedContext.estimatedTokens} tokens`);
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const assistantMessageId = generateId();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use real OpenRouter API if configured, otherwise use mock
          const streamFn = isOpenRouterConfigured()
            ? streamOpenRouterResponse
            : streamMockResponse;

          // Stream AI response
          for await (const chunk of streamFn(messageHistory, chat.model)) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            );
          }

          // Save assistant message
          db.insert(messages)
            .values({
              id: assistantMessageId,
              chatId,
              role: 'assistant',
              content: fullResponse,
              model: chat.model,
              parentMessageId: userMessageId,
              createdAt: new Date().toISOString(),
            })
            .run();

          // Auto-generate title if this is the first message
          if (chatMessages.length <= 1) {
            const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
            db.update(chats)
              .set({ title })
              .where(eq(chats.id, chatId))
              .run();
          }

          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
