import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db, users } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
});

export async function registerHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const body = registerSchema.parse(request.body);

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (existingUser.length > 0) {
      return reply.code(400).send({
        success: false,
        error: { code: 'USER_EXISTS', message: 'Email already registered' },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        subscriptionTier: 'free',
      })
      .returning();

    // Generate JWT
    const token = request.server.jwt.sign({
      userId: newUser.id,
      email: newUser.email,
      subscriptionTier: newUser.subscriptionTier,
    });

    return reply.send({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          subscriptionTier: newUser.subscriptionTier,
          subscriptionExpiresAt: newUser.subscriptionExpiresAt,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
    }
    throw error;
  }
}
