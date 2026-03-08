import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

export async function cancelHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.userId;

  // Find active subscription
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active')
    ),
  });

  if (!sub) {
    return reply.code(404).send({
      success: false,
      error: {
        code: 'NO_SUBSCRIPTION',
        message: 'У вас нет активной подписки',
      },
    });
  }

  // Update subscription to cancel at period end
  await db.update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id));

  console.log(`[Subscription] User ${userId} canceled auto-renewal`);

  return reply.send({
    success: true,
    data: {
      message: `Автопродление отменено. Premium работает до ${sub.currentPeriodEnd?.toLocaleDateString('ru-RU')}`,
      currentPeriodEnd: sub.currentPeriodEnd,
    },
  });
}
