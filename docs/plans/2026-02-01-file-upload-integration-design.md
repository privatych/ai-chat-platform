# Дизайн: Интеграция загрузки файлов в чат

**Дата:** 2026-02-01
**Статус:** Утверждено

## Обзор

Интеграция существующего компонента FileUpload в поток отправки сообщений для поддержки изображений и файлов в моделях с vision/files capabilities.

## Требования

1. Отправлять файлы напрямую с сообщением (base64)
2. Сохранять прикреплённые файлы в базе данных вместе с сообщениями
3. Не изменять существующий дизайн UI
4. Поддерживать модели с vision (изображения) и files (документы)

## Архитектура

### Поток данных
```
User выбирает файлы
  → FileUpload конвертирует в base64
  → MessageInput отправляет в API
  → API форматирует для OpenRouter
  → Сохраняет в БД
  → Отображается в истории
```

### Компоненты

**1. FileUpload (существующий)**
- Конвертирует файлы в base64
- Валидирует размер (max 10MB) и типы
- Управляет локальным состоянием attachments
- Передаёт изменения через `onAttachmentsChange`

**2. MessageInput (обновить)**
- Добавить состояние `attachments`
- Интегрировать FileUpload компонент
- Отправлять attachments в API вместе с текстом
- Очищать attachments после отправки

**3. Backend API (обновить)**
- Принимать `attachments` в теле запроса
- Форматировать для разных типов моделей
- Сохранять в БД

**4. Database Schema (обновить)**
- Добавить поле `attachments: json` в таблицу messages

## Форматирование для OpenRouter API

### Модели с Vision (GPT-4, Claude, Gemini)
```javascript
{
  role: 'user',
  content: [
    { type: 'text', text: 'Что на изображении?' },
    {
      type: 'image_url',
      image_url: {
        url: 'data:image/jpeg;base64,/9j/4AAQ...'
      }
    }
  ]
}
```

### Модели с Files (Claude, Gemini)
Для PDF/текстовых файлов:
- Использовать тот же формат `image_url` (OpenRouter обрабатывает)
- Или извлечь текст и добавить как `text` type

### Модели без Vision/Files
- Отклонять на фронтенде (уже реализовано в FileUpload)
- Показывать ошибку пользователю

## Детали реализации

### 1. Database Migration
```sql
ALTER TABLE messages ADD COLUMN attachments JSON;
```

Структура attachments:
```typescript
interface Attachment {
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  data: string; // base64
  size: number;
}
```

### 2. API Changes

**Валидация:**
```typescript
const attachmentSchema = z.object({
  type: z.enum(['image', 'file']),
  name: z.string(),
  mimeType: z.string(),
  data: z.string(),
  size: z.number(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  model: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
});
```

**Форматирование сообщений:**
```typescript
function formatMessageForModel(message, attachments?) {
  if (!attachments || attachments.length === 0) {
    return { role: message.role, content: message.content };
  }

  const contentParts = [{ type: 'text', text: message.content }];

  for (const attachment of attachments) {
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: `data:${attachment.mimeType};base64,${attachment.data}`
      }
    });
  }

  return { role: message.role, content: contentParts };
}
```

### 3. Frontend Changes

**MessageInput:**
- Добавить state: `const [attachments, setAttachments] = useState<Attachment[]>([])`
- Добавить FileUpload перед Textarea
- Отправлять attachments в API
- Очищать после отправки: `setAttachments([])`

**ChatInterface (показ истории):**
- Рендерить attachments из БД
- Переиспользовать логику отображения из FileUpload

### 4. Обработка ошибок

- Валидация файлов - в FileUpload (уже реализовано)
- Проверка поддержки модели - в FileUpload (уже реализовано)
- Ошибки API - toast notifications
- Ошибки БД - логирование + общая ошибка пользователю

## Ограничения

- Максимальный размер файла: 10MB
- Поддерживаемые форматы изображений: JPEG, PNG, GIF, WebP
- Поддерживаемые форматы файлов: PDF, TXT, MD, JSON
- Файлы хранятся в БД как base64 (для больших объёмов нужно переходить на S3)

## Тестирование

1. Загрузка изображения в модель с vision
2. Загрузка PDF в модель с files
3. Попытка загрузки файла в модель без поддержки
4. Попытка загрузки файла > 10MB
5. Множественные файлы
6. Отображение истории с файлами
7. Очистка файлов после отправки

## Безопасность

- Валидация MIME types на клиенте и сервере
- Ограничение размера файлов
- Санитизация имён файлов
- Rate limiting для предотвращения злоупотреблений
