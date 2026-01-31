# AI Chat Platform - Финальный дизайн системы

**Дата:** 2026-01-31
**Версия:** 1.0
**Статус:** Утверждено для имплементации

---

## Обзор проекта

### Цель
Создать минималистичную мультимодельную AI-чат платформу с freemium моделью монетизации для быстрого запуска на рынок.

### Ключевые параметры

| Параметр | Значение |
|----------|----------|
| **Бюджет** | $10-15/месяц |
| **Срок MVP** | 4 недели (спринт режим) |
| **Платформа** | Web-only (первый запуск) |
| **Локализация** | Двуязычный (RU + EN) |
| **Целевой рынок** | Россия/СНГ + международный |

### Функционал MVP

**Must-have (критично для запуска):**
- ✅ Базовый чат с AI (20+ моделей через OpenRouter)
- ✅ Аутентификация (email/password)
- ✅ История чатов с сохранением
- ✅ Rate limiting для free tier
- ✅ Premium подписки через YooKassa
- ✅ Real-time streaming ответов
- ✅ Выбор между разными AI моделями

**Nice-to-have (можно отложить):**
- Social login (Google OAuth)
- Экспорт чатов (PDF, Markdown)
- Voice input/TTS
- Image generation
- Режим сравнения моделей

---

## Архитектура системы

### High-Level Architecture

```
┌─────────────────────────────────┐
│    Web App (Next.js 15)         │
│    - Русский + English UI       │
│    - SSE для streaming ответов  │
│    - shadcn/ui компоненты       │
└─────────────┬───────────────────┘
              │ HTTPS + SSE
              ▼
┌─────────────────────────────────┐
│    API Gateway (Fastify)        │
│    - JWT Auth middleware        │
│    - Rate limiting (Redis)      │
│    - OpenRouter integration     │
└─────────────┬───────────────────┘
              │
    ┌─────────┴──────────┐
    ▼                    ▼
┌─────────┐      ┌──────────────┐
│PostgreSQL│      │External APIs │
│(Neon)   │      │- OpenRouter  │
│+ Redis  │      │- YooKassa    │
│(Upstash)│      │- Sentry      │
└─────────┘      └──────────────┘
```

### Принципы архитектуры

1. **Monorepo структура** - Turborepo для управления пакетами
2. **Stateless API** - горизонтальное масштабирование
3. **Server-Sent Events** - для streaming AI ответов
4. **Type-safe** - TypeScript везде
5. **Budget-first** - максимум free tiers

---

## Технологический стек

### Frontend (Web)

| Технология | Версия | Назначение |
|-----------|--------|------------|
| Next.js | 15 | React framework с App Router |
| React | 19 | UI library |
| TypeScript | 5.3 | Type safety |
| Tailwind CSS | 4.0 | Utility-first styling |
| shadcn/ui | latest | Pre-built components |
| Zustand | 4 | Client state management |
| TanStack Query | 5 | Server state & caching |
| React Hook Form | 7 | Form handling |
| Zod | 3 | Schema validation |
| next-intl | latest | i18n (RU/EN) |

**Обоснование выбора:**
- Next.js 15 - production-ready, отличная DX, SEO-friendly
- shadcn/ui - качественные компоненты, быстрая разработка UI
- Zustand - легковесный, простой API
- TanStack Query - автоматический кеширование, refetching

### Backend

| Технология | Версия | Назначение |
|-----------|--------|------------|
| Fastify | 5 | High-performance HTTP server |
| TypeScript | 5.3 | Type safety |
| Drizzle ORM | 0.30 | Type-safe SQL queries |
| PostgreSQL | 15 | Relational database |
| Redis | 7 | Cache + rate limiting |
| jsonwebtoken | latest | JWT authentication |
| bcrypt | latest | Password hashing |
| Pino | 8 | Structured logging |
| Zod | 3 | Schema validation |

**Обоснование выбора:**
- Fastify - быстрее Express, plugin ecosystem
- Drizzle ORM - type-safe, migration support, легче Prisma
- Redis - в памяти, идеально для rate limiting

### Infrastructure

| Сервис | Plan | Стоимость | Назначение |
|--------|------|-----------|------------|
| Vercel | Hobby | $0 | Web app hosting |
| Railway | Hobby | $5/мес | API server hosting |
| Neon | Free tier | $0 | PostgreSQL database |
| Upstash | Free tier | $0 | Redis cache |
| OpenRouter | Pay-as-you-go | ~$5-10/мес | AI models API |
| YooKassa | Commission | 2.8% + 15₽ | Payment processing |
| Sentry | Free | $0 | Error tracking |
| PostHog | Free | $0 | Analytics |

**Total: $10-15/месяц**

### Monorepo Structure

```
ai-chat-platform/
├── apps/
│   └── web/                    # Next.js web app
│       ├── app/
│       │   └── [locale]/       # i18n routing
│       │       ├── (auth)/     # Auth pages
│       │       └── (dashboard)/ # Main app
│       ├── components/
│       │   ├── ui/             # shadcn/ui
│       │   ├── chat/
│       │   └── layout/
│       └── lib/
│
├── packages/
│   ├── api-client/             # Type-safe API client
│   ├── database/               # Drizzle schemas
│   └── shared/                 # Utils & types
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

---

## Модель данных

### Database Schema

#### users
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

#### chats
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
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
```

#### messages
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

#### subscriptions
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'free', 'premium'
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

#### usage_logs
```sql
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
```

### Entity Relationships

```
users (1) ──────< (N) chats
                      │
                      ▼
                  messages (N)

users (1) ───── (1) subscriptions

users (1) ──────< (N) usage_logs
```

---

## API Design

### REST Endpoints

#### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/refresh
```

#### Chat Management

```
POST   /api/chat              # Create new chat
GET    /api/chats             # List user chats (paginated)
GET    /api/chat/:id          # Get chat details
PATCH  /api/chat/:id          # Update chat (title, settings)
DELETE /api/chat/:id          # Delete chat
```

#### Messages

```
POST   /api/chat/:id/message  # Send message (SSE stream)
GET    /api/chat/:id/messages # Get message history
```

#### Subscriptions

```
POST   /api/subscription/checkout  # Create YooKassa payment
GET    /api/subscription/status    # Get subscription info
POST   /api/subscription/cancel    # Cancel subscription
```

#### Webhooks

```
POST   /api/webhooks/yookassa      # YooKassa payment events
```

### API Response Formats

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Вы достигли дневного лимита сообщений"
  }
}
```

**SSE Stream (messages):**
```
data: {"delta": "Hello"}
data: {"delta": " world"}
data: {"done": true, "tokensUsed": 10}
```

---

## Интеграции

### OpenRouter (AI Models)

**Endpoint:** `https://openrouter.ai/api/v1/chat/completions`

**Доступные модели:**

**Free Tier (5 моделей):**
- openai/gpt-3.5-turbo
- google/gemini-flash-1.5
- meta-llama/llama-3.1-8b-instruct
- anthropic/claude-3-haiku
- mistralai/mistral-7b-instruct

**Premium Tier (20+ моделей):**
- openai/gpt-4-turbo
- anthropic/claude-3.5-sonnet
- google/gemini-pro-1.5
- meta-llama/llama-3.1-405b
- deepseek/deepseek-v3
- и другие...

**Request:**
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

**Response (SSE):**
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":"!"}}]}
data: [DONE]
```

### YooKassa (Payments)

**Create Payment:**
```typescript
POST https://api.yookassa.ru/v3/payments
{
  amount: { value: "990.00", currency: "RUB" },
  capture: true,
  confirmation: {
    type: "redirect",
    return_url: "https://app.com/payment/success"
  },
  description: "Premium подписка - Месяц",
  metadata: { userId: "uuid" }
}
```

**Webhook:**
```typescript
POST /api/webhooks/yookassa
{
  type: "notification",
  event: "payment.succeeded",
  object: {
    id: "payment_id",
    status: "succeeded",
    metadata: { userId: "uuid" }
  }
}
```

---

## Функциональные требования

### Rate Limiting

**Free Tier:**
- 50 сообщений/день
- 10 новых чатов/час
- 100 API requests/минуту
- Доступ к 5 базовым моделям

**Premium Tier (990 RUB/месяц):**
- Unlimited сообщения
- Unlimited чаты
- 1000 API requests/минуту
- Доступ ко всем 20+ моделям

**Реализация (Redis):**
```typescript
const key = `limit:${userId}:daily`;
const count = await redis.incr(key);
if (count === 1) {
  await redis.expire(key, 86400); // 24 hours
}
if (count > 50 && user.tier === 'free') {
  throw new RateLimitError();
}
```

### Authentication Flow

1. User регистрируется (email + password)
2. Password хешируется (bcrypt, 10 rounds)
3. Создается JWT token (expires: 7 days)
4. Token сохраняется в localStorage (web)
5. Каждый API request включает: `Authorization: Bearer <token>`
6. Middleware проверяет JWT и добавляет `request.user`

### Chat Flow

1. User создает новый чат
2. Выбирает AI модель из dropdown
3. Вводит сообщение
4. Frontend отправляет POST `/api/chat/:id/message`
5. Backend:
   - Проверяет rate limits
   - Сохраняет user message в DB
   - Вызывает OpenRouter API (stream: true)
   - Отправляет SSE chunks клиенту
6. Frontend рендерит streaming текст в real-time
7. После завершения - сохраняет assistant message в DB

---

## UI/UX Design

### Ключевые экраны

**1. Login/Register (Auth)**
- Минималистичная форма
- Email + Password
- "Forgot password" link
- Language switcher (RU/EN)

**2. Chat Interface (Main)**
- Sidebar с списком чатов
- Model selector dropdown
- Message list (scrollable, virtualized)
- Message input + Send button
- Typing indicator при streaming

**3. History**
- Grid/List чатов
- Сортировка по дате
- Поиск по title
- Bulk delete

**4. Settings**
- Profile info
- Subscription status
- Usage statistics
- Language preference

### UI Components (shadcn/ui)

- Button, Input, Textarea
- Select, Dropdown Menu
- Dialog, Alert Dialog
- Tabs, Card
- Badge (для subscription tier)
- Toast (notifications)
- Skeleton (loading states)

### Theme

- Light/Dark mode (по умолчанию - system preference)
- Цветовая палитра: современная, минималистичная
- Шрифт: Inter (sans-serif)

---

## Internationalization (i18n)

### Языки
- Русский (ru) - по умолчанию для РФ
- English (en) - для международной аудитории

### Реализация (next-intl)

**Structure:**
```
messages/
├── ru.json
└── en.json
```

**Автоопределение:**
1. Browser language (navigator.language)
2. Если не поддерживается → fallback: en
3. User может переключить вручную (сохраняется в localStorage)

**Ключевые разделы:**
- auth (login, register, errors)
- chat (new chat, messages, models)
- subscription (upgrade, pricing, features)
- common (buttons, labels, errors)

---

## Security

### Меры безопасности

1. **Password Security**
   - Bcrypt hashing (10 salt rounds)
   - Min 8 characters
   - Никогда не логируем пароли

2. **JWT Security**
   - Secret в environment variable
   - 7-day expiration
   - httpOnly cookies (опционально)

3. **API Security**
   - HTTPS only в production
   - CORS restricted к app domains
   - Rate limiting на всех endpoints
   - Input validation (Zod)
   - SQL injection защита (Drizzle ORM)

4. **Data Security**
   - Sensitive data в .env (не в git)
   - User data encrypted at rest (DB)
   - Redis secured с паролем

---

## Performance

### Оптимизации

**Backend:**
- Connection pooling для PostgreSQL
- Redis caching для частых запросов
- Gzip compression
- Indexes на часто запрашиваемых полях

**Frontend:**
- Next.js automatic code splitting
- Image optimization
- React Query caching (stale-while-revalidate)
- Lazy loading для тяжелых компонентов
- Virtualization для длинных списков

**Цели производительности:**
- API response time: <500ms (p95)
- Web Vitals: Lighthouse score >90
- Time to Interactive: <3s

---

## Мониторинг

### Sentry (Error Tracking)
- Автоматический error capturing
- Source maps для production
- Alerts на критичные ошибки

### PostHog (Analytics)
```typescript
// User events
posthog.capture('chat_created', { model: 'gpt-4' });
posthog.capture('message_sent', { tier: 'free' });
posthog.capture('subscription_upgraded');
```

### Metrics
- DAU/MAU (Daily/Monthly Active Users)
- Messages per user
- Conversion rate (free → premium)
- OpenRouter API costs
- Error rate
- API response times

---

## Deployment

### Environments

1. **Development** (local)
   - Local PostgreSQL (Docker)
   - Local Redis (Docker)
   - Mock YooKassa

2. **Production**
   - Vercel (web)
   - Railway (API)
   - Neon (PostgreSQL)
   - Upstash (Redis)
   - Real YooKassa

### CI/CD (GitHub Actions)

```yaml
on: push to main
  → Run tests
  → Build apps
  → Run DB migrations
  → Deploy API to Railway
  → Deploy Web to Vercel (automatic)
```

### Environment Variables

**Критичные переменные:**
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- OPENROUTER_API_KEY
- YOOKASSA_SHOP_ID
- YOOKASSA_SECRET_KEY

---

## Roadmap

### Week 1-2: Backend Foundation
- ✅ Monorepo setup (Turborepo)
- ✅ Database schema (Drizzle)
- ✅ Fastify API setup
- ✅ Authentication (JWT)
- ✅ OpenRouter integration
- ✅ Chat endpoints + SSE

### Week 3: Frontend Core
- ✅ Next.js app setup
- ✅ shadcn/ui integration
- ✅ Auth pages (login/register)
- ✅ Chat interface + streaming
- ✅ Model selector
- ✅ i18n (RU/EN)

### Week 4: Polish + Payments
- ✅ Chat history
- ✅ YooKassa integration
- ✅ Rate limiting UI
- ✅ Premium features
- ✅ Testing
- ✅ Deploy to production

### Post-MVP (v1.1+)
- Mobile app (React Native)
- Social login (Google OAuth)
- Chat export (PDF, Markdown)
- Advanced model parameters
- Voice input/TTS
- Team collaboration

---

## Success Metrics

### MVP Ready When:
- ✅ User can register & login
- ✅ User can chat with AI (streaming works)
- ✅ Chat history saves & loads
- ✅ Free tier rate limiting works
- ✅ Premium subscription can be purchased
- ✅ App deployed to production
- ✅ Zero critical errors in Sentry

### Business Metrics (3 months):
- 100+ registered users
- 10%+ conversion rate (free → premium)
- <5% churn rate
- OpenRouter costs <50% of revenue

---

## Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| OpenRouter rate limits | Средняя | Queue system, retry logic |
| Database overload | Низкая | Connection pooling, indexes |
| YooKassa integration issues | Средняя | Тщательное тестирование в sandbox |
| Free tier abuse | Высокая | Rate limiting, email verification |
| Scaling costs | Средняя | Мониторинг, alerts, optimization |

---

## Выводы

Этот дизайн оптимизирован для:
- ✅ Быстрого запуска (4 недели)
- ✅ Минимального бюджета ($10-15/мес)
- ✅ Простоты поддержки
- ✅ Масштабируемости в будущем
- ✅ Качественного UX

**Следующий шаг:** Создание детального implementation plan с пошаговыми инструкциями.

---

_Автор: Claude Sonnet 4.5_
_Дата создания: 2026-01-31_
