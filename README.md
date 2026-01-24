# AI Chat Platform

A modern, multi-model AI chat platform supporting multiple AI providers through OpenRouter integration. Built with Next.js, React Native (Expo), and a Turborepo monorepo architecture.

## Features

- Multi-model AI chat with support for various providers (OpenAI, Anthropic, Google, X.AI, Mistral, etc.)
- Real-time streaming responses
- Context caching for token optimization
- Premium subscription system with YooKassa integration
- Image upload support
- Bilingual interface (English/Russian)
- Cross-platform support (Web and Mobile)
- User authentication with JWT
- Chat history management and branching conversations

## Tech Stack

- **Frontend (Web)**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Mobile**: React Native with Expo
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenRouter API
- **Payments**: YooKassa
- **Monorepo**: Turborepo with pnpm workspaces
- **State Management**: Zustand

## Project Structure

```
chat-branching/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # Expo mobile application
├── packages/
│   ├── ui/           # Shared React components
│   ├── database/     # Drizzle ORM schemas and client
│   └── shared/       # Shared types and constants
└── docs/             # Documentation and planning
```

## Prerequisites

- Node.js 20 or higher
- pnpm 8 or higher
- PostgreSQL database
- OpenRouter API key
- YooKassa API credentials (for payments)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/privatych/ai-chat-platform.git
cd ai-chat-platform
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example environment file and fill in your credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_chat

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# YooKassa (optional, for premium features)
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up the database

```bash
pnpm db:push
```

### 5. Start development servers

```bash
# Start all apps (web + mobile)
pnpm dev

# Or start individually
pnpm dev:web    # Web app on http://localhost:3000
pnpm dev:mobile # Mobile app with Expo
```

## Available Commands

- `pnpm dev` - Start all development servers
- `pnpm dev:web` - Start web app only
- `pnpm dev:mobile` - Start mobile app only
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm db:push` - Push database schema changes
- `pnpm db:studio` - Open Drizzle Studio

## Environment Variables

### Web App (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `YOOKASSA_SHOP_ID` | YooKassa shop ID | No |
| `YOOKASSA_SECRET_KEY` | YooKassa secret key | No |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## Development Workflow

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed information about our development workflow, branching strategy, and contribution guidelines.

## Project Architecture

### Monorepo Structure

This project uses Turborepo for managing the monorepo. The workspace is organized into:

- **Apps**: Standalone applications (web, mobile)
- **Packages**: Shared code libraries (ui, database, shared)

### Key Technologies

- **Database ORM**: Drizzle for type-safe database queries
- **Styling**: Tailwind CSS for utility-first styling
- **API**: OpenRouter for unified access to multiple AI models
- **Authentication**: JWT-based authentication
- **State Management**: Zustand for client-side state

## License

MIT

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

## Support

For issues and questions, please open an issue on GitHub.
