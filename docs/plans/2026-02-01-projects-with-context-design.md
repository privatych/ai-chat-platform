# Дизайн: Система проектов с контекстом

**Дата:** 2026-02-01
**Статус:** Утверждено

## Обзор

Добавление функции проектов, которые содержат чаты и контекстную информацию. Пользователи могут создавать проекты, загружать в них информацию (текст и файлы), и использовать этот контекст в чатах с AI.

## Цели

1. Организация чатов в проекты
2. Хранение контекстной информации о проекте и пользователе
3. Возможность загружать файлы как часть контекста
4. Опциональное использование контекста при общении с AI

## Архитектура

### Структура данных

```
User
└── Projects
    ├── Project (название, описание)
    │   ├── Context Sections (секции контекста)
    │   │   ├── About Project (текст + файлы)
    │   │   ├── About User (текст + файлы)
    │   │   ├── Technical Info (текст + файлы)
    │   │   └── Documents (текст + файлы)
    │   └── Chats (чаты проекта)
    │       ├── Chat 1 (может использовать контекст)
    │       └── Chat 2
    └── Default Project "Личные чаты" (для миграции)
```

### Использование контекста

1. Пользователь создаёт проект и заполняет секции контекста
2. При создании чата выбирает проект
3. В чате есть галочка "Использовать контекст проекта"
4. Когда галочка активна:
   - Собирается текст из всех секций контекста
   - Извлекается текст из прикреплённых файлов
   - Всё добавляется как системный промпт перед отправкой сообщения

## Схема базы данных

### Новые таблицы

**projects**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
```

**project_context_sections**
```sql
CREATE TABLE project_context_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL, -- 'about_project', 'about_user', 'technical', 'documents'
  title VARCHAR(255) NOT NULL,
  content TEXT,
  extracted_text TEXT, -- Текст, извлечённый из файлов
  files JSONB, -- [{name, mimeType, data, size}]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_context_project_id ON project_context_sections(project_id);
```

### Изменения в существующих таблицах

**chats**
```sql
ALTER TABLE chats ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN use_project_context BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_chats_project_id ON chats(project_id);
```

## API Endpoints

### Projects API

**POST /api/projects**
```typescript
Request: {
  name: string;
  description?: string;
}
Response: {
  success: boolean;
  data: Project;
}
```

**GET /api/projects**
```typescript
Response: {
  success: boolean;
  data: Project[];
}
```

**GET /api/projects/:id**
```typescript
Response: {
  success: boolean;
  data: {
    project: Project;
    sections: ContextSection[];
    chats: Chat[];
  }
}
```

**PUT /api/projects/:id**
```typescript
Request: {
  name?: string;
  description?: string;
}
Response: {
  success: boolean;
  data: Project;
}
```

**DELETE /api/projects/:id**
```typescript
Response: {
  success: boolean;
}
```

### Context Sections API

**POST /api/projects/:projectId/context/sections**
```typescript
Request: {
  sectionType: 'about_project' | 'about_user' | 'technical' | 'documents';
  title: string;
  content?: string;
  files?: Array<{name, mimeType, data, size}>;
}
Response: {
  success: boolean;
  data: ContextSection;
}
```

**GET /api/projects/:projectId/context/sections**
```typescript
Response: {
  success: boolean;
  data: ContextSection[];
}
```

**PUT /api/projects/:projectId/context/sections/:id**
```typescript
Request: {
  title?: string;
  content?: string;
  files?: Array<{...}>;
}
Response: {
  success: boolean;
  data: ContextSection;
}
```

**POST /api/projects/:projectId/context/extract-text**
```typescript
Request: {
  file: {
    mimeType: string;
    data: string; // base64
  }
}
Response: {
  success: boolean;
  data: {
    extractedText: string;
  }
}
```

### Chat API Changes

**POST /api/chats**
```typescript
Request: {
  projectId: string; // Обязательно
  title: string;
  model: string;
}
```

**PUT /api/chats/:id/project**
```typescript
Request: {
  projectId: string;
}
Response: {
  success: boolean;
}
```

**PUT /api/chats/:id/context**
```typescript
Request: {
  useProjectContext: boolean;
}
Response: {
  success: boolean;
}
```

### Message API Changes

При отправке сообщения (`POST /api/chat/:chatId/message`):

1. Получить чат и проверить `useProjectContext`
2. Если `true`:
   - Загрузить все секции контекста проекта
   - Собрать текст: `section.content + section.extractedText`
   - Создать системное сообщение:
   ```
   You are an AI assistant working on a project. Here is the project context:

   ## About Project
   [content]

   ## About User
   [content]

   ## Technical Information
   [content]

   ## Documents
   [content]
   ```
3. Добавить системное сообщение в начало массива `messages`
4. Отправить в OpenRouter

## Frontend Components

### Структура навигации

**ProjectSidebar** (`/components/projects/ProjectSidebar.tsx`)
- Список проектов пользователя
- Каждый проект раскрывается, показывая чаты
- Кнопка "Новый проект"
- Кнопка "+" у проекта → создать чат в проекте

**ProjectPage** (`/app/projects/[id]/page.tsx`)
- Вкладки: "Чаты", "Контекст", "Настройки"
- Вкладка "Контекст": управление секциями
- Вкладка "Чаты": список чатов проекта

**ContextEditor** (`/components/projects/ContextEditor.tsx`)
- 4 секции: About Project, About User, Technical Info, Documents
- Каждая секция:
  - Заголовок (редактируемый)
  - Текстовое поле (автоматическое сохранение)
  - Drag-drop зона для файлов
  - Список загруженных файлов с кнопкой "Извлечь текст"
  - Показ извлечённого текста

**ChatInterface Updates**
- Добавить галочку "Использовать контекст проекта" под полем ввода
- Иконка рядом с галочкой показывает превью контекста (tooltip)
- При включении контекста: визуальный индикатор в UI

### Новые страницы

**`/app/projects/page.tsx`**
- Список всех проектов
- Карточки проектов с кратким описанием
- Кнопка "Создать проект"

**`/app/projects/[id]/page.tsx`**
- Детальная информация о проекте
- Вкладки: Чаты, Контекст, Настройки

**`/app/projects/[id]/context/page.tsx`**
- Редактор контекста (4 секции)

## Извлечение текста из файлов

### Библиотека

Использовать `pdf-parse` для извлечения текста из PDF:

```bash
pnpm add pdf-parse
pnpm add -D @types/pdf-parse
```

### Реализация

**`services/api/src/utils/text-extractor.ts`**

```typescript
import pdfParse from 'pdf-parse';

export async function extractTextFromFile(file: {
  mimeType: string;
  data: string; // base64
  name: string;
}): Promise<string> {
  const buffer = Buffer.from(file.data, 'base64');

  switch (file.mimeType) {
    case 'application/pdf':
      const pdfData = await pdfParse(buffer);
      return pdfData.text;

    case 'text/plain':
    case 'text/markdown':
      return buffer.toString('utf-8');

    case 'application/json':
      const json = JSON.parse(buffer.toString('utf-8'));
      return JSON.stringify(json, null, 2);

    default:
      throw new Error(`Unsupported file type: ${file.mimeType}`);
  }
}

export function truncateText(text: string, maxLength: number = 50000): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '\n\n[Текст обрезан до 50000 символов]';
}
```

### Ограничения

- Максимальный размер файла: 10MB (как в существующей загрузке)
- Максимальная длина извлечённого текста: 50,000 символов на секцию
- Поддерживаемые форматы: PDF, TXT, MD, JSON

## Миграция существующих данных

### Скрипт миграции

**`packages/database/migrations/001_add_projects.sql`**

```sql
-- 1. Создать таблицы
CREATE TABLE projects (...);
CREATE TABLE project_context_sections (...);

-- 2. Добавить поля в chats
ALTER TABLE chats ADD COLUMN project_id UUID;
ALTER TABLE chats ADD COLUMN use_project_context BOOLEAN DEFAULT FALSE;

-- 3. Создать проект "Личные чаты" для каждого пользователя
INSERT INTO projects (user_id, name, description, is_default)
SELECT
  id,
  'Личные чаты',
  'Автоматически созданный проект для существующих чатов',
  TRUE
FROM users;

-- 4. Привязать все существующие чаты к дефолтному проекту
UPDATE chats
SET project_id = (
  SELECT p.id
  FROM projects p
  WHERE p.user_id = chats.user_id
  AND p.is_default = TRUE
);

-- 5. Сделать project_id обязательным
ALTER TABLE chats ALTER COLUMN project_id SET NOT NULL;
```

### После миграции

- Показать пользователям уведомление: "Ваши чаты теперь организованы в проект 'Личные чаты'"
- Предложить создать новые проекты

## Тестирование

### Unit тесты

- Извлечение текста из разных форматов файлов
- Обрезка длинного текста
- Форматирование контекста для системного промпта

### Integration тесты

- Создание проекта и секций контекста
- Загрузка файлов и извлечение текста
- Отправка сообщения с контекстом проекта
- Перемещение чата между проектами

### E2E тесты

- Создать проект
- Заполнить контекст
- Загрузить PDF файл
- Создать чат в проекте
- Включить контекст
- Отправить сообщение
- Проверить, что AI получила контекст

## Безопасность

- Проверка прав доступа: пользователь может видеть только свои проекты
- Валидация размера файлов (max 10MB)
- Санитизация извлечённого текста
- Rate limiting для извлечения текста (чтобы не злоупотребляли)

## Производительность

- Кэширование извлечённого текста (не извлекать каждый раз)
- Ленивая загрузка чатов в проекте
- Индексы на project_id для быстрого поиска

## Будущие улучшения (не в первой версии)

- Поиск по контексту проектов
- Шаринг проектов между пользователями
- Экспорт/импорт проектов
- Версионирование контекста
- RAG (Retrieval-Augmented Generation) для больших контекстов
