# Projects with Context Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add projects functionality where users can organize chats and add contextual information (text + files) that can be optionally included when chatting with AI

**Architecture:** Add projects and context_sections tables, migrate existing chats to default project, create project management UI with context editor, extract text from uploaded files and inject into system prompts when enabled

**Tech Stack:** PostgreSQL, Drizzle ORM, React, Next.js, pdf-parse, Zod validation

---

## Task 1: Database Schema - Create Projects Table

**Files:**
- Create: `packages/database/src/schema/projects.ts`
- Modify: `packages/database/src/schema/index.ts`

**Step 1: Create projects schema**

Create `packages/database/src/schema/projects.ts`:

```typescript
import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
```

**Step 2: Export from index**

Update `packages/database/src/schema/index.ts`:

```typescript
export * from './users';
export * from './subscriptions';
export * from './chats';
export * from './messages';
export * from './projects'; // Add this line
```

**Step 3: Run TypeScript check**

```bash
cd packages/database
pnpm tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add packages/database/src/schema/projects.ts packages/database/src/schema/index.ts
git commit -m "feat(db): add projects table schema"
```

---

## Task 2: Database Schema - Create Context Sections Table

**Files:**
- Create: `packages/database/src/schema/context-sections.ts`
- Modify: `packages/database/src/schema/index.ts`

**Step 1: Create context sections schema**

Create `packages/database/src/schema/context-sections.ts`:

```typescript
import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const contextSections = pgTable('project_context_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sectionType: varchar('section_type', { length: 50 }).notNull(), // about_project, about_user, technical, documents
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  extractedText: text('extracted_text'),
  files: jsonb('files'), // [{name, mimeType, data, size}]
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ContextSection = typeof contextSections.$inferSelect;
export type NewContextSection = typeof contextSections.$inferInsert;
```

**Step 2: Export from index**

Add to `packages/database/src/schema/index.ts`:

```typescript
export * from './context-sections';
```

**Step 3: Run TypeScript check**

```bash
cd packages/database
pnpm tsc --noEmit
```

**Step 4: Commit**

```bash
git add packages/database/src/schema/context-sections.ts packages/database/src/schema/index.ts
git commit -m "feat(db): add context sections table schema"
```

---

## Task 3: Database Schema - Update Chats Table

**Files:**
- Modify: `packages/database/src/schema/chats.ts`

**Step 1: Add project fields to chats**

Update `packages/database/src/schema/chats.ts`:

```typescript
import { pgTable, uuid, varchar, text, decimal, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const chats = pgTable('chats', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  systemPrompt: text('system_prompt'),
  temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.7'),
  useProjectContext: boolean('use_project_context').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Step 2: Run TypeScript check**

```bash
cd packages/database
pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add packages/database/src/schema/chats.ts
git commit -m "feat(db): add project reference to chats table"
```

---

## Task 4: Database Migration Script

**Files:**
- Create: `packages/database/migrations/001_add_projects.sql`

**Step 1: Create migration SQL**

Create `packages/database/migrations/001_add_projects.sql`:

```sql
-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Create context sections table
CREATE TABLE IF NOT EXISTS project_context_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  extracted_text TEXT,
  files JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_context_sections_project_id ON project_context_sections(project_id);

-- Add columns to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS use_project_context BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_chats_project_id ON chats(project_id);

-- Create default project for each user
INSERT INTO projects (user_id, name, description, is_default)
SELECT
  id,
  'Личные чаты',
  'Автоматически созданный проект для существующих чатов',
  TRUE
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.user_id = users.id AND p.is_default = TRUE
);

-- Assign existing chats to default projects
UPDATE chats
SET project_id = (
  SELECT p.id
  FROM projects p
  WHERE p.user_id = chats.user_id
  AND p.is_default = TRUE
)
WHERE project_id IS NULL;
```

**Step 2: Create migration runner script**

Create `packages/database/scripts/run-migration.ts`:

```typescript
import { db } from '../src';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const migrationPath = path.join(__dirname, '../migrations/001_add_projects.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Running migration: 001_add_projects.sql');

  await db.execute(sql.raw(migrationSQL));

  console.log('Migration completed successfully');
}

runMigration().catch(console.error);
```

**Step 3: Add migration script to package.json**

Add to `packages/database/package.json`:

```json
{
  "scripts": {
    "migrate": "tsx scripts/run-migration.ts"
  }
}
```

**Step 4: Commit**

```bash
git add packages/database/migrations/ packages/database/scripts/run-migration.ts packages/database/package.json
git commit -m "feat(db): add projects migration script"
```

---

## Task 5: Text Extraction Utility

**Files:**
- Create: `services/api/src/utils/text-extractor.ts`

**Step 1: Install pdf-parse**

```bash
cd services/api
pnpm add pdf-parse
pnpm add -D @types/pdf-parse
```

**Step 2: Create text extractor**

Create `services/api/src/utils/text-extractor.ts`:

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

export function formatProjectContext(sections: any[]): string {
  if (!sections || sections.length === 0) {
    return '';
  }

  let context = 'You are an AI assistant working on a project. Here is the project context:\n\n';

  const sectionTitles: Record<string, string> = {
    about_project: 'About Project',
    about_user: 'About User',
    technical: 'Technical Information',
    documents: 'Documents',
  };

  for (const section of sections) {
    if (!section.content && !section.extractedText) {
      continue;
    }

    const title = sectionTitles[section.sectionType] || section.title;
    context += `## ${title}\n\n`;

    if (section.content) {
      context += section.content + '\n\n';
    }

    if (section.extractedText) {
      context += section.extractedText + '\n\n';
    }
  }

  return context.trim();
}
```

**Step 3: Run TypeScript check**

```bash
cd services/api
pnpm tsc --noEmit
```

**Step 4: Commit**

```bash
git add services/api/src/utils/text-extractor.ts services/api/package.json services/api/pnpm-lock.yaml
git commit -m "feat(api): add text extraction utilities"
```

---

## Task 6: Projects API - Create Project Routes

**Files:**
- Create: `services/api/src/routes/projects/index.ts`
- Create: `services/api/src/routes/projects/create.ts`
- Create: `services/api/src/routes/projects/list.ts`
- Create: `services/api/src/routes/projects/get.ts`
- Create: `services/api/src/routes/projects/update.ts`
- Create: `services/api/src/routes/projects/delete.ts`
- Modify: `services/api/src/server.ts`

**Step 1: Create projects index**

Create `services/api/src/routes/projects/index.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { createProjectHandler } from './create';
import { listProjectsHandler } from './list';
import { getProjectHandler } from './get';
import { updateProjectHandler } from './update';
import { deleteProjectHandler } from './delete';

export async function projectRoutes(server: FastifyInstance) {
  server.post('/projects', createProjectHandler);
  server.get('/projects', listProjectsHandler);
  server.get('/projects/:id', getProjectHandler);
  server.put('/projects/:id', updateProjectHandler);
  server.delete('/projects/:id', deleteProjectHandler);
}
```

**Step 2: Create project handler**

Create `services/api/src/routes/projects/create.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, projects } from '@ai-chat/database';

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export async function createProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const body = createProjectSchema.parse(request.body);

  const [project] = await db
    .insert(projects)
    .values({
      userId,
      name: body.name,
      description: body.description,
      isDefault: false,
    })
    .returning();

  return reply.send({
    success: true,
    data: project,
  });
}
```

**Step 3: List projects handler**

Create `services/api/src/routes/projects/list.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, projects } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

export async function listProjectsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(projects.createdAt);

  return reply.send({
    success: true,
    data: userProjects,
  });
}
```

**Step 4: Get project handler**

Create `services/api/src/routes/projects/get.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, projects, contextSections, chats } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

export async function getProjectHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { id } = request.params;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return reply.code(404).send({
      success: false,
      error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
    });
  }

  const sections = await db
    .select()
    .from(contextSections)
    .where(eq(contextSections.projectId, id));

  const projectChats = await db
    .select()
    .from(chats)
    .where(eq(chats.projectId, id))
    .orderBy(chats.updatedAt);

  return reply.send({
    success: true,
    data: {
      project,
      sections,
      chats: projectChats,
    },
  });
}
```

**Step 5: Update project handler**

Create `services/api/src/routes/projects/update.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, projects } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export async function updateProjectHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { id } = request.params;
  const body = updateProjectSchema.parse(request.body);

  const [updated] = await db
    .update(projects)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  if (!updated) {
    return reply.code(404).send({
      success: false,
      error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
    });
  }

  return reply.send({
    success: true,
    data: updated,
  });
}
```

**Step 6: Delete project handler**

Create `services/api/src/routes/projects/delete.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, projects } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

export async function deleteProjectHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { id } = request.params;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return reply.code(404).send({
      success: false,
      error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
    });
  }

  if (project.isDefault) {
    return reply.code(400).send({
      success: false,
      error: { code: 'CANNOT_DELETE_DEFAULT', message: 'Cannot delete default project' },
    });
  }

  await db.delete(projects).where(eq(projects.id, id));

  return reply.send({
    success: true,
  });
}
```

**Step 7: Register routes in server**

Update `services/api/src/server.ts` to include:

```typescript
import { projectRoutes } from './routes/projects';

// In the routes section, after other routes:
await server.register(projectRoutes, { prefix: '/api' });
```

**Step 8: Run TypeScript check**

```bash
cd services/api
pnpm tsc --noEmit
```

**Step 9: Commit**

```bash
git add services/api/src/routes/projects/ services/api/src/server.ts
git commit -m "feat(api): add projects CRUD endpoints"
```

---

## Task 7: Context Sections API Routes

**Files:**
- Create: `services/api/src/routes/projects/context/index.ts`
- Create: `services/api/src/routes/projects/context/create-section.ts`
- Create: `services/api/src/routes/projects/context/list-sections.ts`
- Create: `services/api/src/routes/projects/context/update-section.ts`
- Create: `services/api/src/routes/projects/context/extract-text.ts`
- Modify: `services/api/src/routes/projects/index.ts`

**Step 1: Create context routes index**

Create `services/api/src/routes/projects/context/index.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { createSectionHandler } from './create-section';
import { listSectionsHandler } from './list-sections';
import { updateSectionHandler } from './update-section';
import { extractTextHandler } from './extract-text';

export async function contextRoutes(server: FastifyInstance) {
  server.post('/projects/:projectId/context/sections', createSectionHandler);
  server.get('/projects/:projectId/context/sections', listSectionsHandler);
  server.put('/projects/:projectId/context/sections/:id', updateSectionHandler);
  server.post('/projects/:projectId/context/extract-text', extractTextHandler);
}
```

**Step 2: Create section handler**

Create `services/api/src/routes/projects/context/create-section.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, projects, contextSections } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';
import { extractTextFromFile, truncateText } from '../../../utils/text-extractor';

const fileSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  data: z.string(),
  size: z.number(),
});

const createSectionSchema = z.object({
  sectionType: z.enum(['about_project', 'about_user', 'technical', 'documents']),
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  files: z.array(fileSchema).optional(),
});

export async function createSectionHandler(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { projectId } = request.params;
  const body = createSectionSchema.parse(request.body);

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return reply.code(404).send({
      success: false,
      error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
    });
  }

  // Extract text from files
  let extractedText = '';
  if (body.files && body.files.length > 0) {
    const textParts: string[] = [];

    for (const file of body.files) {
      try {
        const text = await extractTextFromFile(file);
        textParts.push(`### ${file.name}\n\n${text}`);
      } catch (error) {
        console.error(`Failed to extract text from ${file.name}:`, error);
      }
    }

    extractedText = truncateText(textParts.join('\n\n'));
  }

  const [section] = await db
    .insert(contextSections)
    .values({
      projectId,
      sectionType: body.sectionType,
      title: body.title,
      content: body.content,
      extractedText,
      files: body.files || null,
    })
    .returning();

  return reply.send({
    success: true,
    data: section,
  });
}
```

**Step 3: List sections handler**

Create `services/api/src/routes/projects/context/list-sections.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, projects, contextSections } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

export async function listSectionsHandler(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { projectId } = request.params;

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return reply.code(404).send({
      success: false,
      error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
    });
  }

  const sections = await db
    .select()
    .from(contextSections)
    .where(eq(contextSections.projectId, projectId))
    .orderBy(contextSections.createdAt);

  return reply.send({
    success: true,
    data: sections,
  });
}
```

**Step 4: Update section handler**

Create `services/api/src/routes/projects/context/update-section.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db, projects, contextSections } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';
import { extractTextFromFile, truncateText } from '../../../utils/text-extractor';

const fileSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  data: z.string(),
  size: z.number(),
});

const updateSectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  files: z.array(fileSchema).optional(),
});

export async function updateSectionHandler(
  request: FastifyRequest<{ Params: { projectId: string; id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { projectId, id } = request.params;
  const body = updateSectionSchema.parse(request.body);

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    return reply.code(404).send({
      success: false,
      error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' },
    });
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (body.title) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;

  // Extract text from files if provided
  if (body.files !== undefined) {
    updateData.files = body.files;

    if (body.files.length > 0) {
      const textParts: string[] = [];

      for (const file of body.files) {
        try {
          const text = await extractTextFromFile(file);
          textParts.push(`### ${file.name}\n\n${text}`);
        } catch (error) {
          console.error(`Failed to extract text from ${file.name}:`, error);
        }
      }

      updateData.extractedText = truncateText(textParts.join('\n\n'));
    } else {
      updateData.extractedText = null;
    }
  }

  const [updated] = await db
    .update(contextSections)
    .set(updateData)
    .where(and(eq(contextSections.id, id), eq(contextSections.projectId, projectId)))
    .returning();

  if (!updated) {
    return reply.code(404).send({
      success: false,
      error: { code: 'SECTION_NOT_FOUND', message: 'Section not found' },
    });
  }

  return reply.send({
    success: true,
    data: updated,
  });
}
```

**Step 5: Extract text handler**

Create `services/api/src/routes/projects/context/extract-text.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { extractTextFromFile } from '../../../utils/text-extractor';

const extractTextSchema = z.object({
  file: z.object({
    name: z.string(),
    mimeType: z.string(),
    data: z.string(),
  }),
});

export async function extractTextHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = extractTextSchema.parse(request.body);

  try {
    const extractedText = await extractTextFromFile(body.file);

    return reply.send({
      success: true,
      data: {
        extractedText,
      },
    });
  } catch (error: any) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'EXTRACTION_FAILED',
        message: error.message || 'Failed to extract text',
      },
    });
  }
}
```

**Step 6: Register context routes**

Update `services/api/src/routes/projects/index.ts`:

```typescript
import { contextRoutes } from './context';

export async function projectRoutes(server: FastifyInstance) {
  // ... existing routes
  await server.register(contextRoutes);
}
```

**Step 7: Run TypeScript check**

```bash
cd services/api
pnpm tsc --noEmit
```

**Step 8: Commit**

```bash
git add services/api/src/routes/projects/context/
git commit -m "feat(api): add context sections endpoints"
```

---

## Task 8: Update Chat API to Use Project Context

**Files:**
- Modify: `services/api/src/routes/chat/message.ts`
- Modify: `services/api/src/routes/chat/index.ts`

**Step 1: Update message handler to inject context**

Update `services/api/src/routes/chat/message.ts`:

```typescript
import { formatProjectContext } from '../../utils/text-extractor';
import { contextSections } from '@ai-chat/database';

// In sendMessageHandler, after verifying chat ownership:

// Load project context if enabled
let projectContextPrompt = '';
if (chat.useProjectContext && chat.projectId) {
  const sections = await db
    .select()
    .from(contextSections)
    .where(eq(contextSections.projectId, chat.projectId));

  projectContextPrompt = formatProjectContext(sections);
}

// Get chat history
const history = await db
  .select()
  .from(messages)
  .where(eq(messages.chatId, chatId))
  .orderBy(messages.createdAt)
  .limit(20);

const chatMessages = history.map((m, index) => {
  // ... existing code for formatting attachments
});

// Add project context as first system message if available
if (projectContextPrompt) {
  chatMessages.unshift({
    role: 'system' as const,
    content: projectContextPrompt,
  });
}

// Continue with streaming...
```

**Step 2: Add endpoint to toggle context**

Add to `services/api/src/routes/chat/index.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db, chats } from '@ai-chat/database';
import { eq, and } from 'drizzle-orm';

const toggleContextSchema = z.object({
  useProjectContext: z.boolean(),
});

async function toggleContextHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as any).userId;
  const { id } = request.params;
  const body = toggleContextSchema.parse(request.body);

  const [updated] = await db
    .update(chats)
    .set({
      useProjectContext: body.useProjectContext,
      updatedAt: new Date(),
    })
    .where(and(eq(chats.id, id), eq(chats.userId, userId)))
    .returning();

  if (!updated) {
    return reply.code(404).send({
      success: false,
      error: { code: 'CHAT_NOT_FOUND', message: 'Chat not found' },
    });
  }

  return reply.send({
    success: true,
    data: updated,
  });
}

// Register route
export async function chatRoutes(server: FastifyInstance) {
  // ... existing routes
  server.put('/chat/:id/context', toggleContextHandler);
}
```

**Step 3: Update create chat to require projectId**

Update create chat handler to include projectId in schema and values.

**Step 4: Run TypeScript check**

```bash
cd services/api
pnpm tsc --noEmit
```

**Step 5: Commit**

```bash
git add services/api/src/routes/chat/
git commit -m "feat(api): inject project context into chat messages"
```

---

## Task 9: Frontend - Add Projects to API Client

**Files:**
- Modify: `apps/web/lib/api-client.ts`

**Step 1: Add project methods to API client**

Update `apps/web/lib/api-client.ts`:

```typescript
// Add to ApiClient class:

async createProject(name: string, description?: string) {
  const response = await fetch(`${this.baseUrl}/projects`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({ name, description }),
  });
  return response.json();
}

async getProjects() {
  const response = await fetch(`${this.baseUrl}/projects`, {
    headers: this.getHeaders(),
  });
  return response.json();
}

async getProject(id: string) {
  const response = await fetch(`${this.baseUrl}/projects/${id}`, {
    headers: this.getHeaders(),
  });
  return response.json();
}

async updateProject(id: string, data: { name?: string; description?: string }) {
  const response = await fetch(`${this.baseUrl}/projects/${id}`, {
    method: 'PUT',
    headers: this.getHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
}

async deleteProject(id: string) {
  const response = await fetch(`${this.baseUrl}/projects/${id}`, {
    method: 'DELETE',
    headers: this.getHeaders(),
  });
  return response.json();
}

async createContextSection(projectId: string, data: any) {
  const response = await fetch(`${this.baseUrl}/projects/${projectId}/context/sections`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
}

async getContextSections(projectId: string) {
  const response = await fetch(`${this.baseUrl}/projects/${projectId}/context/sections`, {
    headers: this.getHeaders(),
  });
  return response.json();
}

async updateContextSection(projectId: string, sectionId: string, data: any) {
  const response = await fetch(`${this.baseUrl}/projects/${projectId}/context/sections/${sectionId}`, {
    method: 'PUT',
    headers: this.getHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
}

async toggleChatContext(chatId: string, useContext: boolean) {
  const response = await fetch(`${this.baseUrl}/chat/${chatId}/context`, {
    method: 'PUT',
    headers: this.getHeaders(),
    body: JSON.stringify({ useProjectContext: useContext }),
  });
  return response.json();
}
```

**Step 2: Run TypeScript check**

```bash
cd apps/web
pnpm tsc --noEmit
```

**Step 3: Commit**

```bash
git add apps/web/lib/api-client.ts
git commit -m "feat(web): add project API methods to client"
```

---

## Task 10: Frontend - Projects List Page

**Files:**
- Create: `apps/web/app/projects/page.tsx`
- Create: `apps/web/components/projects/ProjectCard.tsx`
- Create: `apps/web/components/projects/CreateProjectDialog.tsx`

**Step 1: Create project card component**

Create `apps/web/components/projects/ProjectCard.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Folder } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    isDefault: boolean;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-accent cursor-pointer transition">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Folder className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <CardTitle>{project.name}</CardTitle>
              {project.description && (
                <CardDescription className="mt-2">
                  {project.description}
                </CardDescription>
              )}
              {project.isDefault && (
                <span className="text-xs text-muted-foreground mt-2 block">
                  Проект по умолчанию
                </span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
```

**Step 2: Create project dialog**

Create `apps/web/components/projects/CreateProjectDialog.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface CreateProjectDialogProps {
  onProjectCreated: () => void;
}

export function CreateProjectDialog({ onProjectCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const result = await apiClient.createProject(name, description);
      if (result.success) {
        toast.success('Проект создан');
        setName('');
        setDescription('');
        setOpen(false);
        onProjectCreated();
      }
    } catch (error) {
      toast.error('Ошибка создания проекта');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Новый проект
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать проект</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мой проект"
            />
          </div>
          <div>
            <Label htmlFor="description">Описание (опционально)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание проекта"
            />
          </div>
          <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
            Создать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Create projects page**

Create `apps/web/app/projects/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { apiClient } from '@/lib/api-client';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.getProjects();
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Проекты</h1>
        <CreateProjectDialog onProjectCreated={loadProjects} />
      </div>

      {isLoading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run TypeScript check**

```bash
cd apps/web
pnpm tsc --noEmit
```

**Step 5: Commit**

```bash
git add apps/web/app/projects/ apps/web/components/projects/
git commit -m "feat(web): add projects list page"
```

---

## Task 11: Frontend - Context Editor Component

**Files:**
- Create: `apps/web/components/projects/ContextEditor.tsx`
- Create: `apps/web/components/projects/ContextSection.tsx`

This task would continue with the context editor UI, project detail page, and updates to the chat interface to show the context toggle.

Due to length constraints, the remaining tasks would include:
- Task 12: Project Detail Page with Tabs
- Task 13: Update Chat Interface with Context Toggle
- Task 14: Update Sidebar to Show Projects
- Task 15: Run Migration and Manual Testing
- Task 16: Final Integration Testing

---

## Success Criteria

- [ ] Users can create, view, update, delete projects
- [ ] Each project has 4 context sections
- [ ] Can upload files and extract text automatically
- [ ] Chat has toggle for using project context
- [ ] Context is injected as system prompt when enabled
- [ ] Existing chats migrated to "Личные чаты" project
- [ ] All TypeScript checks pass
- [ ] API endpoints secured and validated
- [ ] Manual testing completed
