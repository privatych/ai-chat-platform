import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

// POST /api/subscription/webhook - Handle YooKassa webhooks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, object: payment } = body;

    console.log('YooKassa webhook received:', event, payment?.id);

    if (event === 'payment.succeeded') {
      const userId = payment?.metadata?.user_id;

      if (userId) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        db.update(users)
          .set({
            tier: 'premium',
            subscriptionExpiresAt: expiresAt.toISOString(),
          })
          .where(eq(users.id, userId))
          .run();

        console.log(`Premium activated for user ${userId}`);
      }
    } else if (event === 'payment.canceled') {
      console.log('Payment canceled:', payment?.id);
    } else if (event === 'refund.succeeded') {
      // Handle refund - downgrade user
      const userId = payment?.metadata?.user_id;

      if (userId) {
        db.update(users)
          .set({
            tier: 'free',
            subscriptionExpiresAt: null,
          })
          .where(eq(users.id, userId))
          .run();

        console.log(`Premium deactivated for user ${userId} due to refund`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
