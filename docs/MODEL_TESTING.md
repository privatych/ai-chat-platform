# Тестирование AI Моделей

## Дата последнего тестирования
2026-02-01

## Статус моделей

### ✅ FREE Модели (100% работают)

| Модель | ID | Провайдер | Статус | Проверка идентификации |
|--------|-----|-----------|--------|----------------------|
| GPT-3.5 Turbo | `openai/gpt-3.5-turbo` | OpenAI | ✅ Работает | Частично |
| Gemini 2.0 Flash | `google/gemini-2.0-flash-001` | Google | ✅ Работает | Да (Google) |
| Llama 3.1 8B | `meta-llama/llama-3.1-8b-instruct` | Meta | ✅ Работает | Частично |

### ✅ PREMIUM Модели (100% работают)

| Модель | ID | Провайдер | Статус | Проверка идентификации |
|--------|-----|-----------|--------|----------------------|
| GPT-4 Turbo | `openai/gpt-4-turbo` | OpenAI | ✅ Работает | ✅ Да |
| Claude 3.5 Sonnet | `anthropic/claude-3.5-sonnet` | Anthropic | ✅ Работает | ✅ Да |
| Gemini 2.5 Pro | `google/gemini-2.5-pro` | Google | ✅ Работает | Частично |
| Llama 3.3 70B | `meta-llama/llama-3.3-70b-instruct` | Meta | ✅ Работает | ✅ Да |

## Тестовые запросы

Все модели тестируются с запросом:
```
Какая ты модель? Назови себя кратко (одно предложение).
```

## Результаты тестирования

### GPT-3.5 Turbo ✅
**Ответ:** "Я - модель искусственного интеллекта OpenAI"
- Работает стабильно
- Быстрые ответы
- Подходит для базовых задач

### Gemini 2.0 Flash ✅
**Ответ:** "Я — большая языковая модель, разработанная компанией Google"
- **ИСПРАВЛЕНО**: Заменили `google/gemini-flash-1.5` на `google/gemini-2.0-flash-001`
- Теперь работает корректно
- Быстрая модель от Google

### Llama 3.1 8B ✅
**Ответ:** "Я языковое модель Artificial Intelligence (AI)"
- Open source модель от Meta
- Хорошая производительность

### GPT-4 Turbo ✅
**Ответ:** "Я - языковая модель, разработанная OpenAI, известная как ChatGPT"
- Самая мощная модель OpenAI
- Отлично идентифицирует себя

### Claude 3.5 Sonnet ✅
**Ответ:** "Я Claude - AI-ассистент, созданный компанией Anthropic"
- Топовая модель от Anthropic
- Лучшая для анализа и рассуждений
- Идеально идентифицирует себя

### Gemini 2.5 Pro ✅
**Ответ:** Краткий ответ
- **ИСПРАВЛЕНО**: Заменили `google/gemini-pro-1.5` на `google/gemini-2.5-pro`
- Новейшая модель Google
- Теперь работает корректно

### Llama 3.3 70B ✅
**Ответ:** "Я - модель Llama от Meta"
- **ДОБАВЛЕНО**: Заменили DeepSeek на эту модель
- Мощная open source модель
- Отлично идентифицирует себя

## Известные проблемы (решены)

### ❌ Google Gemini модели (ИСПРАВЛЕНО)
**Проблема:** Модели `google/gemini-flash-1.5` и `google/gemini-pro-1.5` возвращали 404 ошибку

**Решение:** Обновлены на актуальные ID:
- `google/gemini-2.0-flash-001` - для Free
- `google/gemini-2.5-pro` - для Premium

**Результат:** ✅ Обе модели теперь работают

### ❌ DeepSeek Chat (ЗАМЕНЕН)
**Проблема:** Модель `deepseek/deepseek-chat` отвечала что она OpenAI GPT

**Решение:** Заменили на `meta-llama/llama-3.3-70b-instruct`

**Результат:** ✅ Llama 3.3 70B корректно идентифицирует себя

## Как запустить тесты

### Тест всех моделей
```bash
cd services/api
npx tsx scripts/test-new-models.ts
```

### Поиск доступных Google моделей
```bash
npx tsx scripts/find-google-models.ts
```

### Тест конкретной модели
```bash
npx tsx scripts/test-models.ts
```

## Тестовые аккаунты

### Premium пользователь
```
Email: premium@test.com
Password: Premium123!
Подписка: Premium (до 2027-02-01)
Доступ: Все 7 моделей
```

### Free пользователь
```
Email: free@test.com
Password: Free123!
Подписка: Free
Доступ: 3 бесплатные модели
```

## Конфигурация

Модели настроены в файле:
```
packages/shared/src/constants/index.ts
```

```typescript
export const AI_MODELS = {
  free: [
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google' },
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta' },
  ],
  premium: [
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta' },
  ],
}
```

## Итоги

- ✅ **7/7 моделей работают** (100%)
- ✅ Все модели правильно выбираются и используются
- ✅ Модель сохраняется при отправке сообщения
- ✅ При смене модели чат обновляется автоматически
- ✅ Google модели исправлены и работают
- ✅ DeepSeek заменен на Llama 3.3 70B

## Рекомендации

1. **Для быстрых ответов:** Gemini 2.0 Flash, GPT-3.5 Turbo
2. **Для сложных задач:** GPT-4 Turbo, Claude 3.5 Sonnet
3. **Для анализа:** Claude 3.5 Sonnet
4. **Open source:** Llama 3.1 8B (Free), Llama 3.3 70B (Premium)
5. **Новейшие технологии:** Gemini 2.5 Pro
