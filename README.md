# AI Chat Platform

A modern AI chat platform with support for multiple AI models and image generation capabilities.

## ✨ Features

- 💬 **Multi-Model Chat** - Access 7+ AI models including GPT-4, Claude 3.5, Gemini 2.5 Pro
  - FREE: 50 messages/day with 3 basic models
  - PREMIUM: 1000 messages/day with all models

- 🎨 **AI Image Generation** - Create stunning images with 20+ AI models (FLUX, Stable Diffusion, etc.)
  - FREE: 10 generations/day with 4 basic models
  - PREMIUM: 30 generations/day with 16 top models including FLUX.2 Pro/Max
  - Multiple styles: Photorealistic, Anime, Artistic, Architecture
  - Resolution up to 2048×2048 (Premium)

- 📁 **Project Context** - Organize chats by project with custom context
- 💾 **Persistent Storage** - All conversations and images saved securely
- 🔒 **Secure Authentication** - JWT-based auth with subscription management
- 🌓 **Dark/Light Mode** - Beautiful UI with theme support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-chat-platform.git
cd ai-chat-platform

# Install dependencies
pnpm install

# Setup database
cd packages/database
pnpm db:push

# Configure environment variables
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env

# Start development servers
pnpm dev
```

## 🖼️ Image Generation Setup

1. Get OpenRouter API key from https://openrouter.ai

2. Add to `services/api/.env`:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-your_key_here
   UPLOAD_DIR=/var/www/ai-chat-platform/uploads/images
   ```

3. Create upload directory:
   ```bash
   mkdir -p /var/www/ai-chat-platform/uploads/images
   chmod 755 /var/www/ai-chat-platform/uploads
   ```

4. Configure Nginx to serve images:
   ```nginx
   location /uploads/images/ {
       alias /var/www/ai-chat-platform/uploads/images/;
       expires 30d;
       add_header Cache-Control "public, immutable";
   }
   ```

## 📦 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Shadcn/ui** - UI components

### Backend
- **Fastify** - Fast web framework
- **Drizzle ORM** - Type-safe database access
- **PostgreSQL** - Primary database
- **Redis** - Caching and rate limiting
- **OpenRouter** - AI model provider

### Infrastructure
- **Turborepo** - Monorepo management
- **Docker** - Containerization
- **PM2** - Process management
- **Nginx** - Reverse proxy

## 🏗️ Project Structure

```
.
├── apps/
│   └── web/              # Next.js frontend
├── packages/
│   ├── database/         # Drizzle schema and migrations
│   └── shared/           # Shared types and constants
├── services/
│   └── api/              # Fastify backend API
└── docs/                 # Documentation
```

## 🔧 Development

```bash
# Start all services
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## 🌐 Deployment

See [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) for detailed deployment instructions.

## 📝 Environment Variables

### API Service (`services/api/.env`)

```bash
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_chat
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPENROUTER_API_KEY=sk-or-v1-your-key
UPLOAD_DIR=/var/www/ai-chat-platform/uploads/images
WEB_URL=http://localhost:3000
```

### Web App (`apps/web/.env`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## 💬 Support

For issues and questions, please open a GitHub issue or contact support@example.com
