# AI Chat Platform — MVP Design

## Overview

Cross-platform AI chat application with multi-model support via OpenRouter API.

**Target:** Working MVP with web + mobile apps, mock integrations, freemium model.

## Tech Stack (Simplified for MVP)

| Layer | Technology |
|-------|------------|
| Web Frontend | Next.js 15 (App Router) |
| Mobile Frontend | Expo SDK 52 (React Native) |
| Shared UI | React Native + react-native-web |
| API | Next.js API Routes |
| Database | SQLite (dev) → PostgreSQL (prod) |
| ORM | Drizzle ORM |
| State | Zustand + TanStack Query |
| Styling | Tailwind CSS + NativeWind |

## Project Structure

```
ai-chat-platform/
├── apps/
│   ├── web/                 # Next.js app
│   │   ├── app/
│   │   │   ├── api/         # API routes
│   │   │   ├── (auth)/      # Login, register pages
│   │   │   ├── chat/        # Chat UI
│   │   │   └── layout.tsx
│   │   └── package.json
│   └── mobile/              # Expo app
│       ├── app/             # Expo Router screens
│       └── package.json
├── packages/
│   ├── ui/                  # Shared React components
│   │   └── src/
│   │       ├── primitives/  # Button, Input, Avatar
│   │       └── chat/        # MessageBubble, ChatList
│   ├── shared/              # Types, constants, utils
│   │   └── src/
│   │       ├── types/
│   │       └── constants/
│   └── database/            # Drizzle schemas
│       └── src/
│           ├── schema.ts
│           └── client.ts
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | text | unique |
| name | text | nullable |
| passwordHash | text | bcrypt |
| tier | text | 'free' or 'premium' |
| messagesUsedToday | integer | resets daily |
| createdAt | timestamp | |

### chats
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| userId | uuid | FK → users |
| title | text | auto-generated |
| model | text | 'gpt-4', 'claude-3', etc |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| chatId | uuid | FK → chats |
| role | text | 'user', 'assistant', 'system' |
| content | text | message body |
| model | text | which model responded |
| parentMessageId | uuid | nullable, for branching |
| createdAt | timestamp | |

## API Endpoints

### Auth
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — get JWT token
- `GET /api/auth/me` — current user

### Chats
- `GET /api/chats` — list user's chats
- `POST /api/chats` — create new chat
- `GET /api/chats/[id]` — get chat with messages
- `PATCH /api/chats/[id]` — update title
- `DELETE /api/chats/[id]` — delete chat

### Messages
- `POST /api/chats/[id]/messages` — send message, stream response (SSE)

### Models
- `GET /api/models` — list available AI models

## Mock Services

### OpenRouter Mock
Returns realistic streaming responses based on selected model:
- GPT-4: Formal, detailed responses
- Claude: Friendly, conversational style
- Gemini: Balanced, informative

Simulates 50ms delay per word for typing effect.

### Payment Mock
- Always returns success for subscription
- 7-day trial period simulation

## Freemium Logic

### Free Tier
- 50 messages per day
- Basic models only (gpt-4o-mini, claude-haiku, gemini-flash)
- 7-day chat history

### Premium Tier
- Unlimited messages
- All models including GPT-4, Claude Opus
- Unlimited history
- Comparison mode (future)

## Shared UI Components

Built with React Native primitives, work on both platforms via react-native-web:

### Primitives
- Button, Input, Text, Avatar, Badge, Spinner

### Chat Components
- MessageBubble (user/assistant styling)
- MessageList (virtualized)
- MessageInput (with send button)
- ChatListItem
- ModelSelector

### Layout
- Container, Header, Sidebar (web only)

## Development Phases

### Phase 1: Foundation
1. Install tools (Node.js, pnpm)
2. Initialize monorepo
3. Setup shared packages

### Phase 2: Backend
4. Database schema + migrations
5. API routes implementation
6. Mock OpenRouter integration

### Phase 3: Web App
7. Auth pages (login, register)
8. Chat UI
9. Model selection

### Phase 4: Mobile App
10. Expo setup
11. Integrate shared UI
12. Platform-specific navigation

---

*Document created: 2025-01-22*
