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

    // TEMPORARY: Auto-verify users until SMTP is configured
    // TODO: Re-enable email verification when SMTP ports are unblocked
    const [newUser] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        subscriptionTier: 'free',
        emailVerified: true, // Auto-verify (SMTP blocked by hosting)
        verificationToken: null,
        verificationExpires: null,
      })
      .returning();

    console.log(`[Register] User auto-verified: ${newUser.email}`);

    // Generate JWT token for immediate login
    const token = request.server.jwt.sign({
      userId: newUser.id,
      email: newUser.email,
      subscriptionTier: newUser.subscriptionTier,
      role: newUser.role,
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
          role: newUser.role,
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
