# File Upload Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate file/image upload functionality into chat message flow with support for vision-enabled AI models

**Architecture:** Frontend FileUpload component captures files as base64, MessageInput sends them with message content to API, backend formats attachments for OpenRouter API based on model capabilities, and saves to database

**Tech Stack:** React, TypeScript, Zod validation, Drizzle ORM, OpenRouter API

---

## Task 1: Update API Types and Validation

**Files:**
- Modify: `services/api/src/routes/chat/message.ts:7-10`
- Modify: `services/api/src/services/openrouter.ts:5-8`

**Step 1: Update message schema validation**

Add attachments to the request validation schema in `services/api/src/routes/chat/message.ts`:

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

**Step 2: Update OpenRouter Message interface**

Update the Message interface in `services/api/src/services/openrouter.ts` to support vision format:

```typescript
interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
}
```

**Step 3: Commit type updates**

```bash
git add services/api/src/routes/chat/message.ts services/api/src/services/openrouter.ts
git commit -m "feat: add attachments validation and vision content types"
```

---

## Task 2: Add Message Formatting Function

**Files:**
- Modify: `services/api/src/services/openrouter.ts:97`

**Step 1: Add formatMessageWithAttachments function**

Add this function before the `streamChatCompletion` export in `services/api/src/services/openrouter.ts`:

```typescript
interface Attachment {
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  data: string;
  size: number;
}

export function formatMessageWithAttachments(
  content: string,
  attachments?: Attachment[]
): string | MessageContent[] {
  if (!attachments || attachments.length === 0) {
    return content;
  }

  const contentParts: MessageContent[] = [
    { type: 'text', text: content }
  ];

  for (const attachment of attachments) {
    if (attachment.type === 'image') {
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: `data:${attachment.mimeType};base64,${attachment.data}`
        }
      });
    }
    // For files, we can add text content or similar handling
    // For now, images are primary focus
  }

  return contentParts;
}
```

**Step 2: Run TypeScript check**

```bash
cd services/api
pnpm tsc --noEmit
```

Expected: No errors

**Step 3: Commit formatting function**

```bash
git add services/api/src/services/openrouter.ts
git commit -m "feat: add message formatting for attachments"
```

---

## Task 3: Update Message Handler to Process Attachments

**Files:**
- Modify: `services/api/src/routes/chat/message.ts:45-63`

**Step 1: Extract attachments from request body**

In `sendMessageHandler`, after parsing the body, extract attachments:

```typescript
const body = sendMessageSchema.parse(request.body);
const { content, model, attachments } = body;
```

**Step 2: Save user message with attachments**

Update the message insertion to include attachments:

```typescript
await db.insert(messages).values({
  chatId,
  role: 'user',
  content: body.content,
  attachments: attachments || null,
});
```

**Step 3: Format messages for OpenRouter**

Import the formatting function and update the chat history mapping:

```typescript
import { streamChatCompletion, formatMessageWithAttachments } from '../../services/openrouter';

// ... later in the code ...

const chatMessages = history.map((m, index) => {
  // Check if this is the latest user message with attachments
  const isLatestUserMessage = index === history.length - 1 && m.role === 'user';
  const messageAttachments = isLatestUserMessage ? attachments : (m.attachments as any);

  return {
    role: m.role as 'user' | 'assistant' | 'system',
    content: formatMessageWithAttachments(m.content, messageAttachments),
  };
});
```

**Step 4: Run TypeScript check**

```bash
cd services/api
pnpm tsc --noEmit
```

Expected: No errors

**Step 5: Commit message handler updates**

```bash
git add services/api/src/routes/chat/message.ts
git commit -m "feat: process and format attachments in message handler"
```

---

## Task 4: Integrate FileUpload in MessageInput

**Files:**
- Modify: `apps/web/components/chat/MessageInput.tsx:8,24-26,81-99`

**Step 1: Import FileUpload and Attachment type**

Update imports at the top of MessageInput.tsx:

```typescript
import { FileUpload, Attachment } from './FileUpload';
```

**Step 2: Add attachments state**

Add state for attachments after the input state:

```typescript
const [input, setInput] = useState('');
const [attachments, setAttachments] = useState<Attachment[]>([]);
const [isLoading, setIsLoading] = useState(false);
```

**Step 3: Get model capabilities**

Add model lookup to determine if it supports vision/files:

```typescript
const currentModel = [...AI_MODELS.free, ...AI_MODELS.premium].find(
  m => m.id === selectedModel
);
const supportsVision = currentModel?.supportsVision || false;
const supportsFiles = currentModel?.supportsFiles || false;
```

**Step 4: Update handleSend to include attachments**

Modify the handleSend function to include attachments in the API call:

```typescript
const handleSend = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    content: input,
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  setIsLoading(true);
  onStreamingChange(true);

  // Add user message
  onMessagesUpdate((prev: any[]) => [...prev, userMessage]);
  setInput('');
  setAttachments([]); // Clear attachments after sending

  // ... rest of the function stays the same ...
};
```

**Step 5: Update apiClient.streamMessage call**

Modify the streamMessage call to pass attachments:

```typescript
await apiClient.streamMessage(
  chatId,
  userMessage.content,
  selectedModel,
  userMessage.attachments, // Add this parameter
  (chunk) => {
    // ... existing code ...
  },
  (tokensUsed) => {
    // ... existing code ...
  }
);
```

**Step 6: Add FileUpload component to JSX**

Update the JSX to include FileUpload before the Textarea:

```typescript
return (
  <div className="p-4 border-t">
    <div className="flex flex-col gap-2 max-w-3xl mx-auto">
      <FileUpload
        onAttachmentsChange={setAttachments}
        supportsVision={supportsVision}
        supportsFiles={supportsFiles}
        disabled={isLoading}
      />
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[60px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
);
```

**Step 7: Run TypeScript check**

```bash
cd apps/web
pnpm tsc --noEmit
```

Expected: No errors (may have one error about apiClient.streamMessage signature - we'll fix that next)

**Step 8: Commit MessageInput integration**

```bash
git add apps/web/components/chat/MessageInput.tsx
git commit -m "feat: integrate FileUpload component in MessageInput"
```

---

## Task 5: Update API Client to Send Attachments

**Files:**
- Modify: `apps/web/lib/api-client.ts`

**Step 1: Read current API client implementation**

First check the current streamMessage signature to understand what needs updating.

**Step 2: Update streamMessage to accept attachments**

Add attachments parameter to the streamMessage method:

```typescript
async streamMessage(
  chatId: string,
  content: string,
  model: string,
  attachments: any[] | undefined,
  onChunk: (chunk: string) => void,
  onComplete: (tokensUsed: number) => void
) {
  const response = await fetch(`${this.baseUrl}/chat/${chatId}/message`, {
    method: 'POST',
    headers: this.getHeaders(),
    body: JSON.stringify({
      content,
      model,
      attachments
    }),
  });

  // ... rest of streaming logic stays the same ...
}
```

**Step 3: Run TypeScript check**

```bash
cd apps/web
pnpm tsc --noEmit
```

Expected: No errors

**Step 4: Commit API client updates**

```bash
git add apps/web/lib/api-client.ts
git commit -m "feat: add attachments parameter to streamMessage"
```

---

## Task 6: Display Attachments in Chat History

**Files:**
- Modify: `apps/web/components/chat/ChatInterface.tsx`

**Step 1: Read current ChatInterface implementation**

Check how messages are currently displayed.

**Step 2: Add attachment rendering**

Update the message rendering to show attachments. Add this helper component:

```typescript
function AttachmentDisplay({ attachment }: { attachment: any }) {
  if (attachment.type === 'image') {
    return (
      <div className="relative w-48 h-48 rounded overflow-hidden bg-muted my-2">
        <img
          src={`data:${attachment.mimeType};base64,${attachment.data}`}
          alt={attachment.name}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-secondary rounded-lg p-2 my-2 max-w-xs">
      <FileText className="w-5 h-5 text-muted-foreground" />
      <span className="text-sm">{attachment.name}</span>
    </div>
  );
}
```

**Step 3: Update message rendering to include attachments**

In the message map, add attachment rendering:

```typescript
{message.attachments && message.attachments.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {message.attachments.map((att: any, idx: number) => (
      <AttachmentDisplay key={idx} attachment={att} />
    ))}
  </div>
)}
```

**Step 4: Add required imports**

```typescript
import { FileText } from 'lucide-react';
```

**Step 5: Run TypeScript check**

```bash
cd apps/web
pnpm tsc --noEmit
```

Expected: No errors

**Step 6: Commit chat history updates**

```bash
git add apps/web/components/chat/ChatInterface.tsx
git commit -m "feat: display attachments in chat history"
```

---

## Task 7: Manual Testing

**Step 1: Start the development servers**

```bash
# Terminal 1 - Database
cd packages/database
pnpm db:studio

# Terminal 2 - API
cd services/api
pnpm dev

# Terminal 3 - Web
cd apps/web
pnpm dev
```

**Step 2: Test image upload with vision model**

1. Open http://localhost:3000
2. Login
3. Select "Gemini 2.0 Flash" (supports vision)
4. Click paperclip icon
5. Upload a JPG/PNG image
6. Add text: "Что на этом изображении?"
7. Send message
8. Verify: Image displays in UI, API receives it, response is relevant

**Step 3: Test file upload with files model**

1. Select "Claude 3.5 Sonnet" (supports files)
2. Upload a PDF or TXT file
3. Ask question about the file
4. Verify: File displays, sends successfully

**Step 4: Test model without vision**

1. Select "GPT-3.5 Turbo" (no vision)
2. Try to upload image
3. Verify: Error message shows "Текущая модель не поддерживает изображения"

**Step 5: Test large file rejection**

1. Try uploading file > 10MB
2. Verify: Error message shows "Файл слишком большой"

**Step 6: Test multiple files**

1. Upload 2-3 images at once
2. Verify: All display, all can be removed individually
3. Send and verify all are included

**Step 7: Test chat history persistence**

1. Send message with attachment
2. Refresh page
3. Verify: Attachment displays in history

**Step 8: Document test results**

Create a simple test log noting any issues found.

---

## Task 8: Fix Any Issues and Final Commit

**Step 1: Address any bugs found during testing**

Fix any issues discovered in manual testing.

**Step 2: Run final type check across all packages**

```bash
pnpm -r tsc --noEmit
```

Expected: No errors

**Step 3: Create final commit**

```bash
git add -A
git commit -m "feat: complete file upload integration with vision support

- Add attachments validation and types
- Format messages for vision models
- Integrate FileUpload in MessageInput
- Display attachments in chat history
- Support images and files based on model capabilities

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 4: Verify git status is clean**

```bash
git status
```

Expected: "nothing to commit, working tree clean"

---

## Success Criteria

- [ ] Users can upload images/files via paperclip button
- [ ] Attachments show in UI with preview for images
- [ ] Messages with attachments send successfully to API
- [ ] API formats attachments correctly for OpenRouter
- [ ] Attachments save to database
- [ ] Chat history shows attachments on refresh
- [ ] Models without vision/files show appropriate errors
- [ ] Large files (>10MB) are rejected with error message
- [ ] Multiple files can be attached and removed
- [ ] All TypeScript checks pass
- [ ] Manual testing completed successfully
