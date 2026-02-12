import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db, users } from '@ai-chat/database';
import { eq } from 'drizzle-orm';
import {
  sendVerificationEmail,
  generateVerificationToken,
  getVerificationExpires
} from '../../services/email';

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

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = getVerificationExpires();

    // Create user with verification token
    const [newUser] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        subscriptionTier: 'free',
        emailVerified: false,
        verificationToken,
        verificationExpires,
      })
      .returning();

    // Send verification email
    try {
      await sendVerificationEmail({
        email: newUser.email,
        fullName: newUser.fullName || '',
        verificationToken,
      });

      console.log(`[Register] Verification email sent to: ${newUser.email}`);
    } catch (emailError) {
      console.error('[Register] Failed to send verification email:', emailError);
      // Don't fail registration if email fails - user can request resend
    }

    return reply.send({
      success: true,
      data: {
        message: 'Регистрация успешна! Проверьте вашу почту для подтверждения email.',
        email: newUser.email,
        requiresVerification: true,
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
