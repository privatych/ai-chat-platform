import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions, messageUsage } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

interface AuthRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
    subscriptionTier: string;
  };
}

export async function statusHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const req = request as AuthRequest;
  const userId = req.user.userId;
  const tier = req.user.subscriptionTier || 'free';

  try {
    // If user has Premium subscription
    if (tier === 'premium') {
      // Get subscription details
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });

      if (!subscription) {
        // Premium user without subscription record - fallback to free tier data
        return reply.send({
          success: true,
          data: {
            tier: 'free',
            status: 'active',
            messagesUsedToday: await getMessagesUsedToday(userId),
            messagesLimit: 10,
          },
        });
      }

      // Return Premium subscription details
      return reply.send({
        success: true,
        data: {
          tier: 'premium',
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          nextPaymentDate: subscription.nextPaymentDate,
          autoRenew: !subscription.cancelAtPeriodEnd,
          gracePeriodEndsAt: subscription.gracePeriodEndsAt,
          messagesUsedToday: null,
        },
      });
    }

    // For Free users
    const messagesUsedToday = await getMessagesUsedToday(userId);

    return reply.send({
      success: true,
      data: {
        tier: 'free',
        status: 'active',
        messagesUsedToday,
        messagesLimit: 10,
      },
    });
  } catch (error) {
    console.error('[Subscription] Status fetch failed:', error);

    return reply.code(500).send({
      success: false,
      error: {
        code: 'STATUS_FETCH_FAILED',
        message: 'Не удалось получить статус подписки',
      },
    });
  }
}

/**
 * Helper function to get message count for today
 */
async function getMessagesUsedToday(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const usage = await db.query.messageUsage.findFirst({
    where: and(
      eq(messageUsage.userId, userId),
      eq(messageUsage.date, today)
    ),
  });

  return usage?.messageCount || 0;
}
