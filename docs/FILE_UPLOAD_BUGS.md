# 🐛 Отчёт об ошибках: Загрузка PDF и изображений

**Дата проверки:** 2026-02-08
**Проверено:** Загрузка файлов в чаты и контекст проектов

---

## ❌ КРИТИЧЕСКИЕ ОШИБКИ

### 1. **PDF Text Extraction полностью сломан**

**Файл:** `services/api/src/utils/text-extractor.ts`

**Проблема:**
```typescript
// Текущая сигнатура (строки 3-6):
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<string>

// Как вызывается (create-section.ts:50):
const text = await extractTextFromFile(file);
// где file = {name: string, mimeType: string, data: string}
```

**Результат:** TypeScript ошибка компиляции + runtime crash при попытке извлечь текст из PDF.

**Причина:**
- Функция ожидает `Buffer` + `filename` (2 аргумента)
- Передаётся объект `{name, mimeType, data}` где `data` - это base64 string
- PDF-parse вызывается с неверными данными

**Как должно быть:**
```typescript
export async function extractTextFromFile(file: {
  name: string;
  mimeType: string;
  data: string; // base64
}): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();
  const buffer = Buffer.from(file.data, 'base64');

  switch (ext) {
    case 'pdf':
      const pdf = require('pdf-parse');
      const result = await pdf(buffer);
      return result.text;

    case 'txt':
    case 'md':
      return buffer.toString('utf-8');

    case 'json':
      try {
        const json = JSON.parse(buffer.toString('utf-8'));
        return JSON.stringify(json, null, 2);
      } catch (error) {
        throw new Error('Invalid JSON file');
      }

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
```

**Затронутые места:**
- `services/api/src/routes/projects/context/create-section.ts:50`
- `services/api/src/routes/projects/context/update-section.ts` (аналогично)
- `services/api/src/routes/projects/context/extract-text.ts:20`

---

### 2. **Неверный импорт PDF-parse**

**Файл:** `services/api/src/utils/text-extractor.ts:1`

**Проблема:**
```typescript
import { PDFParse } from 'pdf-parse'; // ❌ НЕВЕРНО
```

**Правильно:**
```typescript
import pdf from 'pdf-parse'; // ✅ default import
// или
const pdf = require('pdf-parse'); // ✅ CommonJS
```

**Причина:** `pdf-parse` экспортирует функцию по умолчанию, не named export.

---

### 3. **Неверное использование pdf-parse API**

**Файл:** `services/api/src/utils/text-extractor.ts:11-13`

**Текущий код:**
```typescript
const parser = new PDFParse({ data: buffer }); // ❌
const result = await parser.getText();         // ❌
```

**Правильно:**
```typescript
const result = await pdf(buffer); // ✅
return result.text;               // ✅
```

**Причина:** `pdf-parse` - это функция, а не класс. Она принимает Buffer напрямую.

---

### 4. **Файлы (не-изображения) НЕ отправляются в AI**

**Файл:** `services/api/src/services/openrouter.ts:46-48`

**Проблема:**
```typescript
// For files, we can add text content or similar handling
// For now, images are primary focus
```

**Результат:**
- PDF-файлы загружаются в чаты
- Отображаются в UI
- НО текст из них **НЕ отправляется** в AI
- AI не видит содержимое PDF

**Как должно быть:**
```typescript
for (const attachment of attachments) {
  if (attachment.type === 'image') {
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: `data:${attachment.mimeType};base64,${attachment.data}`
      }
    });
  } else if (attachment.type === 'file') {
    // Extract text from PDF/TXT/JSON
    try {
      const extractedText = await extractTextFromFile(attachment);
      contentParts.push({
        type: 'text',
        text: `\n\n=== File: ${attachment.name} ===\n${extractedText}\n`
      });
    } catch (error) {
      console.error(`Failed to extract text from ${attachment.name}`);
    }
  }
}
```

**Затронуто:**
- Chat messages с PDF вложениями - AI их не видит
- Модели не могут отвечать на вопросы по содержимому PDF

---

## ⚠️ СРЕДНИЙ ПРИОРИТЕТ

### 5. **Нет валидации размера base64**

**Проблема:**
- Frontend валидирует размер файла до кодирования (10MB)
- После base64 размер увеличивается на ~33%
- Файл 10MB → 13.3MB base64 → может превысить лимиты API

**Решение:** Проверять размер после base64 кодирования или снизить лимит до 7.5MB.

---

### 6. **Отсутствует прогресс-бар загрузки**

**Проблема:**
- При загрузке большого PDF (8-10MB) нет индикации прогресса
- Пользователь не видит что происходит
- Может выглядеть как зависание

**Решение:** Добавить progress bar или spinner во время загрузки.

---

### 7. **Нет предпросмотра PDF в UI**

**Проблема:**
- Изображения показываются как thumbnail
- PDF показывается только как иконка файла
- Нет возможности проверить что загрузилось

**Решение:** Добавить PDF preview (первая страница) или modal с полным содержимым.

---

## 🟢 НИЗКИЙ ПРИОРИТЕТ

### 8. **Hardcoded file size limit**

**Файл:** `apps/web/components/chat/FileUpload.tsx:24`

**Проблема:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // hardcoded
```

**Решение:** Сделать конфигурируемым через env vars или по тарифу пользователя.

---

### 9. **Нет сжатия изображений**

**Проблема:**
- Изображения сохраняются в оригинальном качестве
- 5MB фото отправляется как есть
- Можно сжать без потери качества

**Решение:** Использовать browser-image-compression перед base64.

---

### 10. **Лимит 20 сообщений включает attachments**

**Файл:** `services/api/src/routes/chat/message.ts:115`

```typescript
.limit(20); // Берёт последние 20 сообщений
```

**Проблема:**
- Если в чате было много изображений, они все включаются в контекст
- Может быстро заполнить token limit
- Нужна фильтрация или подсчёт токенов

---

## 🧪 ТЕСТЫ ДЛЯ ПРОВЕРКИ

### Test 1: PDF Text Extraction
```bash
# Создать context section с PDF
curl -X POST http://localhost:3001/api/projects/:id/context/sections \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sectionType": "documents",
    "title": "Test PDF",
    "files": [{
      "name": "test.pdf",
      "mimeType": "application/pdf",
      "data": "<base64_pdf_data>",
      "size": 12345
    }]
  }'

# Ожидаемое: extractedText должен содержать текст из PDF
# Текущее: Crash или пустая строка
```

### Test 2: Image in Chat
```bash
# Отправить сообщение с изображением
curl -X POST http://localhost:3001/api/chat/:chatId/message \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "What do you see in this image?",
    "attachments": [{
      "type": "image",
      "name": "test.jpg",
      "mimeType": "image/jpeg",
      "data": "<base64_jpg>",
      "size": 50000
    }]
  }'

# Ожидаемое: AI описывает изображение
# Текущее: Работает ✅ (если модель поддерживает vision)
```

### Test 3: PDF in Chat
```bash
# Отправить сообщение с PDF
curl -X POST http://localhost:3001/api/chat/:chatId/message \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Summarize this PDF",
    "attachments": [{
      "type": "file",
      "name": "doc.pdf",
      "mimeType": "application/pdf",
      "data": "<base64_pdf>",
      "size": 100000
    }]
  }'

# Ожидаемое: AI суммирует содержимое PDF
# Текущее: AI не видит PDF, отвечает "I don't see any PDF"
```

---

## 📋 ЧЕКЛИСТ ИСПРАВЛЕНИЙ

### Критичные (блокируют функционал):
- [ ] Исправить сигнатуру `extractTextFromFile`
- [ ] Исправить импорт `pdf-parse`
- [ ] Исправить API вызов `pdf-parse`
- [ ] Добавить отправку файлов в AI (formatMessageWithAttachments)

### Средний приоритет:
- [ ] Валидация base64 размера
- [ ] Progress bar для загрузки
- [ ] PDF preview в UI

### Низкий приоритет:
- [ ] Конфигурируемый размер файлов
- [ ] Сжатие изображений
- [ ] Token-aware context limit

---

## 🎯 ПРИОРИТЕТ ИСПРАВЛЕНИЯ

1. **СЕЙЧАС:** Исправить #1-4 (PDF extraction + отправка в AI)
2. **ПОТОМ:** #5-7 (UX улучшения)
3. **КОГДА-НИБУДЬ:** #8-10 (оптимизации)

---

## 💡 ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ

1. **Добавить E2E тесты** для file upload flow
2. **Логировать ошибки** extraction в Sentry/logging service
3. **Rate limiting** для upload endpoints
4. **Virus scanning** для загружаемых файлов (ClamAV)
5. **Хранить файлы в S3** вместо base64 в БД (для масштабирования)

---

**Статус:** 4 критических бага блокируют PDF functionality
**Время на фикс:** ~2-3 часа для критичных
**Risk:** High - PDF extraction сломана полностью
