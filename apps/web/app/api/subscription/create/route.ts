import { NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { getSession, generateId } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// YooKassa configuration
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

// Subscription price in rubles (kopecks for API)
const SUBSCRIPTION_PRICE = '999.00';
const SUBSCRIPTION_CURRENCY = 'RUB';

// POST /api/subscription/create - Create a new subscription payment
export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user
    const user = db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .get();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has premium
    if (user.tier === 'premium') {
      return NextResponse.json(
        { error: 'You already have a premium subscription' },
        { status: 400 }
      );
    }

    // If YooKassa is not configured, use demo mode
    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      // Demo mode - instantly upgrade user
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      db.update(users)
        .set({
          tier: 'premium',
          subscriptionExpiresAt: expiresAt.toISOString(),
        })
        .where(eq(users.id, user.id))
        .run();

      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Demo mode: Premium activated for 30 days',
        redirectUrl: `${APP_URL}/settings?upgraded=true`,
      });
    }

    // Create payment with YooKassa
    const paymentId = generateId();
    const idempotenceKey = `${user.id}-${Date.now()}`;

    const paymentData = {
      amount: {
        value: SUBSCRIPTION_PRICE,
        currency: SUBSCRIPTION_CURRENCY,
      },
      confirmation: {
        type: 'redirect',
        return_url: `${APP_URL}/api/subscription/callback?payment_id=${paymentId}`,
      },
      capture: true,
      description: 'AI Chat Platform - Premium подписка (1 месяц)',
      metadata: {
        user_id: user.id,
        payment_id: paymentId,
      },
    };

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': 'Basic ' + Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64'),
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YooKassa error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    const payment = await response.json();

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      paymentUrl: payment.confirmation.confirmation_url,
    });
  } catch (error) {
    console.error('Subscription create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
