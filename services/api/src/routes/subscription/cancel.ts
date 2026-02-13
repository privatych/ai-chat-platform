import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

interface AuthRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
  };
}

export async function cancelHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const req = request as AuthRequest;
  const userId = req.user.userId;

  try {
    // Find active subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ),
    });

    if (!subscription) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'У вас нет активной подписки',
        },
      });
    }

    // Update subscription: set cancelAtPeriodEnd=true, canceledAt=now()
    const now = new Date();
    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        canceledAt: now,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscription.id));

    // Format the currentPeriodEnd date for the message
    const periodEndDate = subscription.currentPeriodEnd;
    const formattedDate = periodEndDate
      ? new Date(periodEndDate).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : 'неизвестно';

    return reply.send({
      success: true,
      message: `Автопродление отменено. Premium работает до ${formattedDate}`,
    });
  } catch (error: any) {
    console.error('[Subscription] Cancellation failed:', error);

    return reply.code(500).send({
      success: false,
      error: {
        code: 'CANCELLATION_FAILED',
        message: 'Не удалось отменить подписку',
      },
    });
  }
}
