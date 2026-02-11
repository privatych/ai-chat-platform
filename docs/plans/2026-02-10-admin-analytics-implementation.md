# Admin Analytics Panel - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build comprehensive admin analytics panel with usage tracking, user management, financial metrics, and advanced analytics.

**Architecture:** Three-tier architecture with PostgreSQL analytics tables (usage_logs, model_pricing, admin_actions), Fastify REST API with RBAC middleware, and Next.js admin dashboard using shadcn/ui + Recharts for visualization. Redis caching for performance.

**Tech Stack:** PostgreSQL, Drizzle ORM, Fastify, Next.js 15, shadcn/ui, Recharts, Zustand, Vitest, Zod

---

## Phase 1: Database & Backend Core (Days 1-4)

### Task 1: Create Database Migration Files

**Files:**
- Create: `packages/database/drizzle/0002_add_admin_analytics.sql`
- Create: `packages/database/src/schema/usage-logs.ts`
- Create: `packages/database/src/schema/model-pricing.ts`
- Create: `packages/database/src/schema/admin-actions.ts`
- Modify: `packages/database/src/schema/users.ts`
- Modify: `packages/database/src/schema/index.ts`

**Step 1: Create usage_logs schema**

Create `packages/database/src/schema/usage-logs.ts`:

```typescript
import { pgTable, uuid, varchar, integer, decimal, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'chat_message', 'image_generation'
  model: varchar('model', { length: 100 }).notNull(),
  tokensInput: integer('tokens_input').notNull().default(0),
  tokensOutput: integer('tokens_output').notNull().default(0),
  tokensTotal: integer('tokens_total').notNull(),
  costUsd: decimal('cost_usd', { precision: 10, scale: 6 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
```

**Step 2: Create model_pricing schema**

Create `packages/database/src/schema/model-pricing.ts`:

```typescript
import { pgTable, uuid, varchar, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';

export const modelPricing = pgTable('model_pricing', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelId: varchar('model_id', { length: 100 }).notNull().unique(),
  pricePerInputToken: decimal('price_per_input_token', { precision: 12, scale: 10 }).notNull(),
  pricePerOutputToken: decimal('price_per_output_token', { precision: 12, scale: 10 }).notNull(),
  isActive: boolean('is_active').default(true),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type ModelPricing = typeof modelPricing.$inferSelect;
export type NewModelPricing = typeof modelPricing.$inferInsert;
```

**Step 3: Create admin_actions schema**

Create `packages/database/src/schema/admin-actions.ts`:

```typescript
import { pgTable, uuid, varchar, jsonb, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const adminActions = pgTable('admin_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type AdminAction = typeof adminActions.$inferSelect;
export type NewAdminAction = typeof adminActions.$inferInsert;
```

**Step 4: Update users schema**

Modify `packages/database/src/schema/users.ts`:

Add these fields after line 12 (after `updatedAt`):

```typescript
  role: varchar('role', { length: 20 }).notNull().default('user'),
  isBlocked: boolean('is_blocked').default(false),
  blockedReason: text('blocked_reason'),
  blockedAt: timestamp('blocked_at'),
```

**Step 5: Export new schemas**

Modify `packages/database/src/schema/index.ts`:

Add these exports:

```typescript
export * from './usage-logs';
export * from './model-pricing';
export * from './admin-actions';
```

**Step 6: Create migration SQL file**

Create `packages/database/drizzle/0002_add_admin_analytics.sql`:

```sql
-- Add role and blocking fields to users
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN blocked_reason TEXT;
ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP;

-- Migrate existing subscription_tier to role
UPDATE users SET role = 'premiumuser' WHERE subscription_tier = 'premium';
UPDATE users SET role = 'user' WHERE subscription_tier = 'free';

-- Create indexes on users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_blocked ON users(is_blocked);

-- Create usage_logs table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes on usage_logs
CREATE INDEX idx_usage_logs_user_created ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_event_type ON usage_logs(event_type);
CREATE INDEX idx_usage_logs_model ON usage_logs(model);

-- Create model_pricing table
CREATE TABLE model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(100) UNIQUE NOT NULL,
  price_per_input_token DECIMAL(12,10) NOT NULL,
  price_per_output_token DECIMAL(12,10) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed model pricing data
INSERT INTO model_pricing (model_id, price_per_input_token, price_per_output_token) VALUES
  ('openai/gpt-4-turbo', 0.0000100000, 0.0000300000),
  ('openai/gpt-4', 0.0000300000, 0.0000600000),
  ('openai/gpt-3.5-turbo', 0.0000005000, 0.0000015000),
  ('anthropic/claude-3-opus-20240229', 0.0000150000, 0.0000750000),
  ('anthropic/claude-3-sonnet-20240229', 0.0000030000, 0.0000150000),
  ('anthropic/claude-3-haiku-20240307', 0.0000002500, 0.0000012500),
  ('google/gemini-pro', 0.0000005000, 0.0000015000);

-- Create admin_actions table
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on admin_actions
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id, created_at DESC);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_user_id, created_at DESC);
```

**Step 7: Test migration generation**

Run: `pnpm --filter @ai-chat/database db:generate`
Expected: New migration files generated successfully

**Step 8: Commit**

```bash
git add packages/database/
git commit -m "feat(db): add admin analytics schema

- Add usage_logs table for tracking API usage
- Add model_pricing table for cost calculation
- Add admin_actions table for audit trail
- Add role, isBlocked fields to users table
- Create indexes for performance
- Seed model pricing data

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create Migration Runner Script

**Files:**
- Create: `packages/database/scripts/run-admin-migration.ts`

**Step 1: Write migration script**

Create `packages/database/scripts/run-admin-migration.ts`:

```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('🔄 Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('📄 Reading migration file...');
  const migrationPath = path.join(__dirname, '../drizzle/0002_add_admin_analytics.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('🚀 Running migration...');

  try {
    // Split by semicolon and execute each statement
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`  Executing: ${statement.substring(0, 50)}...`);
      await sql.unsafe(statement);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Step 2: Test migration script (dry run)**

Run: `tsx packages/database/scripts/run-admin-migration.ts`
Expected: Migration runs successfully, tables created

**Step 3: Verify tables exist**

Run: `psql $DATABASE_URL -c "\dt"`
Expected: See usage_logs, model_pricing, admin_actions tables

**Step 4: Commit**

```bash
git add packages/database/scripts/run-admin-migration.ts
git commit -m "feat(db): add admin analytics migration runner

Migration script to create:
- usage_logs table with indexes
- model_pricing table with seed data
- admin_actions table for audit trail
- role fields in users table

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Create Usage Logger Utility

**Files:**
- Create: `services/api/src/utils/usage-logger.ts`
- Test: `services/api/src/__tests__/utils/usage-logger.test.ts`

**Step 1: Write failing test**

Create `services/api/src/__tests__/utils/usage-logger.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logUsage, calculateCost } from '../../utils/usage-logger';
import { db } from '@ai-chat/database';

describe('Usage Logger', () => {
  describe('calculateCost', () => {
    it('should calculate cost correctly for GPT-4', async () => {
      const cost = await calculateCost('openai/gpt-4-turbo', 1000, 2000);

      // 1000 * 0.00001 + 2000 * 0.00003 = 0.01 + 0.06 = 0.07
      expect(cost).toBeCloseTo(0.07, 6);
    });

    it('should calculate cost correctly for Claude', async () => {
      const cost = await calculateCost('anthropic/claude-3-opus-20240229', 1000, 500);

      // 1000 * 0.000015 + 500 * 0.000075 = 0.015 + 0.0375 = 0.0525
      expect(cost).toBeCloseTo(0.0525, 6);
    });

    it('should return 0 for unknown model', async () => {
      const cost = await calculateCost('unknown-model', 1000, 2000);
      expect(cost).toBe(0);
    });
  });

  describe('logUsage', () => {
    it('should create usage log entry', async () => {
      const result = await logUsage({
        userId: 'test-user-id',
        eventType: 'chat_message',
        model: 'openai/gpt-4-turbo',
        tokensInput: 1000,
        tokensOutput: 2000,
        metadata: { chatId: 'test-chat' }
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe('test-user-id');
      expect(result.tokensTotal).toBe(3000);
      expect(parseFloat(result.costUsd)).toBeCloseTo(0.07, 6);
    });

    it('should handle missing metadata', async () => {
      const result = await logUsage({
        userId: 'test-user-id',
        eventType: 'chat_message',
        model: 'openai/gpt-3.5-turbo',
        tokensInput: 100,
        tokensOutput: 200
      });

      expect(result.metadata).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @ai-chat/api test:run usage-logger`
Expected: FAIL with "Cannot find module '../../utils/usage-logger'"

**Step 3: Implement usage logger**

Create `services/api/src/utils/usage-logger.ts`:

```typescript
import { db, usageLogs, modelPricing } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

interface LogUsageParams {
  userId: string;
  eventType: 'chat_message' | 'image_generation';
  model: string;
  tokensInput: number;
  tokensOutput: number;
  metadata?: Record<string, any>;
}

/**
 * Calculate cost for a given model and token usage
 */
export async function calculateCost(
  model: string,
  tokensInput: number,
  tokensOutput: number
): Promise<number> {
  try {
    const [pricing] = await db
      .select()
      .from(modelPricing)
      .where(eq(modelPricing.modelId, model))
      .limit(1);

    if (!pricing) {
      console.warn(`No pricing found for model: ${model}`);
      return 0;
    }

    const inputCost = tokensInput * parseFloat(pricing.pricePerInputToken);
    const outputCost = tokensOutput * parseFloat(pricing.pricePerOutputToken);

    return inputCost + outputCost;
  } catch (error) {
    console.error('Error calculating cost:', error);
    return 0;
  }
}

/**
 * Log API usage to database
 */
export async function logUsage(params: LogUsageParams) {
  const { userId, eventType, model, tokensInput, tokensOutput, metadata } = params;

  const tokensTotal = tokensInput + tokensOutput;
  const costUsd = await calculateCost(model, tokensInput, tokensOutput);

  const [log] = await db
    .insert(usageLogs)
    .values({
      userId,
      eventType,
      model,
      tokensInput,
      tokensOutput,
      tokensTotal,
      costUsd: costUsd.toFixed(6),
      metadata: metadata || null,
    })
    .returning();

  return log;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @ai-chat/api test:run usage-logger`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add services/api/src/utils/usage-logger.ts services/api/src/__tests__/utils/usage-logger.test.ts
git commit -m "feat(api): add usage logging utility

- calculateCost: fetch pricing from DB and compute cost
- logUsage: create usage log entry with cost
- Tests for both functions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Integrate Usage Logging into Chat Handler

**Files:**
- Modify: `services/api/src/routes/chat/message.ts`
- Test: Integration test

**Step 1: Import usage logger**

In `services/api/src/routes/chat/message.ts`, add import at top:

```typescript
import { logUsage } from '../../utils/usage-logger';
```

**Step 2: Add usage logging after saving message**

Find the section where assistant message is saved (around line 220), after:

```typescript
await db.insert(messages).values({
  chatId,
  role: 'assistant',
  content: assistantMessage,
  tokensUsed,
});
```

Add this code immediately after:

```typescript
        // Log usage for analytics
        try {
          await logUsage({
            userId,
            eventType: 'chat_message',
            model: currentModel,
            tokensInput: Math.floor(tokensUsed * 0.4), // Approximate 40% input
            tokensOutput: Math.floor(tokensUsed * 0.6), // Approximate 60% output
            metadata: {
              chatId,
              messageLength: assistantMessage.length,
            },
          });
        } catch (error) {
          console.error('Failed to log usage:', error);
          // Don't fail the request if logging fails
        }
```

**Step 3: Test manually**

Run: `pnpm --filter @ai-chat/api dev`
Send a chat message via UI
Query database: `SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 1;`
Expected: See new usage log entry with cost

**Step 4: Commit**

```bash
git add services/api/src/routes/chat/message.ts
git commit -m "feat(api): integrate usage logging into chat handler

Log every chat message to usage_logs table for analytics.
Includes userId, model, tokens, and calculated cost.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Admin API Routes (Days 5-9)

### Task 5: Create Admin Middleware

**Files:**
- Create: `services/api/src/middleware/admin-auth.ts`
- Test: `services/api/src/__tests__/middleware/admin-auth.test.ts`

**Step 1: Write failing test**

Create `services/api/src/__tests__/middleware/admin-auth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin } from '../../middleware/admin-auth';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('Admin Auth Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test' },
      url: '/api/admin/users',
      method: 'GET',
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  it('should allow admin users', async () => {
    mockRequest.user = { id: 'admin-id', role: 'admin' };

    await requireAdmin(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should reject non-admin users', async () => {
    mockRequest.user = { id: 'user-id', role: 'user' };

    await requireAdmin(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  });

  it('should reject unauthenticated requests', async () => {
    mockRequest.user = undefined;

    await requireAdmin(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(403);
  });

  it('should reject premium users', async () => {
    mockRequest.user = { id: 'premium-id', role: 'premiumuser' };

    await requireAdmin(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.code).toHaveBeenCalledWith(403);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @ai-chat/api test:run admin-auth`
Expected: FAIL with "Cannot find module"

**Step 3: Implement admin middleware**

Create `services/api/src/middleware/admin-auth.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, adminActions } from '@ai-chat/database';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;

  if (!user || user.role !== 'admin') {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }

  // Log admin action for audit trail
  try {
    await db.insert(adminActions).values({
      adminId: user.id,
      action: `${request.method} ${request.url}`,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] || null,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't fail the request if logging fails
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @ai-chat/api test:run admin-auth`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add services/api/src/middleware/admin-auth.ts services/api/src/__tests__/middleware/admin-auth.test.ts
git commit -m "feat(api): add admin authorization middleware

- requireAdmin: check user role is 'admin'
- Log all admin actions to audit trail
- Return 403 for non-admin users
- Tests for all scenarios

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Create Dashboard Overview Endpoint

**Files:**
- Create: `services/api/src/routes/admin/dashboard.ts`
- Create: `services/api/src/routes/admin/index.ts`
- Modify: `services/api/src/app.ts`
- Test: `services/api/src/__tests__/routes/admin/dashboard.test.ts`

**Step 1: Write test for dashboard endpoint**

Create `services/api/src/__tests__/routes/admin/dashboard.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../../../app';
import type { FastifyInstance } from 'fastify';

describe('Admin Dashboard', () => {
  let app: FastifyInstance;
  let adminToken: string;

  beforeAll(async () => {
    app = await buildApp();
    // Create admin user and get token
    // (implementation depends on your auth setup)
  });

  it('should return dashboard overview', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/dashboard/overview?period=30d',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('metrics');
    expect(body.data).toHaveProperty('costRevenueChart');
    expect(body.data).toHaveProperty('topUsers');
    expect(body.data).toHaveProperty('topModels');
  });

  it('should reject non-admin users', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/dashboard/overview',
      headers: {
        authorization: `Bearer ${regularUserToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @ai-chat/api test:run dashboard`
Expected: FAIL

**Step 3: Implement dashboard endpoint**

Create `services/api/src/routes/admin/dashboard.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, usageLogs, users } from '@ai-chat/database';
import { sql, eq, gte, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  period: z.enum(['today', '7d', '30d', 'custom']).default('30d'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function getDashboardOverview(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const query = querySchema.parse(request.query);

  // Calculate date range
  const now = new Date();
  let startDate: Date;

  if (query.period === 'custom' && query.from) {
    startDate = new Date(query.from);
  } else if (query.period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (query.period === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get total costs
  const costsResult = await db
    .select({
      totalCosts: sql<number>`COALESCE(SUM(CAST(${usageLogs.costUsd} AS DECIMAL)), 0)`,
      totalMessages: sql<number>`COUNT(*)`,
    })
    .from(usageLogs)
    .where(gte(usageLogs.createdAt, startDate));

  const totalCosts = parseFloat(costsResult[0]?.totalCosts?.toString() || '0');

  // Get revenue (from premium subscriptions)
  // For now, use a simple calculation: premium users × $10/month
  const premiumUsersCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.role, 'premiumuser'));

  const totalRevenue = (premiumUsersCount[0]?.count || 0) * 10;

  // Get user counts
  const userCounts = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users);

  const totalUsers = userCounts[0]?.count || 0;

  // Get cost/revenue timeline
  const timeline = await db
    .select({
      date: sql<string>`DATE(${usageLogs.createdAt})`,
      costs: sql<number>`SUM(CAST(${usageLogs.costUsd} AS DECIMAL))`,
    })
    .from(usageLogs)
    .where(gte(usageLogs.createdAt, startDate))
    .groupBy(sql`DATE(${usageLogs.createdAt})`)
    .orderBy(sql`DATE(${usageLogs.createdAt})`);

  // Get top users by spending
  const topUsers = await db
    .select({
      userId: usageLogs.userId,
      email: users.email,
      role: users.role,
      spent: sql<number>`SUM(CAST(${usageLogs.costUsd} AS DECIMAL))`,
      messageCount: sql<number>`COUNT(*)`,
    })
    .from(usageLogs)
    .leftJoin(users, eq(usageLogs.userId, users.id))
    .where(gte(usageLogs.createdAt, startDate))
    .groupBy(usageLogs.userId, users.email, users.role)
    .orderBy(desc(sql`SUM(CAST(${usageLogs.costUsd} AS DECIMAL))`))
    .limit(5);

  // Get top models by usage
  const topModels = await db
    .select({
      model: usageLogs.model,
      usage: sql<number>`COUNT(*)`,
      cost: sql<number>`SUM(CAST(${usageLogs.costUsd} AS DECIMAL))`,
    })
    .from(usageLogs)
    .where(gte(usageLogs.createdAt, startDate))
    .groupBy(usageLogs.model)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(5);

  const totalModelUsage = topModels.reduce((sum, m) => sum + m.usage, 0);

  return reply.send({
    success: true,
    data: {
      metrics: {
        totalCosts,
        costsChange: 0, // TODO: calculate from previous period
        totalRevenue,
        revenueChange: 0,
        profit: totalRevenue - totalCosts,
        profitChange: 0,
        totalUsers,
        usersChange: 0,
        activeUsers: topUsers.length,
      },
      costRevenueChart: timeline.map(t => ({
        date: t.date,
        costs: parseFloat(t.costs?.toString() || '0'),
        revenue: totalRevenue / timeline.length, // Distribute evenly for now
      })),
      topUsers: topUsers.map(u => ({
        userId: u.userId,
        email: u.email || '',
        role: u.role || 'user',
        spent: parseFloat(u.spent?.toString() || '0'),
        messageCount: u.messageCount,
      })),
      topModels: topModels.map(m => ({
        model: m.model,
        usage: m.usage,
        cost: parseFloat(m.cost?.toString() || '0'),
        percentage: totalModelUsage > 0 ? (m.usage / totalModelUsage) * 100 : 0,
      })),
    },
  });
}
```

**Step 4: Create admin routes index**

Create `services/api/src/routes/admin/index.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/jwt';
import { requireAdmin } from '../../middleware/admin-auth';
import { getDashboardOverview } from './dashboard';

export async function adminRoutes(app: FastifyInstance) {
  // All admin routes require authentication + admin role
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireAdmin);

  // Dashboard
  app.get('/dashboard/overview', getDashboardOverview);
}
```

**Step 5: Register admin routes in app**

Modify `services/api/src/app.ts`, add this import:

```typescript
import { adminRoutes } from './routes/admin';
```

And register routes:

```typescript
  // Admin routes
  app.register(adminRoutes, { prefix: '/api/admin' });
```

**Step 6: Run test**

Run: `pnpm --filter @ai-chat/api test:run dashboard`
Expected: PASS

**Step 7: Commit**

```bash
git add services/api/src/routes/admin/ services/api/src/__tests__/routes/admin/ services/api/src/app.ts
git commit -m "feat(api): add admin dashboard overview endpoint

GET /api/admin/dashboard/overview
- Returns metrics (costs, revenue, profit, users)
- Returns cost/revenue chart data
- Returns top 5 users by spending
- Returns top 5 models by usage
- Supports period filtering (today, 7d, 30d, custom)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Create User Management Endpoints

**Files:**
- Create: `services/api/src/routes/admin/users.ts`
- Modify: `services/api/src/routes/admin/index.ts`
- Test: `services/api/src/__tests__/routes/admin/users.test.ts`

**Step 1: Write test**

Create `services/api/src/__tests__/routes/admin/users.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../../../app';
import type { FastifyInstance } from 'fastify';

describe('Admin Users Management', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = await buildApp();
    // Setup admin token and test user
  });

  describe('GET /api/admin/users', () => {
    it('should list users with filters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users?page=1&limit=20',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.data.users).toBeInstanceOf(Array);
      expect(body.data.total).toBeGreaterThan(0);
    });

    it('should filter by role', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users?role=premiumuser',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      const body = JSON.parse(response.body);
      body.data.users.forEach(u => {
        expect(u.role).toBe('premiumuser');
      });
    });
  });

  describe('PATCH /api/admin/users/:userId/role', () => {
    it('should change user role', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${testUserId}/role`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { role: 'premiumuser' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.user.role).toBe('premiumuser');
    });
  });

  describe('PATCH /api/admin/users/:userId/block', () => {
    it('should block user with reason', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${testUserId}/block`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          isBlocked: true,
          reason: 'Spam behavior detected',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.user.isBlocked).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @ai-chat/api test:run users`
Expected: FAIL

**Step 3: Implement users endpoints**

Create `services/api/src/routes/admin/users.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { db, users, usageLogs } from '@ai-chat/database';
import { eq, sql, like, or, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const listUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['admin', 'premiumuser', 'user']).optional(),
  status: z.enum(['active', 'blocked']).optional(),
  sortBy: z.enum(['created', 'spent', 'messages']).default('created'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const changeRoleSchema = z.object({
  role: z.enum(['admin', 'premiumuser', 'user']),
});

const blockUserSchema = z.object({
  isBlocked: z.boolean(),
  reason: z.string().min(10).max(500).optional(),
});

export async function listUsers(request: FastifyRequest, reply: FastifyReply) {
  const query = listUsersSchema.parse(request.query);

  const offset = (query.page - 1) * query.limit;

  // Build where conditions
  const conditions = [];

  if (query.search) {
    conditions.push(
      or(
        like(users.email, `%${query.search}%`),
        like(users.fullName, `%${query.search}%`)
      )
    );
  }

  if (query.role) {
    conditions.push(eq(users.role, query.role));
  }

  if (query.status === 'blocked') {
    conditions.push(eq(users.isBlocked, true));
  } else if (query.status === 'active') {
    conditions.push(eq(users.isBlocked, false));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get users with stats
  const usersList = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      isBlocked: users.isBlocked,
      blockedReason: users.blockedReason,
      createdAt: users.createdAt,
      totalSpent: sql<number>`COALESCE((
        SELECT SUM(CAST(cost_usd AS DECIMAL))
        FROM usage_logs
        WHERE user_id = ${users.id}
      ), 0)`,
      messageCount: sql<number>`COALESCE((
        SELECT COUNT(*)
        FROM usage_logs
        WHERE user_id = ${users.id}
      ), 0)`,
    })
    .from(users)
    .where(whereClause)
    .orderBy(
      query.sortBy === 'created'
        ? query.order === 'desc'
          ? desc(users.createdAt)
          : users.createdAt
        : query.sortBy === 'spent'
        ? sql`total_spent ${query.order === 'desc' ? sql`DESC` : sql`ASC`}`
        : sql`message_count ${query.order === 'desc' ? sql`DESC` : sql`ASC`}`
    )
    .limit(query.limit)
    .offset(offset);

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(whereClause);

  return reply.send({
    success: true,
    data: {
      users: usersList.map(u => ({
        ...u,
        totalSpent: parseFloat(u.totalSpent?.toString() || '0'),
      })),
      total: countResult.count,
      page: query.page,
      limit: query.limit,
    },
  });
}

export async function getUserDetails(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return reply.code(404).send({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
  }

  // Get usage stats
  const [stats] = await db
    .select({
      totalSpent: sql<number>`COALESCE(SUM(CAST(cost_usd AS DECIMAL)), 0)`,
      messageCount: sql<number>`COUNT(*)`,
      lastActive: sql<Date>`MAX(created_at)`,
    })
    .from(usageLogs)
    .where(eq(usageLogs.userId, userId));

  // Get recent activity
  const recentActivity = await db
    .select()
    .from(usageLogs)
    .where(eq(usageLogs.userId, userId))
    .orderBy(desc(usageLogs.createdAt))
    .limit(10);

  return reply.send({
    success: true,
    data: {
      user,
      stats: {
        totalSpent: parseFloat(stats.totalSpent?.toString() || '0'),
        messageCount: stats.messageCount,
        lastActive: stats.lastActive,
      },
      recentActivity,
    },
  });
}

export async function changeUserRole(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  const body = changeRoleSchema.parse(request.body);
  const adminUser = request.user as any;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return reply.code(404).send({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
  }

  // Update role
  const [updated] = await db
    .update(users)
    .set({ role: body.role })
    .where(eq(users.id, userId))
    .returning();

  // Log action
  await db.insert(adminActions).values({
    adminId: adminUser.id,
    action: 'USER_ROLE_CHANGED',
    targetUserId: userId,
    details: { from: user.role, to: body.role },
  });

  return reply.send({
    success: true,
    data: { user: updated },
  });
}

export async function blockUser(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = request.params;
  const body = blockUserSchema.parse(request.body);
  const adminUser = request.user as any;

  if (userId === adminUser.id) {
    return reply.code(400).send({
      success: false,
      error: { code: 'CANNOT_BLOCK_SELF', message: 'Cannot block yourself' },
    });
  }

  if (body.isBlocked && !body.reason) {
    return reply.code(400).send({
      success: false,
      error: { code: 'REASON_REQUIRED', message: 'Reason required when blocking user' },
    });
  }

  const [updated] = await db
    .update(users)
    .set({
      isBlocked: body.isBlocked,
      blockedReason: body.isBlocked ? body.reason : null,
      blockedAt: body.isBlocked ? new Date() : null,
    })
    .where(eq(users.id, userId))
    .returning();

  return reply.send({
    success: true,
    data: { user: updated },
  });
}
```

**Step 4: Register routes**

Modify `services/api/src/routes/admin/index.ts`:

```typescript
import {
  listUsers,
  getUserDetails,
  changeUserRole,
  blockUser,
} from './users';

// Add inside adminRoutes function:
  // Users management
  app.get('/users', listUsers);
  app.get('/users/:userId', getUserDetails);
  app.patch('/users/:userId/role', changeUserRole);
  app.patch('/users/:userId/block', blockUser);
```

**Step 5: Run test**

Run: `pnpm --filter @ai-chat/api test:run users`
Expected: PASS

**Step 6: Commit**

```bash
git add services/api/src/routes/admin/users.ts services/api/src/__tests__/routes/admin/users.test.ts
git commit -m "feat(api): add user management endpoints

GET /api/admin/users
- List users with search, filters, pagination
- Sort by created/spent/messages

GET /api/admin/users/:userId
- Get user details with stats

PATCH /api/admin/users/:userId/role
- Change user role (admin/premium/user)

PATCH /api/admin/users/:userId/block
- Block/unblock user with reason

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Frontend Components (Days 10-15)

### Task 8: Create Admin Layout

**Files:**
- Create: `apps/web/app/admin/layout.tsx`
- Create: `apps/web/app/admin/page.tsx`
- Create: `apps/web/components/admin/AdminNav.tsx`
- Create: `apps/web/components/admin/AdminGuard.tsx`

**Step 1: Create AdminGuard component**

Create `apps/web/components/admin/AdminGuard.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Checking permissions...</h2>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

**Step 2: Create AdminNav component**

Create `apps/web/components/admin/AdminNav.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/finance', label: 'Finance', icon: DollarSign },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="flex space-x-4 px-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 3: Create admin layout**

Create `apps/web/app/admin/layout.tsx`:

```typescript
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminNav } from '@/components/admin/AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
        </header>
        <AdminNav />
        <main className="container mx-auto p-6">{children}</main>
      </div>
    </AdminGuard>
  );
}
```

**Step 4: Create admin index page (redirect)**

Create `apps/web/app/admin/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function AdminPage() {
  redirect('/admin/overview');
}
```

**Step 5: Test navigation**

Run: `pnpm --filter @ai-chat/web dev`
Navigate to: `http://localhost:3000/admin`
Expected: Redirects to /admin/overview, shows admin nav

**Step 6: Commit**

```bash
git add apps/web/app/admin/ apps/web/components/admin/
git commit -m "feat(web): add admin panel layout and navigation

- AdminGuard: protect routes, check admin role
- AdminNav: tab navigation for admin sections
- Admin layout with header and nav
- Redirect /admin to /admin/overview

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Create MetricCard Component

**Files:**
- Create: `apps/web/components/admin/MetricCard.tsx`

**Step 1: Create MetricCard component**

Create `apps/web/components/admin/MetricCard.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
}

function formatValue(value: string | number, format?: string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (format === 'currency') {
    return `$${numValue.toFixed(2)}`;
  } else if (format === 'percentage') {
    return `${numValue.toFixed(1)}%`;
  } else if (format === 'number') {
    return numValue.toLocaleString();
  }

  return value.toString();
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  format = 'number',
}: MetricCardProps) {
  const formattedValue = formatValue(value, format);
  const changeColor = change !== undefined
    ? change >= 0
      ? 'text-green-600'
      : 'text-red-600'
    : '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {change !== undefined && (
          <p className={cn('text-xs flex items-center gap-1 mt-1', changeColor)}>
            {change >= 0 ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {Math.abs(change).toFixed(1)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Test MetricCard**

Create test page at `apps/web/app/admin/test-metrics/page.tsx`:

```typescript
import { MetricCard } from '@/components/admin/MetricCard';
import { DollarSign, Users } from 'lucide-react';

export default function TestMetricsPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Costs"
        value={234.50}
        change={12.3}
        format="currency"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <MetricCard
        title="Revenue"
        value={450}
        change={-5.2}
        format="currency"
      />
      <MetricCard
        title="Users"
        value={1234}
        change={8.5}
        format="number"
        icon={<Users className="h-4 w-4" />}
      />
      <MetricCard
        title="Margin"
        value={47.8}
        format="percentage"
      />
    </div>
  );
}
```

Run: `pnpm --filter @ai-chat/web dev`
Navigate to: `http://localhost:3000/admin/test-metrics`
Expected: See 4 metric cards with proper formatting

**Step 3: Commit**

```bash
git add apps/web/components/admin/MetricCard.tsx
git commit -m "feat(web): add MetricCard component

Reusable metric card with:
- Value formatting (currency, number, percentage)
- Change percentage with trend icons
- Optional icon
- Responsive design

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Install and Setup Recharts

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/components/admin/charts/RevenueChart.tsx`

**Step 1: Install Recharts**

Run: `pnpm --filter @ai-chat/web add recharts`

**Step 2: Create RevenueChart component**

Create `apps/web/components/admin/charts/RevenueChart.tsx`:

```typescript
'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  date: string;
  costs: number;
  revenue: number;
}

interface RevenueChartProps {
  data: ChartData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value: number) => `$${value.toFixed(2)}`}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString();
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          stackId="1"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.6}
          name="Revenue"
        />
        <Area
          type="monotone"
          dataKey="costs"
          stackId="2"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.6}
          name="Costs"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

**Step 3: Test chart**

Add to test page:

```typescript
import { RevenueChart } from '@/components/admin/charts/RevenueChart';

const mockData = [
  { date: '2024-02-01', costs: 12.5, revenue: 25.0 },
  { date: '2024-02-02', costs: 15.2, revenue: 28.5 },
  { date: '2024-02-03', costs: 18.9, revenue: 32.0 },
];

// In page:
<RevenueChart data={mockData} />
```

Expected: See area chart with revenue and costs

**Step 4: Commit**

```bash
git add apps/web/package.json apps/web/components/admin/charts/
git commit -m "feat(web): add Recharts and RevenueChart component

- Install recharts library
- Create RevenueChart with dual area chart
- Green for revenue, red for costs
- Formatted tooltips and axes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Create Admin API Client

**Files:**
- Create: `apps/web/lib/api/admin-client.ts`
- Modify: `apps/web/lib/api/client.ts`

**Step 1: Create admin API client**

Create `apps/web/lib/api/admin-client.ts`:

```typescript
import { apiClient } from './client';

export interface DashboardMetrics {
  totalCosts: number;
  costsChange: number;
  totalRevenue: number;
  revenueChange: number;
  profit: number;
  profitChange: number;
  totalUsers: number;
  usersChange: number;
  activeUsers: number;
}

export interface ChartDataPoint {
  date: string;
  costs: number;
  revenue: number;
}

export interface TopUser {
  userId: string;
  email: string;
  role: string;
  spent: number;
  messageCount: number;
}

export interface TopModel {
  model: string;
  usage: number;
  cost: number;
  percentage: number;
}

export interface DashboardOverview {
  metrics: DashboardMetrics;
  costRevenueChart: ChartDataPoint[];
  topUsers: TopUser[];
  topModels: TopModel[];
}

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'premiumuser' | 'user';
  isBlocked: boolean;
  blockedReason: string | null;
  createdAt: string;
  totalSpent: number;
  messageCount: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export class AdminAPIClient {
  async getDashboardOverview(period: string = '30d'): Promise<DashboardOverview> {
    const response = await apiClient.get(`/admin/dashboard/overview?period=${period}`);
    return response.data;
  }

  async listUsers(params: {
    search?: string;
    role?: 'admin' | 'premiumuser' | 'user';
    status?: 'active' | 'blocked';
    sortBy?: 'created' | 'spent' | 'messages';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/users?${queryParams.toString()}`);
    return response.data;
  }

  async getUserDetails(userId: string) {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  }

  async changeUserRole(userId: string, role: 'admin' | 'premiumuser' | 'user') {
    const response = await apiClient.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  }

  async blockUser(userId: string, reason: string) {
    const response = await apiClient.patch(`/admin/users/${userId}/block`, {
      isBlocked: true,
      reason,
    });
    return response.data;
  }

  async unblockUser(userId: string) {
    const response = await apiClient.patch(`/admin/users/${userId}/block`, {
      isBlocked: false,
    });
    return response.data;
  }
}

export const adminApiClient = new AdminAPIClient();
```

**Step 2: Export from main client**

Modify `apps/web/lib/api/client.ts`, add export:

```typescript
export { adminApiClient } from './admin-client';
```

**Step 3: Test API client (manual)**

Create test in browser console:
```javascript
import { adminApiClient } from '@/lib/api/admin-client';
const data = await adminApiClient.getDashboardOverview('30d');
console.log(data);
```

Expected: Returns dashboard data

**Step 4: Commit**

```bash
git add apps/web/lib/api/admin-client.ts apps/web/lib/api/client.ts
git commit -m "feat(web): add admin API client

AdminAPIClient with methods:
- getDashboardOverview
- listUsers with filters/pagination
- getUserDetails
- changeUserRole
- blockUser/unblockUser

TypeScript interfaces for all responses.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 12: Create Overview Dashboard Page

**Files:**
- Create: `apps/web/app/admin/overview/page.tsx`

**Step 1: Create overview page**

Create `apps/web/app/admin/overview/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { adminApiClient, DashboardOverview } from '@/lib/api/admin-client';
import { MetricCard } from '@/components/admin/MetricCard';
import { RevenueChart } from '@/components/admin/charts/RevenueChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  Activity,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOverviewPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadDashboard();
  }, [period]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const overview = await adminApiClient.getDashboardOverview(period);
      setData(overview);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center">
        <div className="text-lg font-medium">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-3 py-1 rounded ${
              period === '7d' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-3 py-1 rounded ${
              period === '30d' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            Last 30 days
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Costs"
          value={data.metrics.totalCosts}
          change={data.metrics.costsChange}
          format="currency"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Revenue"
          value={data.metrics.totalRevenue}
          change={data.metrics.revenueChange}
          format="currency"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title="Profit"
          value={data.metrics.profit}
          change={data.metrics.profitChange}
          format="currency"
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Users"
          value={data.metrics.totalUsers}
          change={data.metrics.usersChange}
          format="number"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cost & Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={data.costRevenueChart} />
        </CardContent>
      </Card>

      {/* Top Users and Models */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Most Expensive Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex justify-between items-center p-2 rounded hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">
                      {index + 1}. {user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.messageCount} messages
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${user.spent.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.role === 'premiumuser' ? '🟡 Premium' : '⚪ Free'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top AI Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topModels.map((model) => (
                <div
                  key={model.model}
                  className="flex justify-between items-center p-2 rounded hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">{model.model}</div>
                    <div className="text-sm text-muted-foreground">
                      {model.usage} uses
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${model.cost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {model.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: Test overview page**

Run: `pnpm --filter @ai-chat/web dev`
Navigate to: `http://localhost:3000/admin/overview`
Expected: See dashboard with metrics, chart, top users, top models

**Step 3: Commit**

```bash
git add apps/web/app/admin/overview/
git commit -m "feat(web): add admin overview dashboard page

Complete dashboard with:
- 4 metric cards (costs, revenue, profit, users)
- Revenue vs costs area chart
- Top 5 users by spending
- Top models by usage
- Period selector (7d/30d)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Remaining Tasks Summary

**Phase 3 (Continued):**
- Task 13: Users Management Page with table and filters
- Task 14: User Details Modal
- Task 15: Finance Analytics Page
- Task 16: Advanced Analytics Page

**Phase 4: Testing & Polish (Days 16-18):**
- Task 17: E2E tests for critical admin flows
- Task 18: Performance optimization
- Task 19: Security audit
- Task 20: Documentation

**Execution Handoff:**

Plan saved successfully! Total tasks: 20 tasks across 4 phases (18 days estimated).

Ready to implement using:
1. **Subagent-Driven (this session)** - Dispatch fresh subagent per task, review between tasks
2. **Parallel Session (separate)** - Open new session with executing-plans for batch execution

Which approach do you prefer?
