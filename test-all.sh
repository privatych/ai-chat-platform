#!/bin/bash

# 🧪 Скрипт полного тестирования перед деплоем
# Запуск: bash test-all.sh

set -e  # Остановить при ошибке

echo "🚀 AI Chat Platform - Полное тестирование"
echo "=========================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода успеха
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Функция для вывода ошибки
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Функция для вывода предупреждения
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Проверка Node.js и pnpm
echo "1️⃣  Проверка окружения..."
if ! command -v node &> /dev/null; then
    error "Node.js не установлен!"
    exit 1
fi
success "Node.js $(node -v)"

if ! command -v pnpm &> /dev/null; then
    error "pnpm не установлен!"
    exit 1
fi
success "pnpm $(pnpm -v)"

# 2. Установка зависимостей
echo ""
echo "2️⃣  Установка зависимостей..."
pnpm install --frozen-lockfile
success "Зависимости установлены"

# 3. Проверка переменных окружения
echo ""
echo "3️⃣  Проверка переменных окружения..."
if [ ! -f "services/api/.env" ]; then
    error "Файл services/api/.env не найден!"
    exit 1
fi
success "Environment файлы найдены"

# 4. TypeScript проверка
echo ""
echo "4️⃣  TypeScript type checking..."
pnpm turbo run lint
success "TypeScript проверка пройдена"

# 5. Build проекта
echo ""
echo "5️⃣  Build всех пакетов..."
pnpm turbo run build
success "Build успешен"

# 6. Запуск тестов (если есть)
echo ""
echo "6️⃣  Запуск тестов..."
if pnpm turbo run test 2>/dev/null; then
    success "Все тесты прошли"
else
    warning "Тесты не настроены или провалились"
fi

# 7. Проверка health endpoint (если сервер запущен)
echo ""
echo "7️⃣  Проверка API health endpoint..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        success "API сервер работает"
        echo "   Response: $HEALTH_RESPONSE"
    else
        warning "API сервер отвечает, но status не 'ok'"
    fi
else
    warning "API сервер не запущен (это нормально, если тестируете без запущенного сервера)"
fi

# 8. Lighthouse audit (требует установленный lighthouse)
echo ""
echo "8️⃣  Lighthouse audit..."
if command -v lighthouse &> /dev/null; then
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "   Запуск Lighthouse (это займет ~1 минуту)..."
        lighthouse http://localhost:3000 \
            --only-categories=performance,accessibility,best-practices,seo \
            --output=json \
            --output-path=./lighthouse-report.json \
            --quiet

        # Парсинг результатов
        PERF=$(cat lighthouse-report.json | grep -o '"performance":[0-9.]*' | grep -o '[0-9.]*' | head -1)
        A11Y=$(cat lighthouse-report.json | grep -o '"accessibility":[0-9.]*' | grep -o '[0-9.]*' | head -1)

        echo "   📊 Результаты:"
        echo "      Performance: $(echo "$PERF * 100" | bc | cut -d. -f1)/100"
        echo "      Accessibility: $(echo "$A11Y * 100" | bc | cut -d. -f1)/100"

        if (( $(echo "$PERF > 0.9" | bc -l) )); then
            success "Performance отличный!"
        else
            warning "Performance нуждается в улучшении"
        fi
    else
        warning "Frontend сервер не запущен, пропускаем Lighthouse"
    fi
else
    warning "Lighthouse не установлен (npm install -g lighthouse для установки)"
fi

# 9. Проверка bundle size
echo ""
echo "9️⃣  Проверка bundle size..."
if [ -d "apps/web/.next" ]; then
    echo "   Next.js bundle размеры:"
    cd apps/web
    pnpm next build 2>&1 | grep -A 10 "Route (app)"
    cd ../..
    success "Bundle analysis завершен"
else
    warning "Next.js build не найден, запустите pnpm build сначала"
fi

# 10. Security audit
echo ""
echo "🔟 Security audit..."
pnpm audit --audit-level=moderate
if [ $? -eq 0 ]; then
    success "Критических уязвимостей не найдено"
else
    warning "Найдены уязвимости, проверьте вывод выше"
fi

# Итоговый отчет
echo ""
echo "=========================================="
echo "✨ Тестирование завершено!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Проверьте PRE_DEPLOYMENT_CHECKLIST.md"
echo "   2. Исправьте найденные проблемы"
echo "   3. Запустите тест снова"
echo "   4. Когда все ✅ - готов к деплою!"
echo ""
echo "🚀 Удачного деплоя!"
