# 🚀 Деплой - Выполните эти команды

## Шаг 1: Подключитесь к серверу и запустите деплой

Скопируйте и выполните эти команды:

```bash
ssh root@146.103.97.73 << 'EOF'
cd /root/ai-chat-platform
git fetch origin
git checkout feature/yookassa-integration
git pull origin feature/yookassa-integration
bash QUICK_DEPLOY.sh
EOF
```

## Что произойдет:

1. ⬇️  Скачает последний код с ветки `feature/yookassa-integration`
2. 📦 Установит новые зависимости (axios ^1.13.5 и др.)
3. 📁 Создаст директории для хранения изображений
4. 🗄️  Применит миграцию для таблицы `image_generations`
5. 🔨 Пересоберет API и Web приложение
6. 🔄 Перезапустит PM2 процессы
7. ✅ Покажет статус сервисов

## Ожидаемый вывод:

```
🚀 Начинаем деплой...
📥 Обновление кода с GitHub...
Already on 'feature/yookassa-integration'
Your branch is up to date with 'origin/feature/yookassa-integration'.
📦 Установка зависимостей...
Lockfile is up to date, resolution step is skipped
...
📁 Создание директорий для изображений...
🗄️  Применение миграций базы данных...
...
🔨 Сборка проекта...
...
🔄 Перезапуск сервисов...
[PM2] Restarting all processes
✅ Проверка статуса...
┌────┬────────┬─────────────┬─────────┬─────────┬──────────┐
│ id │ name   │ mode        │ status  │ cpu     │ memory   │
├────┼────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0  │ api    │ cluster     │ online  │ 0%      │ 50.5mb   │
│ 1  │ web    │ cluster     │ online  │ 0%      │ 125.3mb  │
└────┴────────┴─────────────┴─────────┴─────────┴──────────┘

✅ Деплой завершен!

📊 Проверьте:
  - https://ai.itoq.ru/images - генерация изображений
  - https://ai.itoq.ru/subscription - обновленная подписка (3990₽/месяц)

📝 Логи: pm2 logs
```

## После успешного деплоя:

### Тест 1: Проверить /images
Откройте в браузере: https://ai.itoq.ru/images

**Ожидается:**
- ✅ Страница загружается (не 404)
- ✅ Видна форма генерации изображений
- ✅ Есть dropdown с моделями
- ✅ Показывает лимит: "10 из 10 изображений доступно сегодня"

### Тест 2: Сгенерировать изображение
1. Выбрать модель: `flux-2-klein` (FREE)
2. Ввести промпт: "beautiful sunset over mountains"
3. Нажать "Генерировать"

**Ожидается:**
- ✅ Появится индикатор загрузки
- ✅ Через 5-15 секунд появится изображение
- ✅ Лимит изменится: "9 из 10 изображений"

### Тест 3: Проверить подписку
Откройте: https://ai.itoq.ru/subscription

**Ожидается:**
- ✅ Цена показана: **3990₽/месяц**
- ✅ Описание: "Оплата каждые 14 дней — 1995₽"

## Если возникли проблемы:

### Проблема: Permission denied при SSH
**Решение:** Проверьте SSH ключ или используйте пароль

### Проблема: "OPENROUTER_API_KEY is not set"
**Решение:**
```bash
ssh root@146.103.97.73
nano /root/ai-chat-platform/services/api/.env
# Добавьте: OPENROUTER_API_KEY=sk-or-v1-...
pm2 restart all
```

### Проблема: Страница все еще 404
**Решение:**
```bash
ssh root@146.103.97.73
cd /root/ai-chat-platform
pm2 logs web
# Проверьте ошибки в логах
```

### Проблема: Миграция не применилась
**Решение:**
```bash
ssh root@146.103.97.73
cd /root/ai-chat-platform/packages/database
pnpm db:push
```

## Логи для отладки:

```bash
# Все логи
pm2 logs

# Только API
pm2 logs api

# Только Web
pm2 logs web

# Последние 100 строк
pm2 logs --lines 100
```
