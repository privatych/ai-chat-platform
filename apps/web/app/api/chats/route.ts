import { NextResponse } from 'next/server';
import { db, chats, messages } from '@/lib/db';
import { getSession, generateId } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const createChatSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  title: z.string().optional(),
});

// GET /api/chats - List all chats for current user
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userChats = db
      .select()
      .from(chats)
      .where(eq(chats.userId, session.userId))
      .orderBy(desc(chats.updatedAt))
      .all();

    // Get last message for each chat
    const chatsWithLastMessage = userChats.map((chat) => {
      const lastMessage = db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id))
        .orderBy(desc(messages.createdAt))
        .limit(1)
        .get();

      return {
        ...chat,
        lastMessage: lastMessage?.content?.slice(0, 100) || null,
      };
    });

    return NextResponse.json({ chats: chatsWithLastMessage });
  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/chats - Create new chat
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { model, title } = createChatSchema.parse(body);

    const chatId = generateId();
    const now = new Date().toISOString();

    db.insert(chats)
      .values({
        id: chatId,
        userId: session.userId,
        title: title || 'New Chat',
        model,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const chat = db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .get();

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
