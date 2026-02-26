#!/bin/bash
# Быстрый деплой на production
# Использование: запустить этот скрипт НА СЕРВЕРЕ в директории /root/ai-chat-platform

set -e  # Остановка при ошибке

echo "🚀 Начинаем деплой..."

# 1. Обновить код
echo "📥 Обновление кода с GitHub..."
git fetch origin
git checkout feature/yookassa-integration
git pull origin feature/yookassa-integration

# 2. Установить зависимости
echo "📦 Установка зависимостей..."
pnpm install

# 3. Создать директории для изображений
echo "📁 Создание директорий для изображений..."
mkdir -p apps/web/public/uploads/images
chmod 755 apps/web/public/uploads/images

# 4. Запустить миграции БД
echo "🗄️  Применение миграций базы данных..."
cd packages/database
pnpm db:push
cd ../..

# 5. Пересобрать проект
echo "🔨 Сборка проекта..."
pnpm build

# 6. Перезапустить сервисы
echo "🔄 Перезапуск сервисов..."
pm2 restart all

# 7. Проверить статус
echo "✅ Проверка статуса..."
pm2 status

echo ""
echo "✅ Деплой завершен!"
echo ""
echo "📊 Проверьте:"
echo "  - https://ai.itoq.ru/images - генерация изображений"
echo "  - https://ai.itoq.ru/subscription - обновленная подписка (3990₽/месяц)"
echo ""
echo "📝 Логи: pm2 logs"
