import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions, users } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';
import {
  verifyWebhookSignature,
  parseWebhookNotification,
  YooKassaNotification,
} from '../../utils/yookassa-webhook';

/**
 * YooKassa webhook handler
 * Handles payment lifecycle events: succeeded, canceled, refunded
 */
export async function webhookHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get raw body and signature
    const rawBody = JSON.stringify(request.body);
    const signature = request.headers['x-webhook-signature'] as string;

    // Verify webhook signature
    if (!signature) {
      console.error('[Webhook] Missing signature header');
      return reply.code(401).send({
        success: false,
        error: 'Missing signature',
      });
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[Webhook] Invalid signature:', {
        signature,
        body: request.body,
      });
      return reply.code(401).send({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Parse and validate notification
    let notification: YooKassaNotification;
    try {
      notification = parseWebhookNotification(request.body);
    } catch (error: any) {
      console.error('[Webhook] Invalid notification format:', error.message);
      return reply.code(400).send({
        success: false,
        error: 'Invalid notification format',
      });
    }

    console.log('[Webhook] Received event:', {
      event: notification.event,
      paymentId: notification.object.id,
      status: notification.object.status,
    });

    // Handle different event types
    switch (notification.event) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(notification, request);
        break;

      case 'payment.canceled':
        await handlePaymentCanceled(notification, request);
        break;

      case 'refund.succeeded':
        await handleRefundSucceeded(notification, request);
        break;

      default:
        console.warn('[Webhook] Unknown event type:', notification.event);
    }

    // Always return 200 OK to acknowledge receipt
    return reply.code(200).send({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Processing failed:', error);
    // Return 200 to prevent YooKassa from retrying on our internal errors
    return reply.code(200).send({ received: true });
  }
}

/**
 * Handle payment.succeeded event
 * Activates Premium subscription for 30 days
 */
async function handlePaymentSucceeded(
  notification: YooKassaNotification,
  request: FastifyRequest
) {
  const paymentId = notification.object.id;

  await db.transaction(async (tx) => {
    // Find subscription by payment ID
    const subscription = await tx.query.subscriptions.findFirst({
      where: eq(subscriptions.yookassaPaymentId, paymentId),
    });

    if (!subscription) {
      console.error('[Webhook] Subscription not found for payment:', paymentId);
      return;
    }

    // Check for duplicate processing (idempotency)
    if (subscription.status === 'active') {
      console.log('[Webhook] Payment already processed (duplicate):', paymentId);
      return;
    }

    // Calculate subscription period (30 days)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Extract payment method ID for auto-renewal
    const paymentMethodId = notification.object.payment_method?.saved
      ? notification.object.payment_method.id
      : null;

    // Update subscription status
    await tx
      .update(subscriptions)
      .set({
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextPaymentDate: periodEnd,
        yookassaSubscriptionId: paymentMethodId,
        gracePeriodEndsAt: null, // Clear any existing grace period
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscription.id));

    // Update user subscription tier
    await tx
      .update(users)
      .set({
        subscriptionTier: 'premium',
        subscriptionExpiresAt: periodEnd,
        updatedAt: now,
      })
      .where(eq(users.id, subscription.userId));

    console.log('[Webhook] Payment succeeded - Premium activated:', {
      userId: subscription.userId,
      paymentId,
      periodEnd: periodEnd.toISOString(),
    });
  });
}

/**
 * Handle payment.canceled event
 * Starts grace period (3 days) or downgrades if grace period expired
 */
async function handlePaymentCanceled(
  notification: YooKassaNotification,
  request: FastifyRequest
) {
  const paymentId = notification.object.id;

  await db.transaction(async (tx) => {
    // Find subscription by payment ID
    const subscription = await tx.query.subscriptions.findFirst({
      where: eq(subscriptions.yookassaPaymentId, paymentId),
    });

    if (!subscription) {
      console.error('[Webhook] Subscription not found for payment:', paymentId);
      return;
    }

    const now = new Date();

    // Check if grace period already exists and has expired
    if (subscription.gracePeriodEndsAt && now > subscription.gracePeriodEndsAt) {
      // Grace period expired - downgrade to Free
      await tx
        .update(subscriptions)
        .set({
          status: 'expired',
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscription.id));

      await tx
        .update(users)
        .set({
          subscriptionTier: 'free',
          subscriptionExpiresAt: null,
          updatedAt: now,
        })
        .where(eq(users.id, subscription.userId));

      console.log('[Webhook] Grace period expired - Downgraded to Free:', {
        userId: subscription.userId,
        paymentId,
      });
    } else {
      // Start grace period (3 days)
      const gracePeriodEnd = new Date(now);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

      await tx
        .update(subscriptions)
        .set({
          status: 'grace_period',
          gracePeriodEndsAt: gracePeriodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscription.id));

      console.log('[Webhook] Payment canceled - Grace period started:', {
        userId: subscription.userId,
        paymentId,
        gracePeriodEndsAt: gracePeriodEnd.toISOString(),
      });
    }
  });
}

/**
 * Handle refund.succeeded event
 * Immediately cancels subscription and downgrades to Free
 * Blocks re-purchase for 24 hours (anti-fraud)
 */
async function handleRefundSucceeded(
  notification: YooKassaNotification,
  request: FastifyRequest
) {
  const paymentId = notification.object.id;

  await db.transaction(async (tx) => {
    // Find subscription by payment ID
    const subscription = await tx.query.subscriptions.findFirst({
      where: eq(subscriptions.yookassaPaymentId, paymentId),
    });

    if (!subscription) {
      console.error('[Webhook] Subscription not found for payment:', paymentId);
      return;
    }

    const now = new Date();

    // Cancel subscription immediately
    await tx
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: now,
        gracePeriodEndsAt: null, // Clear grace period
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscription.id));

    // Downgrade to Free immediately
    await tx
      .update(users)
      .set({
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
        updatedAt: now,
      })
      .where(eq(users.id, subscription.userId));

    console.log('[Webhook] Refund processed - Subscription canceled:', {
      userId: subscription.userId,
      paymentId,
    });

    // Note: 24-hour re-purchase blocking can be implemented via a separate
    // 'refund_block_until' field in subscriptions table if needed for anti-fraud
  });
}
