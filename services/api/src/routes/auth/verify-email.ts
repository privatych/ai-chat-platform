import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, users } from '@ai-chat/database';
import { eq, and, gt } from 'drizzle-orm';

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export async function verifyEmailHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const body = verifyEmailSchema.parse(request.body);

    // Find user with this verification token
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.verificationToken, body.token),
          gt(users.verificationExpires, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Неверный или устаревший токен подтверждения',
        },
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return reply.send({
        success: true,
        data: {
          message: 'Email уже подтверждён',
          alreadyVerified: true,
        },
      });
    }

    // Mark email as verified and clear verification token
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[Verify Email] Email verified for user: ${user.email}`);

    // Generate JWT token for automatic login
    const token = request.server.jwt.sign({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      role: user.role,
    });

    return reply.send({
      success: true,
      data: {
        message: 'Email успешно подтверждён! Добро пожаловать!',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          subscriptionTier: user.subscriptionTier,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          role: user.role,
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
