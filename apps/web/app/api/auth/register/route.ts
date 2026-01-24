import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { hashPassword, createToken, setSession, generateId } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user
    const userId = generateId();
    const passwordHash = await hashPassword(password);

    db.insert(users)
      .values({
        id: userId,
        email,
        name: name || null,
        passwordHash,
        tier: 'free',
        messagesUsedToday: 0,
        createdAt: new Date().toISOString(),
      })
      .run();

    // Create session token
    const token = await createToken({ userId, email });
    await setSession(token);

    // Get created user (without password hash)
    const user = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        tier: users.tier,
        messagesUsedToday: users.messagesUsedToday,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
