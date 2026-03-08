import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions, users } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';
import { createRecurrentPayment } from '../../services/yookassa';
import { getEnv } from '../../config/env';

export async function createPaymentHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.userId;
  const userEmail = request.user.email;

  // Check if user already has active subscription
  const existingSub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active')
    ),
  });

  if (existingSub) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'SUBSCRIPTION_EXISTS',
        message: 'У вас уже есть активная подписка',
      },
    });
  }

  try {
    console.log(`[Subscription] Starting payment creation for user ${userId} (${userEmail})`);
    
    // Create payment in YooKassa
    const frontendUrl = getEnv('FRONTEND_URL', 'https://ai.itoq.ru');
    const paymentPayload = {
      amount: 1990,
      description: 'Premium подписка AI Chat Platform - 1 месяц',
      returnUrl: `${frontendUrl}/subscription/success`,
      userId,
    };
    
    console.log(`[Subscription] Yookassa payload:`, JSON.stringify(paymentPayload, null, 2));
    
    const payment = await createRecurrentPayment(paymentPayload);

    console.log(`[Subscription] Yookassa response successful:`, JSON.stringify({
      id: payment.id,
      status: payment.status,
      confirmation: payment.confirmation
    }));

    // Save pending subscription
    await db.insert(subscriptions).values({
      userId,
      plan: 'premium',
      status: 'pending',
      yookassaPaymentId: payment.id,
    });

    console.log(`[Subscription] Payment created for user ${userEmail}: ${payment.id}`);

    return reply.send({
      success: true,
      data: {
        confirmationUrl: payment.confirmation?.confirmation_url,
        paymentId: payment.id,
        amount: 1990,
      },
    });
  } catch (error: any) {
    console.error(`[Subscription] Failed to create Yookassa payment for ${userId}:`);
    console.error(`[Subscription] Error details:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
    });

    return reply.code(500).send({
      success: false,
      error: {
        code: 'PAYMENT_CREATION_FAILED',
        message: 'Не удалось создать платёж. Попробуйте позже.',
      },
    });
  }
}
