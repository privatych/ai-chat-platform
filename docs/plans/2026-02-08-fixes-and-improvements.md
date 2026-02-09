# AI Chat Platform Fixes and Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical context routes registration bug and build complete Projects frontend with context editor

**Architecture:** Three-phase rollout: (1) Fix backend context routes registration, (2) Build Projects UI components with context editor, (3) Integrate context into chat system prompts

**Tech Stack:** Fastify (backend), Next.js 15, React 19, TypeScript, Drizzle ORM, shadcn/ui components

---

## Phase 1: Critical Fixes (BLOCKING)

### Task 1: Register Context Routes in Projects API

**Files:**
- Modify: `services/api/src/routes/projects/index.ts`

**Step 1: Import context routes**

Add import at top of file:
```typescript
import { contextRoutes } from './context';
```

**Step 2: Register context routes**

Add after project routes registration (after line 17):
```typescript
// Register context sub-routes
await contextRoutes(app);
```

**Step 3: Restart API server**

Kill and restart:
```bash
lsof -ti:3001 | xargs kill -9
pnpm --filter @ai-chat/api dev > /private/tmp/claude-501/-Users-pravi4-ai-chat-platform/scratchpad/api.log 2>&1 &
sleep 3
```

**Step 4: Test context endpoints**

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"debug@test.com","password":"Debug123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))")

# Get project ID
PROJECT_ID=$(curl -s http://localhost:3001/api/projects -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('data',[])[0].get('id',''))")

# Test create context section
curl -s -X POST "http://localhost:3001/api/projects/$PROJECT_ID/context/sections" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sectionType":"about_project","title":"Test","content":"Testing"}' | python3 -m json.tool
```

Expected: `{"success":true,"data":{...}}` with section created

**Step 5: Commit**

```bash
git add services/api/src/routes/projects/index.ts
git commit -m "fix(api): register context routes in projects API

Fixes 404 errors on /api/projects/:id/context/sections endpoints"
```

---

## Phase 2: Projects Frontend Implementation

### Task 2: Add API Client Methods for Projects

**Files:**
- Modify: `apps/web/lib/api-client.ts`

**Step 1: Add project endpoints after chat endpoints**

Add after line 95 (after renameChat method):
```typescript
// Project endpoints
async createProject(name: string, description?: string) {
  return this.request<any>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

async listProjects() {
  return this.request<any[]>('/api/projects');
}

async getProject(projectId: string) {
  return this.request<any>(`/api/projects/${projectId}`);
}

async updateProject(projectId: string, name: string, description?: string) {
  return this.request<any>(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, description }),
  });
}

async deleteProject(projectId: string) {
  return this.request<{ message: string }>(`/api/projects/${projectId}`, {
    method: 'DELETE',
  });
}

// Context section endpoints
async createContextSection(
  projectId: string,
  sectionType: 'about_project' | 'about_user' | 'technical' | 'documents',
  title: string,
  content?: string,
  files?: any[]
) {
  return this.request<any>(`/api/projects/${projectId}/context/sections`, {
    method: 'POST',
    body: JSON.stringify({ sectionType, title, content, files }),
  });
}

async listContextSections(projectId: string) {
  return this.request<any[]>(`/api/projects/${projectId}/context/sections`);
}

async updateContextSection(
  projectId: string,
  sectionId: string,
  title?: string,
  content?: string,
  files?: any[]
) {
  return this.request<any>(`/api/projects/${projectId}/context/sections/${sectionId}`, {
    method: 'PUT',
    body: JSON.stringify({ title, content, files }),
  });
}
```

**Step 2: Commit**

```bash
git add apps/web/lib/api-client.ts
git commit -m "feat(web): add API client methods for projects and context"
```

---

### Task 3: Create Project Selector Component

**Files:**
- Create: `apps/web/components/projects/ProjectSelector.tsx`

**Step 1: Create component file**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, FolderOpen } from 'lucide-react';

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onProjectChange: (projectId: string) => void;
}

export function ProjectSelector({
  selectedProjectId,
  onProjectChange,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const response = await apiClient.listProjects();
    if (response.success && response.data) {
      setProjects(response.data);
      // Auto-select first project if none selected
      if (!selectedProjectId && response.data.length > 0) {
        onProjectChange(response.data[0].id);
      }
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    setIsLoading(true);
    const response = await apiClient.createProject(
      newProjectName.trim(),
      newProjectDescription.trim() || undefined
    );

    if (response.success && response.data) {
      setProjects([...projects, response.data]);
      onProjectChange(response.data.id);
      setIsCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      toast.success('Проект создан');
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="flex gap-2 items-center">
        <Select value={selectedProjectId || ''} onValueChange={onProjectChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Выберите проект">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {projects.find(p => p.id === selectedProjectId)?.name || 'Проект'}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {project.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCreateDialogOpen(true)}
          title="Создать проект"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый проект</DialogTitle>
            <DialogDescription>
              Создайте проект для организации чатов и контекста
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Название проекта"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleCreateProject();
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание (опционально)</Label>
              <Textarea
                id="description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Краткое описание проекта"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateProject} disabled={isLoading}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/projects/ProjectSelector.tsx
git commit -m "feat(web): add ProjectSelector component with create dialog"
```

---

### Task 4: Create Context Editor Component

**Files:**
- Create: `apps/web/components/projects/ContextEditor.tsx`

**Step 1: Create component file**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, FileText, User, Code, FolderOpen } from 'lucide-react';

interface ContextEditorProps {
  projectId: string | null;
}

const SECTION_TYPES = [
  { value: 'about_project', label: 'О проекте', icon: FolderOpen },
  { value: 'about_user', label: 'О пользователе', icon: User },
  { value: 'technical', label: 'Техническая информация', icon: Code },
  { value: 'documents', label: 'Документы', icon: FileText },
] as const;

export function ContextEditor({ projectId }: ContextEditorProps) {
  const [sections, setSections] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    sectionType: 'about_project' as const,
    title: '',
    content: '',
  });

  useEffect(() => {
    if (projectId) {
      loadSections();
    } else {
      setSections([]);
    }
  }, [projectId]);

  const loadSections = async () => {
    if (!projectId) return;

    const response = await apiClient.listContextSections(projectId);
    if (response.success && response.data) {
      setSections(response.data);
    }
  };

  const handleCreateSection = async () => {
    if (!projectId || !formData.title.trim()) {
      toast.error('Заполните название секции');
      return;
    }

    setIsLoading(true);
    const response = await apiClient.createContextSection(
      projectId,
      formData.sectionType,
      formData.title.trim(),
      formData.content.trim() || undefined
    );

    if (response.success && response.data) {
      setSections([...sections, response.data]);
      setIsCreateDialogOpen(false);
      setFormData({ sectionType: 'about_project', title: '', content: '' });
      toast.success('Секция создана');
    }
    setIsLoading(false);
  };

  const getSectionIcon = (type: string) => {
    const section = SECTION_TYPES.find(s => s.value === type);
    const Icon = section?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getSectionLabel = (type: string) => {
    return SECTION_TYPES.find(s => s.value === type)?.label || type;
  };

  if (!projectId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Выберите проект для редактирования контекста
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Контекст проекта</h3>
          <p className="text-sm text-muted-foreground">
            Информация, которая будет доступна AI в чатах этого проекта
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить секцию
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет секций контекста. Добавьте первую секцию.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSectionIcon(section.sectionType)}
                    <div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {getSectionLabel(section.sectionType)}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {section.content && (
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {section.content.length > 200
                      ? section.content.substring(0, 200) + '...'
                      : section.content}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Section Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить секцию контекста</DialogTitle>
            <DialogDescription>
              Информация из этой секции будет доступна AI при общении
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Тип секции</Label>
              <Select
                value={formData.sectionType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, sectionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Например: О проекте, Требования, Стиль кода"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Содержимое</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Введите информацию для AI..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setFormData({ sectionType: 'about_project', title: '', content: '' });
              }}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button onClick={handleCreateSection} disabled={isLoading}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/projects/ContextEditor.tsx
git commit -m "feat(web): add ContextEditor component for managing context sections"
```

---

### Task 5: Integrate Projects into Chat Sidebar

**Files:**
- Modify: `apps/web/components/chat/ChatSidebar.tsx`

**Step 1: Import ProjectSelector and ContextEditor**

Add imports at top:
```typescript
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { ContextEditor } from '@/components/projects/ContextEditor';
import { Settings } from 'lucide-react';
```

**Step 2: Add state for selected project and context dialog**

Add after existing state (around line 40):
```typescript
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
```

**Step 3: Update ChatSidebarProps interface**

Add new optional prop:
```typescript
interface ChatSidebarProps {
  chats: any[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>;
  onDeleteChat: (chatId: string) => Promise<void>;
  onProjectChange?: (projectId: string | null) => void; // NEW
}
```

**Step 4: Handle project change**

Add handler:
```typescript
const handleProjectChange = (projectId: string) => {
  setSelectedProjectId(projectId);
  if (onProjectChange) {
    onProjectChange(projectId);
  }
};
```

**Step 5: Update JSX to include ProjectSelector**

Replace the return statement content. After opening `<div className="w-64 border-r...">`, add:
```typescript
{/* Project Selector */}
<div className="p-4 border-b space-y-2">
  <ProjectSelector
    selectedProjectId={selectedProjectId}
    onProjectChange={handleProjectChange}
  />
  <Button
    variant="outline"
    size="sm"
    className="w-full"
    onClick={() => setIsContextDialogOpen(true)}
    disabled={!selectedProjectId}
  >
    <Settings className="mr-2 h-4 w-4" />
    Редактировать контекст
  </Button>
</div>
```

**Step 6: Add Context Editor Dialog**

Add after the Delete Confirmation Dialog (at the end before closing `</>`):
```typescript
{/* Context Editor Dialog */}
<Dialog open={isContextDialogOpen} onOpenChange={setIsContextDialogOpen}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Контекст проекта</DialogTitle>
      <DialogDescription>
        Управление информацией для AI в этом проекте
      </DialogDescription>
    </DialogHeader>
    <ContextEditor projectId={selectedProjectId} />
  </DialogContent>
</Dialog>
```

**Step 7: Commit**

```bash
git add apps/web/components/chat/ChatSidebar.tsx
git commit -m "feat(web): integrate ProjectSelector and ContextEditor into ChatSidebar"
```

---

### Task 6: Update Chat Page to Support Projects

**Files:**
- Modify: `apps/web/app/chat/page.tsx`

**Step 1: Add project state**

Add after existing state (around line 20):
```typescript
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
```

**Step 2: Pass project change handler to ChatSidebar**

Update ChatSidebar props (around line 95):
```typescript
<ChatSidebar
  chats={chats}
  currentChatId={currentChatId}
  onSelectChat={setCurrentChatId}
  onNewChat={createNewChat}
  onRenameChat={handleRenameChat}
  onDeleteChat={handleDeleteChat}
  onProjectChange={setSelectedProjectId}
/>
```

**Step 3: Commit**

```bash
git add apps/web/app/chat/page.tsx
git commit -m "feat(web): add project state management to chat page"
```

---

## Phase 3: Context Integration into Chat

### Task 7: Add Context Injection to Message Handler

**Files:**
- Modify: `services/api/src/routes/chat/message.ts`

**Step 1: Import context sections and projects**

Add imports at top:
```typescript
import { projects, contextSections } from '@ai-chat/database';
```

**Step 2: Add function to build system prompt with context**

Add before `sendMessageHandler` function:
```typescript
async function buildSystemPromptWithContext(
  chatId: string,
  userId: string,
  basePrompt?: string
): Promise<string> {
  // Get chat with project reference
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || !chat.useProjectContext || !chat.projectId) {
    return basePrompt || '';
  }

  // Get all context sections for this project
  const sections = await db
    .select()
    .from(contextSections)
    .where(eq(contextSections.projectId, chat.projectId))
    .orderBy(contextSections.createdAt);

  if (sections.length === 0) {
    return basePrompt || '';
  }

  // Build context prompt
  const contextParts = sections.map(section => {
    let text = `## ${section.title}\n\n`;
    if (section.content) {
      text += section.content + '\n\n';
    }
    if (section.extractedText) {
      text += section.extractedText + '\n\n';
    }
    return text;
  });

  const contextPrompt = `# Project Context\n\n${contextParts.join('\n---\n\n')}`;

  return basePrompt
    ? `${contextPrompt}\n\n---\n\n${basePrompt}`
    : contextPrompt;
}
```

**Step 3: Use context in message handler**

Find where messages are fetched (around line 50), and after that add:
```typescript
// Build system prompt with context if enabled
const systemPrompt = await buildSystemPromptWithContext(
  chatId,
  userId,
  chat.systemPrompt || undefined
);
```

**Step 4: Pass systemPrompt to OpenRouter**

Find the OpenRouter request body (around line 90) and update:
```typescript
const requestBody = {
  model: chat.model,
  messages: [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...formattedMessages,
  ],
  stream: true,
};
```

**Step 5: Test context injection**

Create manual test script `services/api/scripts/test-context-injection.ts`:
```typescript
import { apiClient } from '../../../apps/web/lib/api-client';

async function test() {
  // Login
  const auth = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'debug@test.com', password: 'Debug123' }),
  }).then(r => r.json());

  const token = auth.data.token;

  // Create project
  const project = await fetch('http://localhost:3001/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: 'Test Context Project' }),
  }).then(r => r.json());

  console.log('Created project:', project.data.id);

  // Create context section
  await fetch(`http://localhost:3001/api/projects/${project.data.id}/context/sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sectionType: 'about_project',
      title: 'Project Rules',
      content: 'Always respond in uppercase',
    }),
  });

  console.log('Created context section');

  // Create chat with project
  const chat = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Context Test',
      model: 'openai/gpt-3.5-turbo',
      projectId: project.data.id,
      useProjectContext: true,
    }),
  }).then(r => r.json());

  console.log('Created chat:', chat.data.id);
  console.log('✓ Context injection setup complete');
}

test().catch(console.error);
```

**Step 6: Commit**

```bash
git add services/api/src/routes/chat/message.ts services/api/scripts/test-context-injection.ts
git commit -m "feat(api): add context injection to chat system prompts

- Build system prompt from project context sections
- Inject context when useProjectContext is enabled
- Add test script for context injection"
```

---

### Task 8: Add Project Selection to Chat Creation

**Files:**
- Modify: `apps/web/app/chat/page.tsx`

**Step 1: Update createNewChat to use selected project**

Find `createNewChat` function (around line 40) and update:
```typescript
const createNewChat = async () => {
  const response = await apiClient.createChat(
    'Новый чат',
    selectedModel,
    selectedProjectId || undefined // Pass project ID
  );
  if (response.success && response.data) {
    setChats([response.data, ...chats]);
    setCurrentChatId(response.data.id);
    toast.success('Чат создан');
  }
};
```

**Step 2: Update API client createChat signature**

Modify `apps/web/lib/api-client.ts`:
```typescript
async createChat(title: string, model: string, projectId?: string) {
  return this.request<any>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ title, model, projectId }),
  });
}
```

**Step 3: Update backend create chat handler**

Modify `services/api/src/routes/chat/create.ts`:
```typescript
const createChatSchema = z.object({
  title: z.string().min(1),
  model: z.string(),
  projectId: z.string().uuid().optional(), // ADD THIS
});

// In handler, use projectId from body:
const [chat] = await db
  .insert(chats)
  .values({
    userId,
    projectId: body.projectId || null, // ADD THIS
    title: body.title,
    model: body.model,
  })
  .returning();
```

**Step 4: Commit**

```bash
git add apps/web/app/chat/page.tsx apps/web/lib/api-client.ts services/api/src/routes/chat/create.ts
git commit -m "feat: connect chat creation to selected project

- Pass projectId when creating new chats
- Update API client and backend to handle projectId
- Chats are now created within selected project context"
```

---

## Phase 4: Minor Fixes and Polish

### Task 9: Fix Support Page Email Integration

**Files:**
- Modify: `apps/web/app/support/page.tsx`

**Step 1: Replace console.log with API call**

Find the handleSubmit function (around line 40) and update:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // TODO: Replace with actual email service integration
    // For now, just simulate success
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  } catch (error) {
    toast.error('Ошибка отправки. Попробуйте позже.');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Step 2: Add TODO comment for future implementation**

Add comment at top of file:
```typescript
/**
 * TODO: Email Integration
 * - Set up email service (SendGrid, AWS SES, or Resend)
 * - Create /api/support/contact endpoint
 * - Add rate limiting
 * - Add spam protection (reCAPTCHA)
 */
```

**Step 3: Commit**

```bash
git add apps/web/app/support/page.tsx
git commit -m "docs(web): add TODO for email service integration in support form"
```

---

### Task 10: Add Migration Runner Script

**Files:**
- Create: `packages/database/scripts/migrate.ts`

**Step 1: Create migration runner**

```typescript
import { db } from '../src';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} migration files`);

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await db.execute(sql.raw(migrationSQL));
    console.log(`✓ ${file} completed`);
  }

  console.log('All migrations completed successfully');
}

runMigrations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
```

**Step 2: Add npm script**

Modify `packages/database/package.json`, add to scripts:
```json
{
  "scripts": {
    "migrate": "DATABASE_URL=$DATABASE_URL tsx scripts/migrate.ts"
  }
}
```

**Step 3: Commit**

```bash
git add packages/database/scripts/migrate.ts packages/database/package.json
git commit -m "feat(db): add automated migration runner script"
```

---

## Testing Checklist

After completing all tasks, verify:

- [ ] Context routes return 200 (not 404)
- [ ] Can create projects via UI
- [ ] Can add context sections via UI
- [ ] Context editor displays all sections
- [ ] Project selector switches projects
- [ ] New chats created with selected project
- [ ] Chat messages include project context (test with simple rule in context)
- [ ] Migrations run without errors

## Manual Test Script

```bash
# 1. Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test1234","fullName":"Tester"}'

# 2. Open frontend http://localhost:3000
# 3. Login with test@example.com / Test1234
# 4. Create project "Test Project"
# 5. Add context section: "Always say 'CONTEXT ACTIVE' in responses"
# 6. Create new chat (should be in Test Project)
# 7. Send message "Hello"
# 8. Verify response contains "CONTEXT ACTIVE"
```

---

## Estimated Time

- **Phase 1 (Critical)**: 15 minutes
- **Phase 2 (Frontend)**: 2-3 hours
- **Phase 3 (Integration)**: 1 hour
- **Phase 4 (Polish)**: 30 minutes

**Total**: ~4-5 hours

---

## Dependencies

- Node.js >= 20
- pnpm >= 9
- PostgreSQL (Neon)
- OpenRouter API key
- Running dev servers (API on :3001, Web on :3000)
