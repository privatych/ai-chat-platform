import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions, users } from '@ai-chat/database';
import { eq } from 'drizzle-orm';
import { verifyWebhookSignature, YooKassaWebhookEvent } from '../../utils/yookassa-webhook';

export async function webhookHandler(
  request: FastifyRequest<{ Body: YooKassaWebhookEvent }>,
  reply: FastifyReply
) {
  // Verify signature
  const signature = request.headers['x-yookassa-signature'] as string;
  const rawBody = JSON.stringify(request.body);

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    console.error('[Webhook] Invalid signature from IP:', request.ip);
    return reply.code(403).send({ error: 'Invalid signature' });
  }

  const event = request.body;
  const paymentId = event.object.id;

  console.log(`[Webhook] Received ${event.event} for payment ${paymentId}`);

  try {
    // Handle different event types
    switch (event.event) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(paymentId, event);
        break;

      case 'payment.canceled':
        await handlePaymentCanceled(paymentId);
        break;

      case 'refund.succeeded':
        await handleRefundSucceeded(paymentId);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.event}`);
    }

    return reply.send({ received: true });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    return reply.code(500).send({ error: 'Processing failed' });
  }
}

async function handlePaymentSucceeded(paymentId: string, event: YooKassaWebhookEvent) {
  // Find subscription
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.yookassaPaymentId, paymentId),
  });

  if (!sub) {
    console.error(`[Webhook] Subscription not found for payment ${paymentId}`);
    return;
  }

  // Check if already processed (idempotency)
  if (sub.status === 'active') {
    console.log(`[Webhook] Payment ${paymentId} already processed`);
    return;
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  // Update subscription
  await db.update(subscriptions)
    .set({
      status: 'active',
      yookassaSubscriptionId: event.object.payment_method?.id,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextPaymentDate: periodEnd,
      gracePeriodEndsAt: null,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, sub.id));

  // Update user tier
  await db.update(users)
    .set({
      subscriptionTier: 'premium',
      subscriptionExpiresAt: periodEnd,
      updatedAt: now,
    })
    .where(eq(users.id, sub.userId));

  console.log(`[Webhook] Activated Premium for user ${sub.userId}`);
}

async function handlePaymentCanceled(paymentId: string) {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.yookassaPaymentId, paymentId),
  });

  if (!sub) return;

  const now = new Date();
  const gracePeriodEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

  // Check if grace period already expired
  if (sub.gracePeriodEndsAt && now > sub.gracePeriodEndsAt) {
    // Downgrade to Free
    await db.update(subscriptions)
      .set({ status: 'expired', updatedAt: now })
      .where(eq(subscriptions.id, sub.id));

    await db.update(users)
      .set({
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
        updatedAt: now,
      })
      .where(eq(users.id, sub.userId));

    console.log(`[Webhook] Downgraded user ${sub.userId} to Free`);
  } else {
    // Start grace period
    await db.update(subscriptions)
      .set({
        status: 'grace_period',
        gracePeriodEndsAt: gracePeriodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, sub.id));

    console.log(`[Webhook] Started grace period for user ${sub.userId}`);
  }
}

async function handleRefundSucceeded(paymentId: string) {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.yookassaPaymentId, paymentId),
  });

  if (!sub) return;

  const now = new Date();

  // Cancel subscription and downgrade user immediately
  await db.update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: now,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, sub.id));

  await db.update(users)
    .set({
      subscriptionTier: 'free',
      subscriptionExpiresAt: null,
      updatedAt: now,
    })
    .where(eq(users.id, sub.userId));

  console.log(`[Webhook] Handled refund for user ${sub.userId}, downgraded to Free`);
}
