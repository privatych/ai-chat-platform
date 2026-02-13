# YooKassa Integration Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate YooKassa payment system for Premium subscriptions with message limits for Free users.

**Architecture:** Fastify API + YooKassa SDK + webhook handling + message usage tracking + auto-renewal subscriptions

**Tech Stack:**
- YooKassa SDK: @a2seven/yoo-checkout
- Fastify + JWT auth
- PostgreSQL (Drizzle ORM)
- Existing subscriptions table + new message_usage table

---

## Requirements

### Subscription Tiers
- **Free:** 10 messages per day limit
- **Premium:** 1990₽/month, unlimited messages, auto-renewal

### Payment Flow
- Auto-renewal (recurrent payments) with saved card
- Grace period: 3 days on failed payment
- No trial period
- Cancel anytime (works until period end)

### UI/UX
- Upgrade button in profile/settings
- Modal when hitting Free limit
- Status display for Premium users

### Credentials
- API Key: `live_4QBVpEax6dRSGhrv8tRQbzzj-mrbT9sALDWvKhdojvs`
- ShopID: `1271639`

---

## Database Schema

### New Table: `message_usage`
```sql
CREATE TABLE message_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_message_usage_user_date ON message_usage(user_id, date);
```

### Updated Table: `subscriptions`
```sql
-- Add new columns:
ALTER TABLE subscriptions ADD COLUMN yookassa_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN next_payment_date TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN grace_period_ends_at TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN canceled_at TIMESTAMP;

-- Update status enum to include 'grace_period'
-- status: 'active' | 'grace_period' | 'expired' | 'canceled'
```

---

## API Endpoints

### 1. POST `/api/subscription/create-payment`
**Auth:** Required (JWT)

**Request:** Empty (userId from JWT)

**Response:**
```json
{
  "confirmationUrl": "https://yookassa.ru/...",
  "paymentId": "2d9f8...",
  "amount": 1990
}
```

**Logic:**
1. Check user doesn't have active subscription
2. Create recurrent payment in YooKassa (save_payment_method=true)
3. Amount: 1990₽, description: "Premium подписка на месяц"
4. Save in subscriptions with status='pending'
5. Return confirmationUrl for redirect

---

### 2. POST `/api/subscription/cancel`
**Auth:** Required (JWT)

**Request:** Empty

**Response:**
```json
{
  "success": true,
  "message": "Автопродление отменено. Premium работает до DD.MM.YYYY"
}
```

**Logic:**
1. Find active subscription
2. Cancel auto-renewal in YooKassa
3. Update status='canceled', canceledAt=now()
4. Premium continues until currentPeriodEnd

---

### 3. GET `/api/subscription/status`
**Auth:** Required (JWT)

**Response:**
```json
{
  "tier": "premium",
  "status": "active",
  "currentPeriodEnd": "2026-03-13T10:00:00Z",
  "nextPaymentDate": "2026-03-13T10:00:00Z",
  "autoRenew": true,
  "messagesUsedToday": null
}
```

For Free users:
```json
{
  "tier": "free",
  "status": "active",
  "messagesUsedToday": 7,
  "messagesLimit": 10
}
```

---

### 4. POST `/api/subscription/webhook`
**Auth:** None (public, protected by signature)

**Events from YooKassa:**

#### payment.succeeded
```typescript
1. Verify webhook signature
2. Find subscription by payment_id
3. Update status='active'
4. Set currentPeriodEnd = now() + 30 days
5. Set nextPaymentDate = now() + 30 days
6. Save yookassaSubscriptionId for auto-renewal
7. Update users.subscriptionTier='premium'
8. Update users.subscriptionExpiresAt
9. Return 200 OK
```

#### payment.canceled
```typescript
1. Find subscription
2. If gracePeriodEndsAt exists and now() > gracePeriodEndsAt:
   - Downgrade to Free (subscriptionTier='free')
   - Update status='expired'
3. Else:
   - Set gracePeriodEndsAt = now() + 3 days
   - Update status='grace_period'
4. Return 200 OK
```

#### refund.succeeded
```typescript
1. Cancel subscription
2. Downgrade to Free immediately
3. Set status='canceled'
4. Block re-purchase for 24 hours (anti-fraud)
5. Return 200 OK
```

---

## Message Limits Middleware

### Endpoint: POST `/api/chat/message` (or similar)

**Middleware Logic:**
```typescript
async function checkMessageLimit(request, reply) {
  const { subscriptionTier } = request.user; // from JWT

  if (subscriptionTier === 'premium') {
    return; // No limit for Premium
  }

  // For Free users
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Get or create usage record for today
  let usage = await db.query.messageUsage.findFirst({
    where: and(
      eq(messageUsage.userId, request.user.id),
      eq(messageUsage.date, today)
    )
  });

  if (!usage) {
    usage = await db.insert(messageUsage).values({
      userId: request.user.id,
      date: today,
      messageCount: 0
    }).returning();
  }

  if (usage.messageCount >= 10) {
    return reply.code(429).send({
      success: false,
      error: {
        code: 'MESSAGE_LIMIT_EXCEEDED',
        message: 'Вы достигли лимита 10 сообщений в день. Перейдите на Premium для безлимитного доступа.',
        messagesUsedToday: usage.messageCount,
        upgradeUrl: '/subscription'
      }
    });
  }

  // Increment counter (use transaction for thread safety)
  await db.update(messageUsage)
    .set({
      messageCount: usage.messageCount + 1,
      updatedAt: new Date()
    })
    .where(eq(messageUsage.id, usage.id));
}
```

---

## Frontend Components

### 1. Subscription Page (`/subscription` or `/settings/subscription`)

**For Free Users:**
```tsx
<div>
  <h2>Бесплатная подписка</h2>
  <p>Использовано сегодня: {messagesUsedToday} / 10 сообщений</p>

  <div className="premium-benefits">
    <h3>Premium преимущества:</h3>
    <ul>
      <li>✓ Безлимитные сообщения</li>
      <li>✓ Доступ ко всем моделям</li>
      <li>✓ Приоритетная поддержка</li>
    </ul>
  </div>

  <Button onClick={handleUpgrade}>
    Перейти на Premium - 1990₽/мес
  </Button>
</div>
```

**For Premium Users:**
```tsx
<div>
  <h2>Premium подписка</h2>
  <p>Статус: Активна до {formatDate(currentPeriodEnd)}</p>
  <p>Следующее списание: {formatDate(nextPaymentDate)} - 1990₽</p>

  <Button variant="destructive" onClick={handleCancel}>
    Отменить автопродление
  </Button>

  <p className="text-sm text-muted">
    При отмене Premium будет работать до {formatDate(currentPeriodEnd)}
  </p>
</div>
```

**For Grace Period:**
```tsx
<div className="alert alert-warning">
  <h3>⚠️ Проблема с оплатой!</h3>
  <p>Premium истекает через {daysLeft} дней</p>
  <p>Проверьте способ оплаты или обновите карту</p>

  <Button onClick={handleUpdatePayment}>
    Обновить способ оплаты
  </Button>
</div>
```

---

### 2. Message Limit Modal

```tsx
<Dialog open={limitReached}>
  <DialogHeader>
    <DialogTitle>Лимит сообщений исчерпан</DialogTitle>
  </DialogHeader>

  <DialogContent>
    <p>Вы использовали все 10 бесплатных сообщений сегодня.</p>
    <p>Новые сообщения будут доступны завтра.</p>

    <div className="premium-offer">
      <h4>Получите безлимитный доступ</h4>
      <p>Premium подписка - 1990₽/месяц</p>
      <ul>
        <li>✓ Неограниченные сообщения</li>
        <li>✓ Все AI модели</li>
        <li>✓ Без рекламы</li>
      </ul>
    </div>
  </DialogContent>

  <DialogFooter>
    <Button variant="outline" onClick={close}>Закрыть</Button>
    <Button onClick={() => router.push('/subscription')}>
      Получить Premium
    </Button>
  </DialogFooter>
</Dialog>
```

---

## Security

### 1. Webhook Protection
```typescript
// Verify YooKassa signature
import crypto from 'crypto';

function verifyWebhookSignature(body: string, signature: string): boolean {
  const shopPassword = process.env.YOOKASSA_SECRET_KEY;
  const hash = crypto
    .createHmac('sha256', shopPassword)
    .update(body)
    .digest('hex');

  return hash === signature;
}

// IP Whitelist (YooKassa IPs)
const YOOKASSA_IPS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
  '77.75.154.128/25'
];
```

### 2. Rate Limiting
```typescript
// Create payment: 5 attempts per hour per user
app.post('/api/subscription/create-payment', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '1 hour',
      keyGenerator: (request) => request.user.id
    }
  }
}, handler);

// Webhook: 100 requests per minute globally
app.post('/api/subscription/webhook', {
  config: {
    rateLimit: {
      max: 100,
      timeWindow: '1 minute'
    }
  }
}, handler);
```

### 3. Environment Variables
```bash
# .env
YOOKASSA_SHOP_ID=1271639
YOOKASSA_SECRET_KEY=live_4QBVpEax6dRSGhrv8tRQbzzj-mrbT9sALDWvKhdojvs
YOOKASSA_WEBHOOK_SECRET=<generate random secret>
```

---

## Error Handling

### 1. Payment Failures
```typescript
try {
  const payment = await yookassa.createPayment(paymentData);
} catch (error) {
  if (error.code === 'invalid_request') {
    return reply.code(400).send({
      error: 'Неверные данные для создания платежа'
    });
  }

  if (error.code === 'gateway_timeout') {
    return reply.code(503).send({
      error: 'Сервис временно недоступен, попробуйте позже'
    });
  }

  // Log error for monitoring
  logger.error('YooKassa payment creation failed', error);

  return reply.code(500).send({
    error: 'Не удалось создать платёж'
  });
}
```

### 2. Race Conditions
```typescript
// Use database transaction for message count increment
await db.transaction(async (tx) => {
  const usage = await tx.query.messageUsage.findFirst({
    where: and(
      eq(messageUsage.userId, userId),
      eq(messageUsage.date, today)
    ),
    lock: 'pessimistic_write' // Pessimistic lock
  });

  if (usage.messageCount >= 10) {
    throw new Error('LIMIT_EXCEEDED');
  }

  await tx.update(messageUsage)
    .set({ messageCount: usage.messageCount + 1 })
    .where(eq(messageUsage.id, usage.id));
});
```

### 3. Duplicate Webhooks
```typescript
// Idempotency check
const existingPayment = await db.query.subscriptions.findFirst({
  where: eq(subscriptions.yookassaPaymentId, paymentId)
});

if (existingPayment && existingPayment.status === 'active') {
  // Already processed, return success
  return reply.code(200).send({ received: true });
}
```

---

## Cron Jobs

### Grace Period Expiration Check
```typescript
// Run every hour
async function checkExpiredGracePeriods() {
  const expired = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.status, 'grace_period'),
      lt(subscriptions.gracePeriodEndsAt, new Date())
    )
  });

  for (const sub of expired) {
    await db.transaction(async (tx) => {
      // Downgrade to Free
      await tx.update(users)
        .set({
          subscriptionTier: 'free',
          subscriptionExpiresAt: null
        })
        .where(eq(users.id, sub.userId));

      // Update subscription status
      await tx.update(subscriptions)
        .set({ status: 'expired' })
        .where(eq(subscriptions.id, sub.id));
    });

    // Send email notification (if SMTP configured)
    logger.info(`Downgraded user ${sub.userId} to Free after grace period`);
  }
}
```

---

## Testing Strategy

### 1. Test Mode Setup
```bash
# Use test credentials for development
YOOKASSA_SHOP_ID=1271639
YOOKASSA_SECRET_KEY=test_XXXXXXXXXX # Get from YooKassa dashboard
```

### 2. Test Cards
- Success: `1111 1111 1111 1026`, CVV: `123`, Exp: `12/26`
- Decline: `1111 1111 1111 1027`, CVV: `123`, Exp: `12/26`

### 3. Unit Tests
```typescript
describe('Message Limits', () => {
  it('should allow Premium users unlimited messages', async () => {
    // Test Premium bypass
  });

  it('should block Free users after 10 messages', async () => {
    // Test limit enforcement
  });

  it('should reset counter at midnight UTC', async () => {
    // Test daily reset
  });
});

describe('Webhook Handler', () => {
  it('should activate Premium on payment.succeeded', async () => {
    // Test activation flow
  });

  it('should start grace period on payment.canceled', async () => {
    // Test grace period
  });

  it('should ignore duplicate webhooks', async () => {
    // Test idempotency
  });
});
```

---

## Monitoring & Logging

### Key Metrics
- Free → Premium conversion rate
- Churn rate (canceled subscriptions)
- Failed payment rate
- Average revenue per user (ARPU)
- Message usage distribution

### Alerts
- Failed webhook processing
- Unusual spike in payment failures
- Grace period expirations
- Refund requests

### Logs to Track
```typescript
logger.info('Payment created', {
  userId,
  paymentId,
  amount: 1990
});

logger.info('Webhook received', {
  event: 'payment.succeeded',
  paymentId
});

logger.warn('Payment failed', {
  userId,
  reason: 'insufficient_funds'
});

logger.error('Webhook signature invalid', {
  ip: request.ip
});
```

---

## Migration Plan

### Phase 1: Database Setup
1. Create `message_usage` table
2. Add new columns to `subscriptions` table
3. Run migration on production

### Phase 2: Backend Implementation
1. Install YooKassa SDK
2. Implement API endpoints
3. Add webhook handler
4. Add message limits middleware
5. Add cron job for grace period checks

### Phase 3: Frontend Implementation
1. Create subscription page
2. Add limit modal
3. Add status indicators
4. Test payment flow

### Phase 4: Testing
1. Test with YooKassa test mode
2. Test webhook handling
3. Test message limits
4. Load testing

### Phase 5: Production Launch
1. Switch to production credentials
2. Monitor logs and metrics
3. Gradual rollout (A/B test?)

---

## Future Enhancements

- Annual subscription with discount (e.g., 19900₽/year = 1658₽/month)
- Team/Business plans
- Promo codes and discounts
- Referral program
- Gift subscriptions
- Usage analytics dashboard
