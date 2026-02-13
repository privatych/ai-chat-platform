import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions, users } from '@ai-chat/database';
import { eq, and, or } from 'drizzle-orm';
import { createRecurrentPayment } from '../../services/yookassa';
import { getEnv } from '../../config/env';

interface AuthRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
  };
}

export async function createPaymentHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const req = request as AuthRequest;
  const userId = req.user.userId;

  try {
    const amount = 1990;
    const description = 'Premium подписка AI Chat Platform - 1 месяц';
    const frontendUrl = getEnv('FRONTEND_URL');
    const returnUrl = `${frontendUrl}/subscription/success`;

    // Use transaction to ensure atomicity of check + insert
    const result = await db.transaction(async (tx) => {
      // Check if user already has an active or grace_period subscription
      const existingSub = await tx.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, userId),
          or(
            eq(subscriptions.status, 'active'),
            eq(subscriptions.status, 'grace_period')
          )
        ),
      });

      if (existingSub) {
        throw new Error('SUBSCRIPTION_EXISTS');
      }

      // Create payment in YooKassa with idempotency key
      const idempotenceKey = `sub_${userId}_${Date.now()}`;
      const payment = await createRecurrentPayment({
        amount,
        description,
        returnUrl,
        userId,
      }, idempotenceKey);

      // Save pending subscription in database
      const [newSubscription] = await tx
        .insert(subscriptions)
        .values({
          userId,
          plan: 'premium',
          status: 'pending',
          yookassaPaymentId: payment.id,
        })
        .returning();

      // Extract confirmation URL
      const confirmationUrl =
        payment.confirmation?.type === 'redirect'
          ? payment.confirmation.confirmation_url
          : null;

      if (!confirmationUrl) {
        throw new Error('Payment confirmation URL not received from YooKassa');
      }

      return {
        confirmationUrl,
        paymentId: payment.id,
        amount,
      };
    });

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Subscription] Payment creation failed:', error);

    // Handle specific error cases
    if (error.message === 'SUBSCRIPTION_EXISTS') {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'SUBSCRIPTION_ALREADY_EXISTS',
          message: 'У вас уже есть активная подписка',
        },
      });
    }

    return reply.code(500).send({
      success: false,
      error: {
        code: 'PAYMENT_CREATION_FAILED',
        message: 'Не удалось создать платеж',
      },
    });
  }
}
