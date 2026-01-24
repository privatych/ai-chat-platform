import { NextResponse } from 'next/server';
import { db, chats, messages } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';

const updateChatSchema = z.object({
  title: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
});

// GET /api/chats/[id] - Get chat with messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const chat = db
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.userId, session.userId)))
      .get();

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    const chatMessages = db
      .select()
      .from(messages)
      .where(eq(messages.chatId, id))
      .orderBy(asc(messages.createdAt))
      .all();

    return NextResponse.json({ chat, messages: chatMessages });
  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/chats/[id] - Update chat
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updates = updateChatSchema.parse(body);

    // Check ownership
    const chat = db
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.userId, session.userId)))
      .get();

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    db.update(chats)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chats.id, id))
      .run();

    const updatedChat = db
      .select()
      .from(chats)
      .where(eq(chats.id, id))
      .get();

    return NextResponse.json({ chat: updatedChat });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Update chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/chats/[id] - Delete chat
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check ownership
    const chat = db
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.userId, session.userId)))
      .get();

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Delete chat (messages will be cascade deleted)
    db.delete(chats).where(eq(chats.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
