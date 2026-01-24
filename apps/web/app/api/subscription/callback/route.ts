import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

// GET /api/subscription/callback - Handle payment return
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.redirect(`${APP_URL}/pricing?error=missing_payment_id`);
    }

    // If YooKassa is not configured, redirect to settings
    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      return NextResponse.redirect(`${APP_URL}/settings?upgraded=true`);
    }

    // Get payment status from YooKassa
    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64'),
      },
    });

    if (!response.ok) {
      console.error('Failed to get payment status');
      return NextResponse.redirect(`${APP_URL}/pricing?error=payment_failed`);
    }

    const payment = await response.json();

    if (payment.status === 'succeeded') {
      // Payment successful - activate subscription
      const userId = payment.metadata?.user_id;

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

        return NextResponse.redirect(`${APP_URL}/settings?upgraded=true`);
      }
    } else if (payment.status === 'pending') {
      return NextResponse.redirect(`${APP_URL}/pricing?status=pending`);
    } else {
      return NextResponse.redirect(`${APP_URL}/pricing?error=payment_${payment.status}`);
    }

    return NextResponse.redirect(`${APP_URL}/pricing`);
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(`${APP_URL}/pricing?error=callback_failed`);
  }
}
