# YooKassa Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate YooKassa payment system with auto-renewal Premium subscriptions (1990₽/month) and message limits for Free users (10/day).

**Architecture:** Fastify API endpoints + YooKassa SDK + PostgreSQL tables for message tracking + webhook handler for payment events + React UI components for subscription management.

**Tech Stack:** @a2seven/yoo-checkout, Fastify, Drizzle ORM, PostgreSQL, React, shadcn/ui

---

## Task 1: Install YooKassa SDK and setup environment

**Files:**
- Modify: `services/api/package.json`
- Modify: `services/api/.env.example`
- Modify: `services/api/.env` (on server)

**Step 1: Install YooKassa SDK**

Run: `cd services/api && pnpm add @a2seven/yoo-checkout`

**Step 2: Add environment variables to .env.example**

Add to `services/api/.env.example`:
```bash
# YooKassa Payment System
YOOKASSA_SHOP_ID=1271639
YOOKASSA_SECRET_KEY=your_secret_key_here
YOOKASSA_WEBHOOK_SECRET=generate_random_secret_here
```

**Step 3: Commit**

```bash
git add services/api/package.json services/api/pnpm-lock.yaml services/api/.env.example
git commit -m "feat(api): add YooKassa SDK dependency

Added @a2seven/yoo-checkout for payment integration.
Added environment variables template for YooKassa credentials.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create message_usage database table

**Files:**
- Create: `packages/database/src/schema/message-usage.ts`
- Modify: `packages/database/src/schema/index.ts`
- Create: `packages/database/drizzle/migrations/XXXX_add_message_usage.sql`

**Step 1: Create message usage schema**

Create `packages/database/src/schema/message-usage.ts`:
```typescript
import { pgTable, uuid, date, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const messageUsage = pgTable('message_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(), // YYYY-MM-DD format
  messageCount: integer('message_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index('idx_message_usage_user_date').on(table.userId, table.date),
  dateIdx: index('idx_message_usage_date').on(table.date),
}));

export type MessageUsage = typeof messageUsage.$inferSelect;
export type NewMessageUsage = typeof messageUsage.$inferInsert;
```

**Step 2: Export from index**

Add to `packages/database/src/schema/index.ts`:
```typescript
export * from './message-usage';
```

**Step 3: Generate migration**

Run: `cd packages/database && pnpm drizzle-kit generate`

**Step 4: Create manual migration SQL**

Create `packages/database/drizzle/XXXX_add_message_usage.sql`:
```sql
CREATE TABLE IF NOT EXISTS message_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_message_usage_user_date ON message_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_message_usage_date ON message_usage(date);
```

**Step 5: Commit**

```bash
git add packages/database/src/schema/message-usage.ts packages/database/src/schema/index.ts packages/database/drizzle/
git commit -m "feat(db): add message_usage table for tracking daily limits

Tracks message count per user per day for Free tier limits.
Includes unique constraint on (user_id, date) and indexes.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update subscriptions table schema

**Files:**
- Modify: `packages/database/src/schema/subscriptions.ts`
- Create: `packages/database/drizzle/migrations/XXXX_update_subscriptions.sql`

**Step 1: Add new fields to subscriptions schema**

Modify `packages/database/src/schema/subscriptions.ts`:
```typescript
import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  plan: varchar('plan', { length: 50 }).notNull(), // 'free', 'premium'
  status: varchar('status', { length: 50 }).notNull(), // 'active', 'grace_period', 'canceled', 'expired'
  yookassaPaymentId: varchar('yookassa_payment_id', { length: 255 }),
  yookassaSubscriptionId: varchar('yookassa_subscription_id', { length: 255 }), // NEW
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  nextPaymentDate: timestamp('next_payment_date'), // NEW
  gracePeriodEndsAt: timestamp('grace_period_ends_at'), // NEW
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at'), // NEW
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
```

**Step 2: Create migration SQL**

Create `packages/database/drizzle/XXXX_update_subscriptions.sql`:
```sql
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS yookassa_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP;

-- Update status column to include 'grace_period'
-- Note: status is already VARCHAR, just document valid values
COMMENT ON COLUMN subscriptions.status IS 'Valid values: active, grace_period, canceled, expired';
```

**Step 3: Commit**

```bash
git add packages/database/src/schema/subscriptions.ts packages/database/drizzle/
git commit -m "feat(db): extend subscriptions table for YooKassa

Added fields for auto-renewal tracking:
- yookassaSubscriptionId (recurrent payment ID)
- nextPaymentDate (when next charge occurs)
- gracePeriodEndsAt (3-day grace after failed payment)
- canceledAt (when user canceled auto-renewal)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create YooKassa service wrapper

**Files:**
- Create: `services/api/src/services/yookassa.ts`
- Modify: `services/api/src/config/env.ts`

**Step 1: Add YooKassa env vars to validation**

Modify `services/api/src/config/env.ts`:
```typescript
export function validateEnv() {
  // ... existing validations ...

  // YooKassa credentials
  getEnv('YOOKASSA_SHOP_ID');
  getEnv('YOOKASSA_SECRET_KEY');
  getEnv('YOOKASSA_WEBHOOK_SECRET');

  console.log('✅ All required environment variables are valid');
}
```

**Step 2: Create YooKassa service**

Create `services/api/src/services/yookassa.ts`:
```typescript
import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout';
import { getEnv } from '../config/env';

const yookassa = new YooCheckout({
  shopId: getEnv('YOOKASSA_SHOP_ID'),
  secretKey: getEnv('YOOKASSA_SECRET_KEY'),
});

interface CreateRecurrentPaymentParams {
  amount: number;
  description: string;
  returnUrl: string;
  userId: string;
}

export async function createRecurrentPayment({
  amount,
  description,
  returnUrl,
  userId,
}: CreateRecurrentPaymentParams) {
  const payment: ICreatePayment = {
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB',
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: returnUrl,
    },
    description,
    save_payment_method: true, // Enable auto-renewal
    metadata: {
      user_id: userId,
    },
  };

  const createdPayment = await yookassa.createPayment(payment);
  return createdPayment;
}

export async function getPaymentInfo(paymentId: string) {
  return await yookassa.getPayment(paymentId);
}

export async function cancelPayment(paymentId: string) {
  return await yookassa.cancelPayment(paymentId);
}

export { yookassa };
```

**Step 3: Commit**

```bash
git add services/api/src/services/yookassa.ts services/api/src/config/env.ts
git commit -m "feat(api): add YooKassa service wrapper

Created service for YooKassa SDK integration:
- createRecurrentPayment() for auto-renewal subscriptions
- getPaymentInfo() for status checks
- cancelPayment() for cancellations
- Environment validation for credentials

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create subscription creation endpoint

**Files:**
- Create: `services/api/src/routes/subscription/create-payment.ts`
- Create: `services/api/src/routes/subscription/index.ts`
- Modify: `services/api/src/app.ts`

**Step 1: Create payment creation handler**

Create `services/api/src/routes/subscription/create-payment.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions, users } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';
import { createRecurrentPayment } from '../../services/yookassa';
import { getEnv } from '../../config/env';

export async function createPaymentHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;
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
    // Create payment in YooKassa
    const frontendUrl = getEnv('FRONTEND_URL', 'https://ai.itoq.ru');
    const payment = await createRecurrentPayment({
      amount: 1990,
      description: 'Premium подписка AI Chat Platform - 1 месяц',
      returnUrl: `${frontendUrl}/subscription/success`,
      userId,
    });

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
    console.error('[Subscription] Failed to create payment:', error);

    return reply.code(500).send({
      success: false,
      error: {
        code: 'PAYMENT_CREATION_FAILED',
        message: 'Не удалось создать платёж. Попробуйте позже.',
      },
    });
  }
}
```

**Step 2: Create subscription routes index**

Create `services/api/src/routes/subscription/index.ts`:
```typescript
import { FastifyInstance } from 'fastify';
import { createPaymentHandler } from './create-payment';

export async function subscriptionRoutes(app: FastifyInstance) {
  // Require authentication for all subscription routes
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
  });

  app.post('/create-payment', createPaymentHandler);
}
```

**Step 3: Register subscription routes in app**

Modify `services/api/src/app.ts`:
```typescript
import { subscriptionRoutes } from './routes/subscription';

export async function buildApp() {
  // ... existing code ...

  // Register routes
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(chatRoutes, { prefix: '/api/chat' });
  app.register(adminRoutes, { prefix: '/api/admin' });
  app.register(subscriptionRoutes, { prefix: '/api/subscription' }); // NEW

  // ... rest of code ...
}
```

**Step 4: Commit**

```bash
git add services/api/src/routes/subscription/ services/api/src/app.ts
git commit -m "feat(api): add subscription payment creation endpoint

POST /api/subscription/create-payment:
- Creates YooKassa recurrent payment (1990₽)
- Saves pending subscription in database
- Returns redirect URL for payment form
- Prevents duplicate active subscriptions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create subscription status endpoint

**Files:**
- Create: `services/api/src/routes/subscription/status.ts`
- Modify: `services/api/src/routes/subscription/index.ts`

**Step 1: Create status handler**

Create `services/api/src/routes/subscription/status.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions, messageUsage } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

export async function statusHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;
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
```

**Step 2: Register status route**

Modify `services/api/src/routes/subscription/index.ts`:
```typescript
import { FastifyInstance } from 'fastify';
import { createPaymentHandler } from './create-payment';
import { statusHandler } from './status';

export async function subscriptionRoutes(app: FastifyInstance) {
  // ... existing auth hook ...

  app.post('/create-payment', createPaymentHandler);
  app.get('/status', statusHandler); // NEW
}
```

**Step 3: Commit**

```bash
git add services/api/src/routes/subscription/status.ts services/api/src/routes/subscription/index.ts
git commit -m "feat(api): add subscription status endpoint

GET /api/subscription/status:
- Returns Premium subscription details (dates, auto-renewal)
- Returns Free tier message usage (X/10 today)
- Used by frontend to display subscription state

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create subscription cancellation endpoint

**Files:**
- Create: `services/api/src/routes/subscription/cancel.ts`
- Modify: `services/api/src/routes/subscription/index.ts`

**Step 1: Create cancellation handler**

Create `services/api/src/routes/subscription/cancel.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, subscriptions } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

export async function cancelHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;

  // Find active subscription
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active')
    ),
  });

  if (!sub) {
    return reply.code(404).send({
      success: false,
      error: {
        code: 'NO_SUBSCRIPTION',
        message: 'У вас нет активной подписки',
      },
    });
  }

  // Update subscription to cancel at period end
  await db.update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id));

  console.log(`[Subscription] User ${userId} canceled auto-renewal`);

  return reply.send({
    success: true,
    data: {
      message: `Автопродление отменено. Premium работает до ${sub.currentPeriodEnd?.toLocaleDateString('ru-RU')}`,
      currentPeriodEnd: sub.currentPeriodEnd,
    },
  });
}
```

**Step 2: Register cancel route**

Modify `services/api/src/routes/subscription/index.ts`:
```typescript
import { FastifyInstance } from 'fastify';
import { createPaymentHandler } from './create-payment';
import { statusHandler } from './status';
import { cancelHandler } from './cancel';

export async function subscriptionRoutes(app: FastifyInstance) {
  // ... existing auth hook ...

  app.post('/create-payment', createPaymentHandler);
  app.get('/status', statusHandler);
  app.post('/cancel', cancelHandler); // NEW
}
```

**Step 3: Commit**

```bash
git add services/api/src/routes/subscription/cancel.ts services/api/src/routes/subscription/index.ts
git commit -m "feat(api): add subscription cancellation endpoint

POST /api/subscription/cancel:
- Cancels auto-renewal (sets cancelAtPeriodEnd=true)
- Premium continues until current period ends
- Does not issue refund

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Create YooKassa webhook handler

**Files:**
- Create: `services/api/src/routes/subscription/webhook.ts`
- Modify: `services/api/src/routes/subscription/index.ts`
- Create: `services/api/src/utils/yookassa-webhook.ts`

**Step 1: Create webhook signature verification utility**

Create `services/api/src/utils/yookassa-webhook.ts`:
```typescript
import crypto from 'crypto';
import { getEnv } from '../config/env';

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = getEnv('YOOKASSA_WEBHOOK_SECRET');
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return hash === signature;
}

export interface YooKassaWebhookEvent {
  type: 'notification';
  event: 'payment.succeeded' | 'payment.canceled' | 'refund.succeeded';
  object: {
    id: string;
    status: string;
    paid: boolean;
    amount: {
      value: string;
      currency: string;
    };
    metadata: {
      user_id?: string;
    };
    payment_method?: {
      id: string;
      saved: boolean;
    };
  };
}
```

**Step 2: Create webhook handler**

Create `services/api/src/routes/subscription/webhook.ts`:
```typescript
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

  // Cancel subscription and downgrade immediately
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

  console.log(`[Webhook] Refunded and downgraded user ${sub.userId}`);
}
```

**Step 3: Register webhook route (no auth)**

Modify `services/api/src/routes/subscription/index.ts`:
```typescript
import { FastifyInstance } from 'fastify';
import { createPaymentHandler } from './create-payment';
import { statusHandler } from './status';
import { cancelHandler } from './cancel';
import { webhookHandler } from './webhook';

export async function subscriptionRoutes(app: FastifyInstance) {
  // Webhook does NOT require authentication (verified by signature)
  app.post('/webhook', webhookHandler);

  // All other routes require auth
  app.addHook('onRequest', async (request, reply) => {
    // Skip auth check for webhook
    if (request.url === '/webhook') return;

    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
  });

  app.post('/create-payment', createPaymentHandler);
  app.get('/status', statusHandler);
  app.post('/cancel', cancelHandler);
}
```

**Step 4: Commit**

```bash
git add services/api/src/routes/subscription/webhook.ts services/api/src/utils/yookassa-webhook.ts services/api/src/routes/subscription/index.ts
git commit -m "feat(api): add YooKassa webhook handler

POST /api/subscription/webhook:
- Verifies webhook signature for security
- Handles payment.succeeded → activate Premium
- Handles payment.canceled → grace period (3 days)
- Handles refund.succeeded → immediate downgrade
- Idempotent (prevents duplicate processing)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create message limit middleware

**Files:**
- Create: `services/api/src/middleware/message-limit.ts`
- Modify: `services/api/src/routes/chat/index.ts`

**Step 1: Create message limit middleware**

Create `services/api/src/middleware/message-limit.ts`:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, messageUsage } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

export async function checkMessageLimit(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.user;
  const tier = user.subscriptionTier || 'free';

  // Premium users have no limit
  if (tier === 'premium') {
    return;
  }

  // For Free users, check daily limit
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Use transaction for thread safety
  await db.transaction(async (tx) => {
    // Get or create usage record
    let usage = await tx.query.messageUsage.findFirst({
      where: and(
        eq(messageUsage.userId, user.id),
        eq(messageUsage.date, today)
      ),
    });

    if (!usage) {
      [usage] = await tx.insert(messageUsage).values({
        userId: user.id,
        date: today,
        messageCount: 0,
      }).returning();
    }

    // Check limit
    if (usage.messageCount >= 10) {
      reply.code(429).send({
        success: false,
        error: {
          code: 'MESSAGE_LIMIT_EXCEEDED',
          message: 'Вы достигли лимита 10 сообщений в день. Перейдите на Premium для безлимитного доступа.',
          messagesUsedToday: usage.messageCount,
          messagesLimit: 10,
          upgradeUrl: '/subscription',
        },
      });
      throw new Error('LIMIT_EXCEEDED'); // Abort transaction
    }

    // Increment counter
    await tx.update(messageUsage)
      .set({
        messageCount: usage.messageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(messageUsage.id, usage.id));
  });
}
```

**Step 2: Apply middleware to chat routes**

Modify `services/api/src/routes/chat/index.ts`:
```typescript
import { checkMessageLimit } from '../../middleware/message-limit';

export async function chatRoutes(app: FastifyInstance) {
  // ... existing auth hook ...

  // Add message limit check before sending messages
  app.addHook('preHandler', async (request, reply) => {
    // Only check limit for message sending endpoints
    if (request.method === 'POST' && request.url.includes('/message')) {
      await checkMessageLimit(request, reply);
    }
  });

  // ... rest of routes ...
}
```

**Step 3: Commit**

```bash
git add services/api/src/middleware/message-limit.ts services/api/src/routes/chat/index.ts
git commit -m "feat(api): add message limit middleware for Free users

Middleware checks daily message limit (10/day) for Free tier:
- Premium users bypass check
- Increments counter atomically (transaction)
- Returns 429 when limit exceeded
- Applied to chat message endpoints

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Create subscription page frontend

**Files:**
- Create: `apps/web/app/subscription/page.tsx`
- Create: `apps/web/components/subscription/SubscriptionCard.tsx`
- Create: `apps/web/components/subscription/CancelDialog.tsx`

**Step 1: Create subscription page**

Create `apps/web/app/subscription/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (hasHydrated && isAuthenticated) {
      loadStatus();
    }
  }, [hasHydrated, isAuthenticated, router]);

  async function loadStatus() {
    try {
      const response = await apiClient.request('/api/subscription/status');
      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!hasHydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Подписка</h1>
      <SubscriptionCard status={status} onUpdate={loadStatus} />
    </div>
  );
}
```

**Step 2: Create subscription card component**

Create `apps/web/components/subscription/SubscriptionCard.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { CancelDialog } from './CancelDialog';

interface SubscriptionCardProps {
  status: any;
  onUpdate: () => void;
}

export function SubscriptionCard({ status, onUpdate }: SubscriptionCardProps) {
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isPremium = status?.tier === 'premium';
  const isGracePeriod = status?.status === 'grace_period';

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const response = await apiClient.request('/api/subscription/create-payment', {
        method: 'POST',
      });

      if (response.success && response.data?.confirmationUrl) {
        window.location.href = response.data.confirmationUrl;
      }
    } catch (error: any) {
      alert(error.message || 'Не удалось создать платёж');
    } finally {
      setUpgrading(false);
    }
  }

  if (isPremium) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Premium подписка</CardTitle>
              <Badge variant={isGracePeriod ? 'destructive' : 'default'}>
                {isGracePeriod ? 'Проблема с оплатой' : 'Активна'}
              </Badge>
            </div>
            <CardDescription>
              Безлимитный доступ ко всем возможностям
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isGracePeriod && status.gracePeriodEndsAt && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">⚠️ Проблема с оплатой!</h3>
                <p className="text-sm">
                  Premium истекает {new Date(status.gracePeriodEndsAt).toLocaleDateString('ru-RU')}
                </p>
                <p className="text-sm mt-2">
                  Проверьте способ оплаты или обновите карту
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Статус:</span>
                <span>Активна до {new Date(status.currentPeriodEnd).toLocaleDateString('ru-RU')}</span>
              </div>

              {status.nextPaymentDate && status.autoRenew && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Следующее списание:</span>
                  <span>{new Date(status.nextPaymentDate).toLocaleDateString('ru-RU')} - 1990₽</span>
                </div>
              )}

              {!status.autoRenew && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Автопродление:</span>
                  <span className="text-destructive">Отменено</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Ваши преимущества:</h4>
              <ul className="space-y-1 text-sm">
                <li>✓ Безлимитные сообщения</li>
                <li>✓ Доступ ко всем AI моделям</li>
                <li>✓ Приоритетная поддержка</li>
                <li>✓ Без рекламы</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter>
            {status.autoRenew && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="w-full"
              >
                Отменить автопродление
              </Button>
            )}
          </CardFooter>
        </Card>

        <CancelDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          currentPeriodEnd={status.currentPeriodEnd}
          onSuccess={onUpdate}
        />
      </>
    );
  }

  // Free tier
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Бесплатная подписка</CardTitle>
          <Badge variant="secondary">Free</Badge>
        </div>
        <CardDescription>
          Ограниченный доступ
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-4">
          <div className="text-2xl font-bold mb-1">
            {status?.messagesUsedToday || 0} / {status?.messagesLimit || 10}
          </div>
          <p className="text-sm text-muted-foreground">
            Сообщений использовано сегодня
          </p>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Premium преимущества:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Безлимитные сообщения</li>
            <li>✓ Доступ ко всем моделям</li>
            <li>✓ Приоритетная поддержка</li>
            <li>✓ Без рекламы</li>
          </ul>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold">1990₽</span>
            <span className="text-muted-foreground">/месяц</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Автопродление, отмена в любой момент
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="w-full"
          size="lg"
        >
          {upgrading ? 'Загрузка...' : 'Перейти на Premium'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Step 3: Create cancel dialog**

Create `apps/web/components/subscription/CancelDialog.tsx`:
```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPeriodEnd: string;
  onSuccess: () => void;
}

export function CancelDialog({
  open,
  onOpenChange,
  currentPeriodEnd,
  onSuccess
}: CancelDialogProps) {
  const [canceling, setCanceling] = useState(false);

  async function handleCancel() {
    setCanceling(true);
    try {
      const response = await apiClient.request('/api/subscription/cancel', {
        method: 'POST',
      });

      if (response.success) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      alert(error.message || 'Не удалось отменить подписку');
    } finally {
      setCanceling(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отменить автопродление?</DialogTitle>
          <DialogDescription>
            Premium подписка продолжит работать до{' '}
            {new Date(currentPeriodEnd).toLocaleDateString('ru-RU')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            После отмены автопродления вы сможете пользоваться Premium до конца оплаченного периода.
            Затем подписка автоматически понизится до Free (10 сообщений в день).
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={canceling}
          >
            Оставить Premium
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={canceling}
          >
            {canceling ? 'Отмена...' : 'Отменить автопродление'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/app/subscription/ apps/web/components/subscription/
git commit -m "feat(web): add subscription management page

Created /subscription page with components:
- SubscriptionCard: displays Free/Premium status
- Free tier: shows message usage (X/10), upgrade button
- Premium tier: shows dates, auto-renewal status
- CancelDialog: confirms subscription cancellation
- Upgrade flow: redirects to YooKassa payment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Create message limit modal

**Files:**
- Create: `apps/web/components/chat/MessageLimitModal.tsx`
- Modify: `apps/web/components/chat/ChatInterface.tsx`

**Step 1: Create limit modal component**

Create `apps/web/components/chat/MessageLimitModal.tsx`:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MessageLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messagesUsed: number;
}

export function MessageLimitModal({
  open,
  onOpenChange,
  messagesUsed
}: MessageLimitModalProps) {
  const router = useRouter();

  function handleUpgrade() {
    router.push('/subscription');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Лимит сообщений исчерпан</DialogTitle>
          <DialogDescription>
            Вы использовали все {messagesUsed} бесплатных сообщений сегодня
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm">
            Новые сообщения будут доступны завтра.
          </p>

          <div className="border rounded-lg p-4 bg-primary/5">
            <h4 className="font-semibold mb-3">
              Получите безлимитный доступ
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Неограниченные сообщения</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Все AI модели</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Приоритетная поддержка</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Без рекламы</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">1990₽</span>
                <span className="text-muted-foreground text-sm">/месяц</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button onClick={handleUpgrade}>
            Получить Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Integrate modal into chat interface**

Modify `apps/web/components/chat/ChatInterface.tsx`:
```typescript
import { MessageLimitModal } from './MessageLimitModal';

export function ChatInterface() {
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ used: 0, limit: 10 });

  // ... existing code ...

  async function handleSendMessage(content: string) {
    try {
      // ... existing message sending code ...
    } catch (error: any) {
      // Check if it's a rate limit error
      if (error.error?.code === 'MESSAGE_LIMIT_EXCEEDED') {
        setLimitInfo({
          used: error.error.messagesUsedToday || 10,
          limit: error.error.messagesLimit || 10,
        });
        setShowLimitModal(true);
        return;
      }

      // ... existing error handling ...
    }
  }

  return (
    <>
      {/* ... existing chat UI ... */}

      <MessageLimitModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
        messagesUsed={limitInfo.used}
      />
    </>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/components/chat/MessageLimitModal.tsx apps/web/components/chat/ChatInterface.tsx
git commit -m "feat(web): add message limit modal

Shows modal when Free user hits 10 message limit:
- Explains limit exhausted
- Lists Premium benefits
- Provides upgrade button → /subscription
- Triggered by 429 MESSAGE_LIMIT_EXCEEDED error

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Add navigation link to subscription page

**Files:**
- Modify: `apps/web/components/user-menu.tsx`

**Step 1: Add subscription link to user menu**

Modify `apps/web/components/user-menu.tsx`:
```typescript
import Link from 'next/link';

export function UserMenu() {
  // ... existing code ...

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* ... existing trigger ... */}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {user?.email}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Add subscription link */}
        <DropdownMenuItem asChild>
          <Link href="/subscription">
            <CreditCard className="mr-2 h-4 w-4" />
            Подписка
          </Link>
        </DropdownMenuItem>

        {user?.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="mr-2 h-4 w-4" />
              Админ панель
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Import CreditCard icon**

Add to imports:
```typescript
import { CreditCard, LogOut, Shield } from 'lucide-react';
```

**Step 3: Commit**

```bash
git add apps/web/components/user-menu.tsx
git commit -m "feat(web): add subscription link to user menu

Added 'Подписка' menu item with CreditCard icon.
Links to /subscription page for managing Premium.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Run database migrations

**Files:**
- Run migrations on production

**Step 1: Review generated migration files**

Run: `cd packages/database && ls -la drizzle/`

**Step 2: Apply migrations to production database**

Run on server:
```bash
ssh root@146.103.97.73
cd /var/www/ai-chat-platform/packages/database
sudo -u postgres psql aichatdb < drizzle/XXXX_add_message_usage.sql
sudo -u postgres psql aichatdb < drizzle/XXXX_update_subscriptions.sql
```

**Step 3: Verify tables created**

Run:
```sql
\d message_usage
\d subscriptions
```

**Step 4: Document completion**

No git commit needed - migrations applied directly to database.

---

## Task 14: Add YooKassa credentials to production .env

**Files:**
- Modify: `/var/www/ai-chat-platform/services/api/.env` (on server)

**Step 1: SSH to server and add credentials**

Run:
```bash
ssh root@146.103.97.73
cd /var/www/ai-chat-platform/services/api
nano .env
```

Add:
```bash
# YooKassa Payment System
YOOKASSA_SHOP_ID=1271639
YOOKASSA_SECRET_KEY=live_4QBVpEax6dRSGhrv8tRQbzzj-mrbT9sALDWvKhdojvs
YOOKASSA_WEBHOOK_SECRET=<generate strong random string>
```

**Step 2: Generate webhook secret**

Run: `openssl rand -hex 32`

Use output as YOOKASSA_WEBHOOK_SECRET

**Step 3: Save and restart API**

Run:
```bash
pm2 restart ai-chat-api
pm2 logs ai-chat-api --lines 20
```

Verify no errors about missing env vars.

**Step 4: Document completion**

No git commit - credentials are sensitive and server-only.

---

## Task 15: Configure YooKassa webhook URL

**Files:**
- Configure in YooKassa dashboard

**Step 1: Get webhook URL**

Webhook URL: `https://ai.itoq.ru/api/subscription/webhook`

**Step 2: Login to YooKassa dashboard**

Visit: https://yookassa.ru/my/merchants

**Step 3: Add webhook**

Navigate to: Settings → Webhooks → Add webhook

Configure:
- URL: `https://ai.itoq.ru/api/subscription/webhook`
- Events: `payment.succeeded`, `payment.canceled`, `refund.succeeded`
- HTTP method: POST
- Content type: application/json

**Step 4: Save webhook secret**

YooKassa generates a secret - save it as YOOKASSA_WEBHOOK_SECRET in .env

**Step 5: Test webhook**

Send test webhook from YooKassa dashboard to verify it works.

---

## Task 16: Test complete payment flow

**Files:**
- Manual testing

**Step 1: Create test Free user**

Register new user or use existing Free account.

**Step 2: Test message limits**

Send 10 messages to trigger limit modal.
Verify modal appears with upgrade offer.

**Step 3: Test subscription creation**

Click "Перейти на Premium" → should redirect to YooKassa.

**Step 4: Test payment (use test card)**

Use test card: `1111 1111 1111 1026`, CVV: `123`, Exp: `12/26`

Complete payment flow.

**Step 5: Verify webhook activation**

Check API logs: `pm2 logs ai-chat-api`

Should see: `[Webhook] Activated Premium for user XXX`

**Step 6: Verify Premium access**

- User should have unlimited messages
- `/subscription` page should show Premium status
- Next payment date should be +30 days

**Step 7: Test cancellation**

Click "Отменить автопродление" → verify works until period end.

**Step 8: Document test results**

No git commit - this is manual testing phase.

---

## Task 17: Final deployment and testing

**Files:**
- Deploy to production

**Step 1: Push all changes to main branch**

Run:
```bash
git push origin feature/yookassa-integration
```

Create PR and merge to main.

**Step 2: Deploy to production**

Run from main branch:
```bash
ssh root@146.103.97.73
cd /var/www/ai-chat-platform
git pull origin main
pnpm build
pm2 restart all
```

**Step 3: Verify deployment**

Check:
- API starts without errors: `pm2 logs ai-chat-api`
- Web builds successfully
- /subscription page loads
- Webhook endpoint is accessible

**Step 4: Smoke test in production**

- Register new Free user
- Send 10 messages
- Verify limit modal appears
- Test Premium upgrade flow
- Verify payment works with real card

**Step 5: Monitor for issues**

Watch logs for first hour after deployment:
```bash
pm2 logs --lines 100
```

**Step 6: Document completion**

Implementation complete! 🎉

---

## Summary

This plan implements complete YooKassa integration with:

✅ Database schema (message_usage + subscriptions updates)
✅ YooKassa SDK integration
✅ Payment creation endpoint
✅ Webhook handler (payment.succeeded, canceled, refund)
✅ Message limit middleware (10/day for Free)
✅ Subscription management endpoints (status, cancel)
✅ Frontend subscription page
✅ Message limit modal
✅ Navigation integration
✅ Production deployment

**Total tasks:** 17
**Estimated time:** 4-6 hours
**Testing:** Manual + production smoke tests
