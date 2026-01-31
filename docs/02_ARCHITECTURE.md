# 02 - Архитектура проекта

## Оглавление
- [Общая архитектура](#общая-архитектура)
- [Технический стек](#технический-стек)
- [Структура Monorepo](#структура-monorepo)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)

---

## Общая архитектура

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    КЛИЕНТСКИЙ СЛОЙ                           │
├────────────────────┬────────────────────────────────────────┤
│   Web App          │   Mobile App                           │
│   (Next.js 15)     │   (React Native + Expo)                │
│                    │                                        │
│   - App Router     │   - Expo Router                        │
│   - RSC            │   - React Navigation                   │
│   - Tailwind       │   - NativeWind                         │
│   - shadcn/ui      │   - Shared Components                  │
└────────────────────┴────────────────────────────────────────┘
                          │
                          │ HTTPS / Server-Sent Events
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│                    (Fastify)                                 │
│                                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐│
│   │  Auth    │  │  Chat    │  │ Payment  │  │  Webhooks  ││
│   │  Routes  │  │  Routes  │  │  Routes  │  │   Routes   ││
│   └──────────┘  └──────────┘  └──────────┘  └────────────┘│
│                                                              │
│   Middleware: JWT Auth, Rate Limiting, CORS, Validation     │
└─────────────────────────────────────────────────────────────┘
           │                │                │
           │                │                │
           ▼                ▼                ▼
┌──────────────┐  ┌─────────────┐  ┌────────────────────┐
│ PostgreSQL   │  │   Redis     │  │  External APIs     │
│              │  │             │  │                    │
│ Tables:      │  │ - Sessions  │  │  - OpenRouter      │
│ - users      │  │ - Cache     │  │  - YooKassa        │
│ - chats      │  │ - Rate lim  │  │  - Sentry          │
│ - messages   │  │ - Pub/Sub   │  │  - PostHog         │
│ - subs       │  │             │  │  - Resend          │
└──────────────┘  └─────────────┘  └────────────────────┘
```

---

## Технический стек

### Frontend (Web)

| Категория | Технология | Версия | Назначение |
|-----------|-----------|--------|------------|
| Framework | Next.js | 15 | React framework с SSR/SSG |
| Language | TypeScript | 5.3 | Type safety |
| Styling | Tailwind CSS | 4.0 | Utility-first CSS |
| UI Library | shadcn/ui | latest | Pre-built components |
| State (Client) | Zustand | 4 | Lightweight state management |
| State (Server) | TanStack Query | 5 | Server state caching |
| Forms | React Hook Form | 7 | Form handling |
| Validation | Zod | 3 | Schema validation |
| HTTP Client | ky | 1 | Modern fetch wrapper |

**Key packages**:
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "typescript": "^5.3.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.5.0",
  "tailwindcss": "^4.0.0",
  "zod": "^3.22.0",
  "react-hook-form": "^7.50.0"
}
```

### Mobile

| Категория | Технология | Версия | Назначение |
|-----------|-----------|--------|------------|
| Framework | React Native | 0.76 | Native mobile apps |
| Runtime | Expo | SDK 52 | Managed workflow |
| Routing | Expo Router | 4 | File-based routing |
| Styling | NativeWind | 4 | Tailwind for RN |
| Storage | Expo SecureStore | 14 | Encrypted storage |
| State | Zustand + React Query | 4/5 | Same as web |

### Backend

| Категория | Технология | Версия | Назначение |
|-----------|-----------|--------|------------|
| Framework | Fastify | 5 | High-performance HTTP server |
| Language | TypeScript | 5.3 | Type safety |
| ORM | Drizzle | 0.30 | Type-safe SQL |
| Database | PostgreSQL | 15 | Relational database |
| Cache | Redis | 7 | In-memory cache |
| Authentication | JWT | - | Token-based auth |
| Logging | Pino | 8 | Structured logging |
| Validation | Zod | 3 | Schema validation |

### Infrastructure

| Категория | Технология | Назначение |
|-----------|-----------|------------|
| Monorepo | Turborepo | Build orchestration |
| Package Manager | pnpm | Fast, efficient installs |
| CI/CD | GitHub Actions | Automated testing & deploy |
| Hosting (Web) | Vercel | Web app hosting |
| Hosting (API) | Railway | Backend hosting |
| Database | Neon / Railway | Managed PostgreSQL |
| Cache | Upstash | Managed Redis |

---

## Структура Monorepo

```
ai-chat-platform/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── app/                # App Router
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── chat/
│   │   │   │   ├── history/
│   │   │   │   └── settings/
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   └── webhooks/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── mobile/                 # React Native app
│       ├── app/                # Expo Router
│       │   ├── (auth)/
│       │   ├── (tabs)/
│       │   └── index.tsx
│       ├── components/
│       ├── lib/
│       └── package.json
│
├── packages/
│   ├── ui/                     # Shared components
│   │   └── src/
│   │       └── components/
│   ├── api-client/             # Type-safe API client
│   │   └── src/
│   │       ├── auth.ts
│   │       ├── chat.ts
│   │       └── subscription.ts
│   ├── database/               # Drizzle schemas
│   │   └── src/
│   │       ├── schema/
│   │       ├── migrations/
│   │       └── client.ts
│   └── shared/                 # Utilities & types
│       └── src/
│           ├── constants/
│           ├── utils/
│           └── types/
│
├── services/
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── routes/
│       │   ├── plugins/
│       │   ├── services/
│       │   └── app.ts
│       └── package.json
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Workspace Dependencies

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "services/*"
```

**Dependency Graph**:
```
apps/web ───┐
            ├──> packages/ui
apps/mobile ┘    packages/api-client
                 packages/shared

services/api ──> packages/database
                 packages/shared
```

---

## Data Flow

### Сценарий: Отправка сообщения в чат

```
┌────────────┐
│   User     │
│  Types     │
│  Message   │
└─────┬──────┘
      │
      ▼
┌──────────────────────────────┐
│  Frontend (Web/Mobile)       │
│                              │
│  1. Validate input           │
│  2. Optimistic update (UI)   │
│  3. POST /api/chat/message   │
└─────┬────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│  API Gateway (Fastify)       │
│                              │
│  1. Verify JWT token         │
│  2. Validate schema (Zod)    │
│  3. Check rate limits        │
└─────┬────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│  Chat Service                │
│                              │
│  1. Save message to DB       │
│  2. Check subscription       │
│  3. Get chat context         │
└─────┬────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│  OpenRouter Service          │
│                              │
│  1. Prepare request          │
│  2. Call model API           │
│  3. Stream response (SSE)    │
└─────┬────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│  Stream Processing           │
│                              │
│  1. Parse SSE chunks         │
│  2. Forward to client        │
│  3. Save to DB on complete   │
└─────┬────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│  Frontend Updates            │
│                              │
│  1. Render streaming text    │
│  2. Update UI state          │
│  3. Save final message       │
└──────────────────────────────┘
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### Chats Table
```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    model VARCHAR(100) NOT NULL,
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);
```

### Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB,
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'free', 'premium', 'enterprise'
    status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'expired'
    yookassa_payment_id VARCHAR(255),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

### Usage Logs Table
```sql
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_action ON usage_logs(action);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
```

### Entity Relationships

```
users (1) ──────< (N) chats
                      │
                      │ (1)
                      │
                      ▼ (N)
                   messages

users (1) ───── (1) subscriptions

users (1) ──────< (N) usage_logs
```

---

## API Architecture

### REST API Endpoints

**Authentication**:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

**Chats**:
- `POST /api/chat` - Create new chat
- `GET /api/chats` - List user chats
- `GET /api/chat/:id` - Get chat details
- `PATCH /api/chat/:id` - Update chat
- `DELETE /api/chat/:id` - Delete chat

**Messages**:
- `POST /api/chat/:id/message` - Send message (SSE stream)
- `GET /api/chat/:id/messages` - Get message history

**Subscriptions**:
- `POST /api/subscription/checkout` - Create checkout session
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/status` - Get subscription status

**Webhooks**:
- `POST /api/webhooks/yookassa` - YooKassa payment events

### Authentication Flow

```
1. User submits credentials
   ↓
2. Server validates & hashes password
   ↓
3. Server generates JWT token
   {
     userId: "uuid",
     email: "user@example.com",
     subscriptionTier: "free",
     exp: timestamp
   }
   ↓
4. Client stores token (localStorage/SecureStore)
   ↓
5. Client includes token in Authorization header
   "Authorization: Bearer <token>"
   ↓
6. Server verifies JWT on each request
```

---

## External Services Integration

### OpenRouter (AI Models)

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`

**Request**:
```typescript
{
  model: "openai/gpt-4-turbo",
  messages: [
    { role: "user", content: "Hello!" }
  ],
  stream: true,
  temperature: 0.7
}
```

**Response** (SSE):
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":"!"}}]}
data: [DONE]
```

### YooKassa (Payments)

**Create Payment**:
```typescript
POST https://api.yookassa.ru/v3/payments
{
  amount: { value: "990.00", currency: "RUB" },
  capture: true,
  confirmation: {
    type: "redirect",
    return_url: "https://app.com/payment/success"
  },
  description: "Premium subscription - Monthly"
}
```

**Webhook** (payment.succeeded):
```typescript
POST /api/webhooks/yookassa
{
  type: "notification",
  event: "payment.succeeded",
  object: {
    id: "payment_id",
    status: "succeeded",
    amount: { value: "990.00" },
    metadata: { userId: "uuid" }
  }
}
```

---

## Security Architecture

### Authentication & Authorization

1. **Password Security**:
   - bcrypt hashing (10 salt rounds)
   - Never store plaintext passwords
   - Password requirements: min 8 chars, letters + numbers

2. **JWT Security**:
   - Secret stored in env variable
   - 7-day expiration
   - Refresh token rotation
   - Claims: userId, email, subscriptionTier

3. **API Security**:
   - HTTPS only in production
   - CORS restricted to app domains
   - Rate limiting per IP/user
   - Input validation with Zod
   - SQL injection prevention (Drizzle ORM)

### Rate Limiting

**Free Tier**:
- 50 messages/day
- 10 chats/hour
- 100 API requests/minute

**Premium Tier**:
- Unlimited messages
- Unlimited chats
- 1000 API requests/minute

**Implementation** (Redis):
```typescript
const key = `rate-limit:${userId}:${action}`;
const count = await redis.incr(key);
if (count === 1) {
  await redis.expire(key, windowSeconds);
}
if (count > limit) {
  throw new Error('Rate limit exceeded');
}
```

---

## Performance Optimization

### Caching Strategy

**Redis Cache**:
- User sessions (1 hour TTL)
- Popular model configs (1 day TTL)
- Rate limit counters (window duration TTL)
- Chat context (15 minutes TTL)

**React Query Cache**:
- Chat list (5 minutes stale time)
- User profile (10 minutes)
- Subscription status (1 minute)

### Database Optimization

**Indexes**:
- `users.email` (unique lookup)
- `chats.user_id` (list user chats)
- `messages.chat_id` (chat history)
- `created_at` fields (sorting)

**Query Optimization**:
- Pagination for large lists (limit + offset)
- Select only needed fields
- Use JOIN instead of N+1 queries

---

## Monitoring & Observability

### Error Tracking (Sentry)

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Analytics (PostHog)

```typescript
posthog.capture('message_sent', {
  model: 'gpt-4',
  messageLength: 150,
  subscriptionTier: 'free',
});
```

### Logging (Pino)

```typescript
logger.info({
  userId,
  chatId,
  model,
  tokensUsed,
}, 'Message processed');
```

---

## Scalability Considerations

### Horizontal Scaling

**Web App**: Serverless (Vercel) - auto-scales
**API**: Stateless design - add more instances
**Database**: Connection pooling, read replicas
**Redis**: Redis Cluster for high availability

### Load Distribution

```
           Load Balancer
                │
        ┌───────┼───────┐
        ▼       ▼       ▼
     API-1   API-2   API-3
        │       │       │
        └───────┼───────┘
                ▼
          PostgreSQL
                +
           Redis Cluster
```

---

_Следующий шаг: Переходи к `03_PHASE_1_BACKEND.md` для начала разработки!_
