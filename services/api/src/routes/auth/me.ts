import { FastifyRequest, FastifyReply } from 'fastify';
import { db, users } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

export async function meHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      subscriptionTier: users.subscriptionTier,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return reply.code(404).send({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
  }

  return reply.send({
    success: true,
    data: user,
  });
}
