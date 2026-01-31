# 10 - Оптимизация бюджета и быстрый запуск

## 🎯 Цель: Минимальный бюджет + Максимальная скорость

---

## 💰 Бюджетная разбивка

### Минимальный MVP бюджет: $5-15/месяц

| Сервис | Тариф | Стоимость/мес | Что включено |
|--------|-------|---------------|--------------|
| **Vercel** | Hobby | **$0** | Web hosting, CDN, Автодеплой |
| **Railway** | Hobby | **$5** | API hosting, 512MB RAM, 1GB disk |
| **Neon** | Free | **$0** | PostgreSQL, 0.5GB storage, 10GB transfer |
| **Upstash** | Free | **$0** | Redis, 10K commands/day |
| **OpenRouter** | Pay-as-go | **$5-10** | ~500-1000 сообщений (зависит от модели) |
| **Sentry** | Developer | **$0** | 5K errors/month |
| **PostHog** | Free | **$0** | 1M events/month |
| **Resend** | Free | **$0** | 3K emails/month |
| **Expo EAS** | Free | **$0** | 30 builds/month |
| **GitHub** | Free | **$0** | Unlimited public repos |

**ИТОГО**: **$5-15/месяц** (в основном OpenRouter costs)

---

## 🚀 План быстрого запуска (4 недели)

### Неделя 1: Backend MVP

**Приоритет**: Работающий API для одной AI модели

**Задачи**:
1. ✅ Setup monorepo (Turborepo + pnpm) - 2 часа
2. ✅ Database schema (только users + chats + messages) - 3 часа
3. ✅ Fastify API setup - 2 часа
4. ✅ Auth endpoints (register/login) - 4 часа
5. ✅ OpenRouter integration (только GPT-3.5-turbo) - 4 часа
6. ✅ Chat endpoint с streaming - 6 часов
7. ✅ Basic rate limiting (Redis) - 3 часа

**Итого**: ~24 часа работы

**Что пропускаем для скорости**:
- ❌ Premium подписки (добавим на неделе 4)
- ❌ Multiple models (добавим на неделе 2)
- ❌ Advanced features (export, folders, etc.)
- ❌ Comprehensive tests (только smoke tests)

---

### Неделя 2: Web Frontend MVP

**Приоритет**: Минимальный UI для чата

**Задачи**:
1. ✅ Next.js app setup - 2 часа
2. ✅ shadcn/ui installation - 1 час
3. ✅ Login/Register forms - 4 часа
4. ✅ Basic chat interface - 8 часов
5. ✅ SSE streaming display - 4 часов
6. ✅ Chat history sidebar - 4 часов

**Итого**: ~23 часа работы

**Упрощения**:
- Используем shadcn/ui без кастомизации
- Минималистичный дизайн (no fancy animations)
- Только light mode (dark mode позже)
- Только английский язык

---

### Неделя 3: Polish + Mobile (опционально)

**Вариант A - Полируем Web**:
1. ✅ Add 4 more models (Claude, Gemini, DeepSeek) - 3 часа
2. ✅ Model selector UI - 2 часа
3. ✅ Error handling + loading states - 4 часа
4. ✅ Responsive design tweaks - 3 часа
5. ✅ Basic settings page - 2 часа
6. ✅ Deploy to production - 2 часа

**Вариант B - Добавляем Mobile**:
1. ✅ Expo setup - 2 часа
2. ✅ Copy auth screens from web - 4 часа
3. ✅ Mobile chat interface - 8 часов
4. ✅ Basic navigation - 2 часа

**Recommendation**: Вариант A для быстрого запуска

---

### Неделя 4: Monetization

**Приоритет**: Возможность зарабатывать

**Задачи**:
1. ✅ YooKassa integration - 4 часа
2. ✅ Subscription schema + endpoints - 3 часа
3. ✅ Payment page UI - 3 часа
4. ✅ Webhook handler - 2 часа
5. ✅ Rate limiting по tier - 2 часа
6. ✅ Basic analytics setup - 2 часа
7. ✅ Email notifications (welcome, payment) - 3 часа

**Итого**: ~19 часов работы

---

## 💡 Стратегии экономии

### 1. Free Tier Стратегия

**Используй бесплатные альтернативы везде где можно**:

```
❌ НЕ платить за:
- Hosting (Vercel Free, Railway $5)
- Database (Neon Free tier)
- Redis (Upstash Free)
- Analytics (PostHog Free)
- Error tracking (Sentry Free)
- Email (Resend Free, 3K/month достаточно)
- Mobile builds (Expo EAS Free, 30/month)

✅ Платить ТОЛЬКО за:
- Railway Hobby ($5) - для API
- OpenRouter ($5-10) - usage-based
```

### 2. Оптимизация OpenRouter расходов

**Выбор моделей для free tier**:

| Модель | Стоимость (input/output) | Use Case |
|--------|--------------------------|----------|
| GPT-3.5-turbo | $0.5/$1.5 per 1M tokens | Default, cheapest |
| Claude Haiku | $0.25/$1.25 per 1M tokens | Fast responses |
| Gemini Flash | $0.075/$0.3 per 1M tokens | Самая дешевая |
| DeepSeek Chat | $0.14/$0.28 per 1M tokens | Cheap alternative |

**Расчет стоимости**:
```
Средний запрос: 200 tokens input + 500 tokens output = 700 tokens
GPT-3.5: (200 * 0.5 + 500 * 1.5) / 1M = $0.00085 за сообщение
50 сообщений/день * 30 дней = 1500 сообщений = $1.27/месяц на пользователя

Для 10 free users: ~$12.70/месяц
Для 100 users: ~$127/месяц
```

**Оптимизация**:
- Limit free tier to 50 msg/day
- Use cheapest model (Gemini Flash) для free tier
- Premium users get expensive models (GPT-4, Claude Opus)

### 3. Кэширование для снижения costs

```typescript
// Cache popular queries
const cacheKey = `chat:${chatId}:context`;
let context = await redis.get(cacheKey);

if (!context) {
  context = await fetchFromDB();
  await redis.setex(cacheKey, 900, JSON.stringify(context)); // 15 min
}
```

**Экономия**: ~30% меньше DB queries

### 4. Rate Limiting агрессивно

```typescript
// Free tier limits
const limits = {
  free: {
    messagesPerDay: 50,      // Достаточно для тестирования
    chatsPerHour: 10,        // Prevent abuse
    maxTokensPerMessage: 4000 // Prevent long contexts
  },
  premium: {
    messagesPerDay: 1000,    // Generous
    chatsPerHour: 100,
    maxTokensPerMessage: 32000
  }
};
```

---

## ⚡ Ускорители разработки

### 1. Используй AI для кода

**Claude Code** может:
- Генерировать boilerplate (schemas, routes, components)
- Писать тесты
- Создавать documentation
- Fix bugs

**Пример задачи**:
```
Create a complete Drizzle schema for chats table with:
- id, user_id, title, model, system_prompt, temperature
- Proper indexes on user_id and created_at
- TypeScript types exported
```

### 2. Copy-Paste из примеров

**Не изобретай велосипед**:
- shadcn/ui для компонентов (copy/paste готовые)
- Drizzle examples для DB operations
- Fastify docs для route handlers
- React Query examples для data fetching

### 3. Минимум custom CSS

```typescript
// ❌ НЕ делай custom CSS
.custom-button {
  padding: 12px 24px;
  border-radius: 8px;
  background: linear-gradient(...);
}

// ✅ Используй Tailwind + shadcn
<Button>Click me</Button>
```

### 4. Defer non-critical features

**Must-have для MVP**:
- ✅ Auth
- ✅ Chat с AI
- ✅ History
- ✅ Basic settings

**Defer to v1.0**:
- ❌ Dark mode
- ❌ i18n (multi-language)
- ❌ Advanced model params
- ❌ Export chats
- ❌ Folders/tags
- ❌ Mobile app (если не критично)

---

## 📊 Метрики успеха MVP

### Технические метрики

**Обязательные**:
- ✅ 0 TypeScript errors
- ✅ API endpoints работают
- ✅ Можно зарегистрироваться и залогиниться
- ✅ Можно отправить сообщение и получить ответ
- ✅ Streaming работает

**Nice-to-have**:
- 70% test coverage
- <500ms API response time
- >90 Lighthouse score

### Функциональные метрики

**Day 1 задачи**:
- [ ] User can register
- [ ] User can login
- [ ] User can create chat
- [ ] User can send message
- [ ] User can see response streaming
- [ ] User can view chat history

### Бизнес метрики (post-launch)

**Week 1**:
- Get 10 users to test
- Collect feedback
- Fix critical bugs

**Month 1**:
- 100 registered users
- 10 paying users (10% conversion)
- $100 MRR (Monthly Recurring Revenue)

---

## 🛠️ Essential Tools Только

**НЕ устанавливай сразу все**. Начни с минимума:

### Must-have (Week 1)
- VS Code
- Node.js 20+
- pnpm
- Git
- Docker (для локального Postgres/Redis)

### Should-have (Week 2)
- Postman/Insomnia (API testing)
- Drizzle Studio (DB GUI)
- React DevTools

### Nice-to-have (Week 3+)
- Expo Go (mobile testing)
- Sentry (error tracking)
- PostHog (analytics)

---

## 🎯 Фокус на Core Loop

**Core User Journey**:
```
1. User lands on site
2. User registers/logs in
3. User creates chat
4. User sends message
5. AI responds
6. User happy → tells friends OR upgrades to premium
```

**Все остальное - secondary**. Если фича не влияет на этот loop - defer.

---

## 💳 Pricing Strategy для быстрого роста

### Free Tier (Acquisition)
- **Лимиты**: 50 msg/day
- **Модели**: GPT-3.5, Gemini Flash, DeepSeek (3 cheapest)
- **Цель**: Get users hooked
- **Стоимость**: ~$0.50/user/month

### Premium ($9.99/month)
- **Лимиты**: Unlimited messages
- **Модели**: All 20+ models
- **Features**: Export, comparison mode, priority support
- **Margin**: $9.99 - $3 (average OpenRouter cost) = ~$7 profit/user

### Conversion Strategy
- Show "Upgrade to Premium" когда user hits limit
- Highlight premium models (GPT-4, Claude Opus)
- Offer 7-day free trial

---

## 📈 Scaling Plan

### When to upgrade from free tiers?

**Trigger**: 100+ active users

**Database (Neon → Railway Postgres)**:
- Free tier: 0.5GB, достаточно для ~1000 chats
- Upgrade when: >0.4GB usage
- Cost: +$7/month

**Redis (Upstash Free → Paid)**:
- Free tier: 10K commands/day
- Upgrade when: >8K commands/day
- Cost: +$10/month

**Railway (Hobby → Developer)**:
- Free tier: 512MB RAM
- Upgrade when: Memory usage >80%
- Cost: +$15/month (from $5 to $20)

**Total**: From $5/mo → $37/mo at 100+ users

---

## ✅ Pre-Launch Checklist

### Technical
- [ ] All MVP features work
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database backed up

### Legal/Compliance
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie consent (if using analytics)
- [ ] GDPR compliance (if EU users)

### Marketing
- [ ] Landing page live
- [ ] Sign up flow tested
- [ ] Email confirmation works
- [ ] Social media accounts created
- [ ] Launch plan prepared

### Monitoring
- [ ] Sentry configured (error tracking)
- [ ] PostHog events tracking
- [ ] Uptime monitoring (UptimeRobot Free)
- [ ] Basic analytics dashboard

---

## 🚀 Launch Day Plan

### T-7 days: Soft Launch
- Share with friends/family
- Get initial feedback
- Fix obvious bugs

### T-3 days: Beta Testers
- Invite 20-30 beta users
- Collect feedback
- Monitor performance

### T-0: Public Launch
- Post on:
  - Product Hunt
  - Reddit (r/SideProject, r/webdev)
  - Hacker News (Show HN)
  - Twitter/X
  - LinkedIn

### T+7 days: Iterate
- Fix reported bugs
- Analyze usage data
- Plan v1.0 features

---

## 💡 Pro Tips для успеха

1. **Launch imperfect**: Better done than perfect
2. **Talk to users**: Feedback > assumptions
3. **Iterate fast**: Ship fixes daily
4. **Monitor costs**: Set alerts at $20, $50, $100
5. **Focus**: Don't add features until core loop is perfect
6. **Document**: README, setup guide for future you
7. **Backup**: Automated DB backups from day 1

---

## 🎉 Success Metrics

**Week 1**:
- 10 registered users
- 0 critical bugs
- <$10 infrastructure costs

**Month 1**:
- 100 registered users
- 10 paying users
- $100 MRR
- Break-even on OpenRouter costs

**Month 3**:
- 500 users
- 50 paying (10% conversion)
- $500 MRR
- Profitable operation

---

_Помни: Speed > Perfection для MVP. Ship fast, iterate faster!_
