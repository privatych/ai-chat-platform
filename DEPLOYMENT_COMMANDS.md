# Команды для деплоя на production

## 1. Подключиться к серверу
```bash
ssh root@146.103.97.73
```

## 2. Обновить код
```bash
cd /root/ai-chat-platform
git fetch origin
git checkout feature/yookassa-integration
git pull origin feature/yookassa-integration
```

## 3. Установить зависимости
```bash
pnpm install
```

## 4. Добавить переменную окружения для OpenRouter
```bash
# Откройте .env файл API сервиса
nano services/api/.env

# Добавьте строку:
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## 5. Создать директории для хранения изображений
```bash
mkdir -p apps/web/public/uploads/images
chmod 755 apps/web/public/uploads/images
```

## 6. Запустить миграции базы данных
```bash
cd packages/database
pnpm db:push
cd ../..
```

## 7. Пересобрать проект
```bash
pnpm build
```

## 8. Перезапустить сервисы
```bash
pm2 restart all
# или если нужно полностью перезапустить:
pm2 delete all
pm2 start ecosystem.config.js
```

## 9. Проверить статус
```bash
pm2 status
pm2 logs
```

## Проверка функциональности

### Генерация изображений:
1. Перейти на https://ai.itoq.ru/images
2. Выбрать модель (бесплатные: flux-2-klein, flux-1-schnell, sdxl-turbo, playground-v2.5)
3. Ввести промпт
4. Нажать "Генерировать"

### Подписка:
1. Перейти на https://ai.itoq.ru/subscription
2. Проверить цену: 3990₽/месяц (1995₽ каждые 14 дней)
3. Попробовать создать подписку

### Лимиты:
- **FREE**: 10 изображений в день
- **PREMIUM**: 30 изображений в день

### Модели:
- **FREE**: 4 модели (быстрые, простые)
- **PREMIUM**: 16 моделей (топовые: FLUX Pro, DALL-E 3, Stable Diffusion и др.)
