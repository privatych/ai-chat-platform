import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions, messageUsage } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

export async function statusHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.userId;
  const tier = request.user.subscriptionTier || 'free';

  // Get subscription info if Premium
  if (tier === 'premium') {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    return reply.send({
      success: true,
      data: {
        tier: 'premium',
        status: sub?.status || 'active',
        currentPeriodEnd: sub?.currentPeriodEnd,
        nextPaymentDate: sub?.nextPaymentDate,
        autoRenew: !sub?.cancelAtPeriodEnd,
        gracePeriodEndsAt: sub?.gracePeriodEndsAt,
      },
    });
  }

  // For Free users, get message usage
  const today = new Date().toISOString().split('T')[0];
  const usage = await db.query.messageUsage.findFirst({
    where: and(
      eq(messageUsage.userId, userId),
      eq(messageUsage.date, today)
    ),
  });

  return reply.send({
    success: true,
    data: {
      tier: 'free',
      status: 'active',
      messagesUsedToday: usage?.messageCount || 0,
      messagesLimit: 10,
    },
  });
}
