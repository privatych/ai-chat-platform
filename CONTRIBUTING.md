# Contributing to AI Chat Platform

Thank you for your interest in contributing to the AI Chat Platform! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Branching Workflow](#branching-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Development Setup

### Prerequisites

Ensure you have the following installed:

- Node.js 20 or higher
- pnpm 8 or higher
- PostgreSQL database
- Git

### Initial Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/ai-chat-platform.git
cd ai-chat-platform
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy the example environment file and configure it:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in the required environment variables (see README.md for details).

4. **Set up the database**

```bash
pnpm db:push
```

5. **Start development servers**

```bash
pnpm dev
```

## Branching Workflow

We use a feature branch workflow to maintain a clean and stable main branch.

### Branch Types

- `main` - Production-ready code, protected branch
- `develop` - Integration branch for features (optional)
- `feature/description` - New features (e.g., `feature/add-voice-input`)
- `bugfix/description` - Bug fixes (e.g., `bugfix/fix-model-selector`)
- `enhancement/description` - Improvements to existing features
- `hotfix/description` - Emergency production fixes

### Workflow Steps

#### 1. Start a new feature

Always start from the latest main branch:

```bash
# Ensure you're on main
git checkout main

# Pull latest changes
git pull origin main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

#### 2. Make your changes

- Write clean, maintainable code
- Follow the project's code style guidelines
- Add tests for new functionality
- Update documentation as needed

#### 3. Commit your changes

Make small, logical commits with descriptive messages:

```bash
# Stage your changes
git add <files>

# Commit with a descriptive message
git commit -m "Add feature: description of what you did

Detailed explanation of the changes and why they were needed.

Co-Authored-By: Your Name <your.email@example.com>"
```

#### 4. Keep your branch up to date

Regularly sync with main to avoid conflicts:

```bash
# Fetch latest changes
git fetch origin

# Rebase on main
git rebase origin/main
```

#### 5. Push your branch

```bash
git push -u origin feature/your-feature-name
```

#### 6. Create a Pull Request

Go to GitHub and create a pull request from your branch to `main`.

### Branch Naming Conventions

- Use lowercase letters
- Use hyphens to separate words
- Be descriptive but concise
- Include the type prefix

**Good examples:**
- `feature/chat-export-pdf`
- `bugfix/streaming-timeout`
- `enhancement/cache-optimization`

**Bad examples:**
- `fix` (too vague)
- `feature/FeatureName` (wrong case)
- `my-branch` (no type prefix)

## Commit Message Guidelines

We follow a structured commit message format for clarity and consistency.

### Format

```
<type>: <subject>

<body>

<footer>
```

### Type

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Build process, dependencies, or tooling changes

### Subject

- Use imperative mood ("Add feature" not "Added feature")
- Don't capitalize first letter
- No period at the end
- Max 50 characters

### Body

- Explain what and why, not how
- Wrap at 72 characters
- Use bullet points for multiple items

### Footer

- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`
- Co-authorship: `Co-Authored-By: Name <email>`

### Examples

```
feat: add PDF export functionality for chats

- Add export button to chat interface
- Create PDF generation endpoint
- Support chat history export with formatting
- Add Russian/English translations for export feature

Closes #42
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
fix: resolve streaming timeout in OpenRouter integration

The streaming response was timing out after 30 seconds for long
responses. Increased timeout to 5 minutes and added better error
handling.

Fixes #58
```

## Code Style Guidelines

### General Principles

- Write clear, self-documenting code
- Keep functions small and focused
- Use meaningful variable and function names
- Add comments for complex logic only

### TypeScript

- Use TypeScript for all new code
- Define proper types, avoid `any`
- Use interfaces for object shapes
- Export types from shared package when reusable

### React/Next.js

- Use functional components with hooks
- Keep components small and reusable
- Use proper React Server Components vs Client Components
- Follow Next.js App Router conventions

### File Organization

- One component per file
- Group related files in folders
- Use index files for exports
- Keep file names consistent with component names

### Naming Conventions

- **Components**: PascalCase (`ChatMessage.tsx`)
- **Functions**: camelCase (`formatMessage()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_MESSAGE_LENGTH`)
- **Types/Interfaces**: PascalCase (`MessageType`)

### Code Formatting

We use ESLint and Prettier for code formatting:

```bash
# Lint your code
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

## Pull Request Process

### Before Submitting

1. **Test your changes locally**
   - Run `pnpm dev` and test the functionality
   - Run `pnpm build` to ensure it builds successfully
   - Run `pnpm lint` to check for linting errors
   - Run `pnpm type-check` to verify TypeScript types

2. **Update documentation**
   - Update README.md if you added features
   - Add JSDoc comments for new functions
   - Update relevant docs in `/docs`

3. **Clean up your commits**
   - Squash "WIP" or "fix typo" commits
   - Ensure commit messages follow guidelines
   - Rebase on latest main

### Creating the Pull Request

1. **Use the PR template**
   - Fill out all sections
   - Be descriptive about what changed and why
   - Link related issues

2. **Add labels**
   - `feature`, `bugfix`, `enhancement`, etc.
   - `needs-review`, `work-in-progress`, etc.

3. **Request reviewers**
   - Request at least one reviewer
   - Tag relevant team members

### During Review

- Respond to feedback promptly
- Make requested changes in new commits
- Mark conversations as resolved when addressed
- Be open to suggestions and discussion

### After Approval

- Ensure CI checks pass
- Squash and merge (or follow project convention)
- Delete your branch after merging

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write tests for all new features
- Write tests for bug fixes
- Aim for good coverage, not just 100%
- Test edge cases and error scenarios

### Test Organization

- Place tests next to the code they test
- Use descriptive test names
- Group related tests in `describe` blocks
- Keep tests simple and focused

## Questions?

If you have questions about contributing, feel free to:

- Open an issue with the `question` label
- Reach out to the maintainers
- Check existing issues and PRs for similar questions

Thank you for contributing to AI Chat Platform!
