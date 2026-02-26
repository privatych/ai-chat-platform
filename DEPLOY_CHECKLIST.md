# ✅ Чеклист деплоя - Генерация изображений + Обновленная подписка

## Что уже реализовано и готово:

### Backend (API)
- ✅ Таблица `image_generations` в БД (миграция `0001_dry_adam_warlock.sql`)
- ✅ Сервис OpenRouter API (`services/api/src/services/openrouter-image.ts`)
- ✅ Сервис хранения изображений (`services/api/src/services/image-storage.ts`)
- ✅ Middleware проверки лимитов (`services/api/src/middleware/image-limit.ts`)
- ✅ API роуты:
  - POST `/api/images/generate` - генерация изображения
  - GET `/api/images/history` - история генераций
- ✅ Валидация `OPENROUTER_API_KEY` в `env.ts`
- ✅ 20 моделей настроено (4 FREE, 16 PREMIUM)

### Frontend (Web)
- ✅ Страница `/images` (`apps/web/app/images/page.tsx`)
- ✅ Компоненты:
  - `ImageGenerator` - форма генерации
  - `ModelSelector` - выбор модели с категориями
  - `ImageParameters` - параметры генерации
  - `ImagePreview` - превью и загрузка
  - `GenerationHistory` - история с пагинацией
- ✅ Обновленная цена подписки:
  - `SubscriptionCard`: 3990₽/месяц, 1995₽ каждые 14 дней
  - `MessageLimitModal`: новые цены
- ✅ Навигация: ссылка на /images добавлена

### Экономика
- FREE: 10 изображений/день = ~$1.20/месяц расходов
- PREMIUM: 30 изображений/день = ~$18/месяц расходов, 3990₽ (~$42) доход = **$24 прибыль (57% маржа)**

## Команды для деплоя на сервер

### 1. Подключиться к серверу
```bash
ssh root@146.103.97.73
cd /root/ai-chat-platform
```

### 2. Обновить код
```bash
git fetch origin
git checkout feature/yookassa-integration
git pull origin feature/yookassa-integration
```

### 3. Проверить .env файлы
```bash
# API сервис
cat services/api/.env | grep OPENROUTER_API_KEY
# Если ключа нет, добавить:
# nano services/api/.env
# OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Web приложение
cat apps/web/.env.local | grep NEXT_PUBLIC_API_URL
```

### 4. Создать директории для изображений
```bash
mkdir -p apps/web/public/uploads/images
chmod 755 apps/web/public/uploads/images
```

### 5. Установить зависимости
```bash
pnpm install
```

### 6. Запустить миграции
```bash
cd packages/database
pnpm db:push
cd ../..
```

### 7. Пересобрать проект
```bash
pnpm build
```

### 8. Перезапустить сервисы
```bash
pm2 restart all
pm2 logs
```

## Как протестировать

### Тест 1: Генерация изображения (FREE tier)
1. Открыть https://ai.itoq.ru/images
2. Выбрать FREE модель: `flux-2-klein` или `flux-1-schnell`
3. Ввести промпт: "beautiful sunset over mountains"
4. Нажать "Генерировать"
5. Ожидать: изображение появится через 5-15 секунд
6. Проверить: изображение сохранено в истории

### Тест 2: Лимиты FREE
1. Проверить счетчик: "10 из 10 изображений доступно сегодня"
2. Сгенерировать 10 изображений
3. Ожидать: после 10-го показывается модал с предложением Premium

### Тест 3: Premium модели (после подписки)
1. Перейти на https://ai.itoq.ru/subscription
2. Проверить: цена 3990₽/месяц (1995₽ каждые 14 дней)
3. Оформить подписку
4. Вернуться на https://ai.itoq.ru/images
5. Проверить: доступны PREMIUM модели (FLUX Pro, DALL-E 3, etc.)
6. Проверить: лимит увеличен до 30 изображений/день

### Тест 4: История генераций
1. На странице /images прокрутить вниз
2. Проверить: отображаются все сгенерированные изображения
3. Проверить: пагинация работает (если > 20 изображений)

### Тест 5: API напрямую
```bash
# Получить JWT токен после логина
TOKEN="your-jwt-token"

# Генерация изображения
curl -X POST https://ai.itoq.ru/api/images/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "flux-2-klein",
    "prompt": "cute cat",
    "width": 512,
    "height": 512
  }'

# История
curl https://ai.itoq.ru/api/images/history \
  -H "Authorization: Bearer $TOKEN"
```

## Возможные проблемы и решения

### Проблема: "OPENROUTER_API_KEY is not set"
**Решение:** Проверить `.env` файл в `services/api/.env`

### Проблема: Изображения не сохраняются
**Решение:**
```bash
mkdir -p apps/web/public/uploads/images
chmod 755 apps/web/public/uploads/images
```

### Проблема: Таблица image_generations не найдена
**Решение:**
```bash
cd packages/database
pnpm db:push
```

### Проблема: Rate limit exceeded
**Решение:** Роут `/api/images/generate` имеет лимит 10 запросов в минуту

### Проблема: YooKassa автоплатежи не работают
**Решение:** Это нормально, требуется активация в личном кабинете YooKassa. Пока работает только первый платеж с `save_payment_method: true`.

## Важные API ключи

Убедитесь что на сервере есть:
- ✅ `OPENROUTER_API_KEY` - для генерации изображений
- ✅ `YOOKASSA_SHOP_ID` - для подписок
- ✅ `YOOKASSA_SECRET_KEY` - для подписок
- ✅ `YOOKASSA_WEBHOOK_SECRET` - для вебхуков
- ✅ `JWT_SECRET` - для аутентификации
- ✅ `DATABASE_URL` - для PostgreSQL

## Логи для отладки

```bash
# PM2 логи
pm2 logs

# Логи API
pm2 logs api

# Логи Web
pm2 logs web

# Проверить статус
pm2 status
```

## Что дальше?

После успешного деплоя и тестов:
1. ✅ Генерация изображений работает
2. ✅ Подписка с новой ценой работает
3. ✅ Можно делать merge в main
4. ✅ Создать PR на GitHub
5. ✅ Настроить автоплатежи YooKassa (если нужно)
