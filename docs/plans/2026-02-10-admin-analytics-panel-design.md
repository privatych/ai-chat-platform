# Admin Analytics Panel - Design Document

**Date:** 2026-02-10
**Status:** Ready for Implementation
**Priority:** High - Phase 1 of Admin Features

---

## Executive Summary

Comprehensive admin analytics panel for monitoring platform usage, costs, revenue, and user management. Provides detailed insights into API costs, user behavior, and financial metrics with modern UI built on shadcn/ui + Recharts.

**Key Features:**
- Real-time dashboard with financial metrics (costs, revenue, profit, ARPU)
- User management (search, filter, role changes, blocking)
- Advanced analytics (DAU/WAU/MAU, retention, conversion)
- Export to CSV
- Audit trail for admin actions
- Role-based access control (admin, premiumuser, user)

**Tech Stack:**
- Backend: Fastify + PostgreSQL + Drizzle ORM
- Frontend: Next.js 15 + shadcn/ui + Recharts
- Caching: Redis (optional but recommended)
- Testing: Vitest + Playwright

---

## Table of Contents

1. [Architecture & Data Model](#1-architecture--data-model)
2. [UI/UX Design](#2-uiux-design)
3. [API Endpoints](#3-api-endpoints)
4. [Security & Error Handling](#4-security--error-handling)
5. [Frontend Components](#5-frontend-components)
6. [Implementation Plan](#6-implementation-plan)
7. [Future Enhancements](#7-future-enhancements)

---

## 1. Architecture & Data Model

### 1.1 Database Schema

#### New Tables

**usage_logs** - Core analytics table
```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'chat_message', 'image_generation', 'file_upload'
  model VARCHAR(100) NOT NULL,     -- 'gpt-4-turbo', 'claude-3-opus', etc.
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL, -- Precise cost in USD
  metadata JSONB,                   -- Additional data (chatId, projectId, etc.)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_usage_logs_user_created ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_event_type ON usage_logs(event_type);
CREATE INDEX idx_usage_logs_model ON usage_logs(model);
```

**model_pricing** - Dynamic model pricing
```sql
CREATE TABLE model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(100) UNIQUE NOT NULL,
  price_per_input_token DECIMAL(12,10) NOT NULL,
  price_per_output_token DECIMAL(12,10) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed data examples
INSERT INTO model_pricing (model_id, price_per_input_token, price_per_output_token) VALUES
  ('gpt-4-turbo', 0.00001, 0.00003),
  ('gpt-4', 0.00003, 0.00006),
  ('claude-3-opus', 0.000015, 0.000075),
  ('claude-3-sonnet', 0.000003, 0.000015),
  ('gemini-pro', 0.0000005, 0.0000015);
```

**admin_actions** - Audit trail
```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,    -- 'USER_ROLE_CHANGED', 'USER_BLOCKED', etc.
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB,                    -- { from: 'user', to: 'premiumuser' }
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id, created_at DESC);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_user_id, created_at DESC);
```

#### Modified Tables

**users** - Add role and blocking fields
```sql
ALTER TABLE users
  ADD COLUMN role VARCHAR(20) DEFAULT 'user', -- 'admin', 'premiumuser', 'user'
  ADD COLUMN is_blocked BOOLEAN DEFAULT false,
  ADD COLUMN blocked_reason TEXT,
  ADD COLUMN blocked_at TIMESTAMP;

-- Migrate existing subscriptionTier to role
UPDATE users SET role = 'premiumuser' WHERE subscription_tier = 'premium';
UPDATE users SET role = 'user' WHERE subscription_tier = 'free';

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_blocked ON users(is_blocked);
```

### 1.2 Data Flow

**Usage Logging Flow:**
```
User sends chat message
       ↓
POST /api/chat/:chatId/message
       ↓
Call OpenRouter API → receive response with usage
       ↓
Calculate cost = (inputTokens × inputPrice) + (outputTokens × outputPrice)
       ↓
Parallel operations:
  ├─→ Save message to messages table
  └─→ Log usage to usage_logs table
       ↓
Return response to user
```

**Analytics Query Flow:**
```
Admin requests dashboard
       ↓
Check Redis cache (key: admin:overview:30d, TTL: 5min)
       ↓
Cache HIT → return cached data
       ↓
Cache MISS → Query database:
  ├─→ Aggregate usage_logs by date/user/model
  ├─→ JOIN with users for role grouping
  ├─→ Calculate metrics (costs, revenue, profit, ARPU)
  └─→ Cache result in Redis
       ↓
Return JSON response
```

### 1.3 Caching Strategy

**Redis Cache Keys:**
```typescript
cache:admin:overview:{period}           TTL: 5 minutes
cache:admin:finance:{period}            TTL: 10 minutes
cache:admin:analytics:activity          TTL: 5 minutes
cache:model:pricing                     TTL: 1 hour
cache:user:stats:{userId}               TTL: 2 minutes
```

**Invalidation Triggers:**
- New message → invalidate overview, user stats
- Role change → invalidate user stats, finance
- User blocked → invalidate user stats
- Model pricing updated → invalidate all finance caches

---

## 2. UI/UX Design

### 2.1 Layout Structure

**Admin Panel Navigation:**
```
┌─────────────────────────────────────────────────────┐
│ [Logo] AI Chat Platform     [User Menu] [Logout]   │
├─────────────────────────────────────────────────────┤
│ 📊 Overview │ 👥 Users │ 💰 Finance │ 📈 Analytics │
└─────────────────────────────────────────────────────┘
```

### 2.2 Overview Tab

**Main Dashboard:**
```
┌────────────────────────────────────────────────────┐
│ Dashboard Overview                                 │
│ Period: [Last 30 days ▼]                           │
├────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│ │ 💵 Costs │ │ 💎 Revenue│ │ 📊 Profit│ │ 👥 Users││
│ │ $234.50  │ │  $450.00 │ │ $215.50  │ │  1,234 ││
│ │ +12.3%   │ │  +8.5%   │ │ +15.2%   │ │  +45   ││
│ └──────────┘ └──────────┘ └──────────┘ └────────┘│
├────────────────────────────────────────────────────┤
│ 📈 Cost & Revenue Over Time                        │
│ [Area Chart: Revenue (green) vs Costs (red)]      │
├────────────────────────────────────────────────────┤
│ Top 5 Expensive Users    │  Top AI Models          │
│ user@email.com   $45.20  │  GPT-4 Turbo    45%    │
│ another@test.com $38.10  │  Claude 3 Opus  30%    │
│ test@mail.com    $25.50  │  Gemini Pro     15%    │
└────────────────────────────────────────────────────┘
```

**Components:**
- **MetricCard**: Shows value, percentage change, trend icon
- **AreaChart** (Recharts): Dual area chart for costs/revenue
- **TopUsersTable**: Sortable table with user stats
- **ModelDistributionChart**: Donut chart showing model usage

### 2.3 Users Tab

**Users Management:**
```
┌──────────────────────────────────────────────────┐
│ 👥 Users Management                              │
├──────────────────────────────────────────────────┤
│ 🔍 [Search]  Role:[All▼] Status:[Active▼]       │
│ Sort: [Created▼] [Export CSV]                    │
├──────────────────────────────────────────────────┤
│ Email          │Role    │Spent  │Messages│Actions│
│ user@email.com │🟡Premium│$125.40│1,234   │[•••] │
│ test@test.com  │⚪User   │$5.20  │89      │[•••] │
│ blocked@x.com  │🔴Blocked│$0.00  │0       │[•••] │
└──────────────────────────────────────────────────┘
```

**Actions Menu:**
- View Details → Full user modal with stats
- View Usage History → Detailed usage log
- Change Role → Select new role (admin/premium/user)
- Block/Unblock User → With reason input

**User Details Modal:**
```
┌──────────────────────────────────────────┐
│ User Details                      [×]    │
├──────────────────────────────────────────┤
│ 📧 Email: user@example.com               │
│ 👤 Name: John Doe                        │
│ 🎭 Role: Premium User                    │
│ 📅 Registered: 2024-01-15                │
│ 💰 Total Spent: $125.40                  │
│ 💬 Messages: 1,234                       │
│ 🔥 Last Active: 2 hours ago              │
├──────────────────────────────────────────┤
│ Usage Last 30 Days                       │
│ [Mini Bar Chart]                         │
├──────────────────────────────────────────┤
│ [Change Role ▼] [Block] [Full History]  │
└──────────────────────────────────────────┘
```

### 2.4 Finance Tab

**Financial Analytics:**
```
┌──────────────────────────────────────────────────┐
│ 💰 Financial Analytics                           │
│ Period: [Last 30 days ▼]  Group: [Day▼]         │
├──────────────────────────────────────────────────┤
│ 💸 Costs    💵 Revenue   📊 Margin   💎 ARPU    │
│  $1,234      $2,450      49.6%       $1.99      │
├──────────────────────────────────────────────────┤
│ 📈 Revenue vs Costs (Stacked Area)               │
│ [Chart showing profit margin over time]         │
├──────────────────────────────────────────────────┤
│ Cost by User Type  │  Model Usage               │
│ 🟡 Premium: 72%    │  GPT-4 Turbo    $567       │
│ ⚪ Free: 28%       │  Claude 3 Opus  $345       │
│ [Donut Chart]      │  [Bar Chart]               │
└──────────────────────────────────────────────────┘
```

### 2.5 Analytics Tab

**Advanced Analytics:**
```
┌──────────────────────────────────────────────────┐
│ 📈 Advanced Analytics                            │
│ Period: [Last 30 days ▼]                         │
├──────────────────────────────────────────────────┤
│ DAU: 245    WAU: 892    MAU: 2,340              │
│ +12.3%      +8.5%       +15.2%                   │
├──────────────────────────────────────────────────┤
│ 📊 Messages Per Day                              │
│ [Line Chart with trend line]                     │
├──────────────────────────────────────────────────┤
│ Retention         │  Conversion Funnel           │
│ Day 1:  100%      │  Registered:     1000        │
│ Day 7:  45%       │  Active 1st week: 450        │
│ Day 30: 23%       │  Premium:         45  (4.5%) │
│ [Heatmap]         │  [Funnel Chart]              │
└──────────────────────────────────────────────────┘
```

### 2.6 Design System

**Colors:**
- Costs: `red-500` (#ef4444)
- Revenue: `green-500` (#22c55e)
- Profit: `blue-500` (#3b82f6)
- Premium: `amber-500` (#f59e0b)
- Admin: `purple-500` (#a855f7)
- User: `gray-400` (#9ca3af)

**Typography:**
- Headings: font-bold, text-2xl/3xl
- Metrics: font-bold, text-3xl
- Labels: font-medium, text-sm
- Body: font-normal, text-base

**Spacing:**
- Page padding: p-6
- Card spacing: gap-4
- Grid gaps: gap-4 md:gap-6

---

## 3. API Endpoints

### 3.1 Admin Authentication

```typescript
GET /api/admin/auth/verify
  Headers: { Authorization: 'Bearer <token>' }
  Response: {
    success: true,
    user: { id, email, role: 'admin' }
  }
```

### 3.2 Dashboard

```typescript
GET /api/admin/dashboard/overview
  Query: {
    period: 'today' | '7d' | '30d' | 'custom',
    from?: string,  // ISO date
    to?: string     // ISO date
  }
  Response: {
    success: true,
    data: {
      metrics: {
        totalCosts: number,
        costsChange: number,
        totalRevenue: number,
        revenueChange: number,
        profit: number,
        profitChange: number,
        totalUsers: number,
        usersChange: number,
        activeUsers: number
      },
      costRevenueChart: Array<{
        date: string,
        costs: number,
        revenue: number
      }>,
      topUsers: Array<{
        userId: string,
        email: string,
        role: string,
        spent: number,
        messageCount: number
      }>,
      topModels: Array<{
        model: string,
        usage: number,
        cost: number,
        percentage: number
      }>
    }
  }
```

### 3.3 User Management

```typescript
GET /api/admin/users
  Query: {
    search?: string,
    role?: 'admin' | 'premiumuser' | 'user',
    status?: 'active' | 'blocked',
    sortBy?: 'created' | 'spent' | 'messages',
    order?: 'asc' | 'desc',
    page: number,
    limit: number
  }
  Response: {
    success: true,
    data: {
      users: Array<User & { stats }>,
      total: number,
      page: number,
      limit: number
    }
  }

GET /api/admin/users/:userId
  Response: {
    success: true,
    data: {
      user: User,
      stats: {
        totalSpent: number,
        messageCount: number,
        avgCostPerMessage: number,
        lastActive: Date
      },
      subscription: Subscription | null,
      recentActivity: Array<UsageLog>
    }
  }

GET /api/admin/users/:userId/usage-history
  Query: { period: '7d' | '30d' | '90d' }
  Response: {
    success: true,
    data: Array<{
      date: string,
      model: string,
      tokens: number,
      cost: number
    }>
  }

PATCH /api/admin/users/:userId/role
  Body: { role: 'admin' | 'premiumuser' | 'user' }
  Response: { success: true, data: { user: User } }

PATCH /api/admin/users/:userId/block
  Body: {
    isBlocked: boolean,
    reason?: string  // Required if blocking
  }
  Response: { success: true, data: { user: User } }

GET /api/admin/users/export
  Query: { ...same filters as GET /users }
  Response: CSV file download
```

### 3.4 Finance Analytics

```typescript
GET /api/admin/finance/summary
  Query: {
    period: 'today' | '7d' | '30d' | 'custom',
    groupBy: 'day' | 'week' | 'month',
    from?: string,
    to?: string
  }
  Response: {
    success: true,
    data: {
      costs: number,
      revenue: number,
      margin: number,
      arpu: number,
      breakdown: {
        byUserType: Array<{
          role: string,
          cost: number,
          percentage: number
        }>,
        byModel: Array<{
          model: string,
          cost: number,
          usage: number
        }>
      },
      timeline: Array<{
        date: string,
        costs: number,
        revenue: number
      }>
    }
  }
```

### 3.5 Advanced Analytics

```typescript
GET /api/admin/analytics/activity
  Query: { period: '7d' | '30d' | '90d' }
  Response: {
    success: true,
    data: {
      dau: number,
      wau: number,
      mau: number,
      messagesPerDay: Array<{ date: string, count: number }>,
      retention: {
        day1: number,
        day7: number,
        day30: number
      },
      conversion: {
        registered: number,
        activeWeek1: number,
        activeMonth1: number,
        premium: number,
        conversionRate: number
      }
    }
  }

GET /api/admin/analytics/models
  Response: {
    success: true,
    data: {
      modelDistribution: Array<{
        model: string,
        count: number,
        percentage: number
      }>,
      avgCostPerMessage: number,
      peakHours: Array<{
        hour: number,
        count: number
      }>
    }
  }
```

### 3.6 Usage Logging (Internal)

```typescript
POST /api/usage/log
  Body: {
    userId: string,
    eventType: 'chat_message' | 'image_generation',
    model: string,
    tokensInput: number,
    tokensOutput: number,
    costUSD: number,
    metadata?: object
  }
  Response: { success: true }
```

---

## 4. Security & Error Handling

### 4.1 Role-Based Access Control

**Middleware:**
```typescript
// services/api/src/middleware/admin-auth.ts
export async function requireAdmin(request, reply) {
  const user = request.user; // from JWT middleware

  if (!user || user.role !== 'admin') {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required'
      }
    });
  }

  // Log admin action for audit trail
  await db.insert(adminActions).values({
    adminId: user.id,
    action: `${request.method} ${request.url}`,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
}
```

**Route Protection:**
```typescript
app.get('/api/admin/users',
  authenticate,      // Verify JWT
  requireAdmin,      // Check role = 'admin'
  rateLimit(100),    // 100 req/15min
  getUsersHandler
);
```

### 4.2 Error Codes

```typescript
enum AdminErrorCode {
  UNAUTHORIZED = 'ADMIN_UNAUTHORIZED',
  FORBIDDEN = 'ADMIN_FORBIDDEN',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_ROLE = 'INVALID_ROLE',
  CANNOT_BLOCK_ADMIN = 'CANNOT_BLOCK_ADMIN',
  CANNOT_BLOCK_SELF = 'CANNOT_BLOCK_SELF',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  EXPORT_FAILED = 'EXPORT_FAILED'
}
```

### 4.3 Validation

**Zod Schemas:**
```typescript
const changeRoleSchema = z.object({
  role: z.enum(['admin', 'premiumuser', 'user']),
  reason: z.string().max(500).optional()
});

const blockUserSchema = z.object({
  isBlocked: z.boolean(),
  reason: z.string().min(10).max(500).when('isBlocked', {
    is: true,
    then: z.string().required()
  })
});

const dateRangeSchema = z.object({
  period: z.enum(['today', '7d', '30d', 'custom']),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
}).refine(data => {
  if (data.period === 'custom') {
    return data.from && data.to;
  }
  return true;
}, 'Custom period requires from and to dates');
```

### 4.4 Audit Trail

**Log all admin actions:**
```typescript
async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId?: string,
  details?: object
) {
  await db.insert(adminActions).values({
    adminId,
    action,
    targetUserId,
    details,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent']
  });
}

// Usage
await logAdminAction(
  admin.id,
  'USER_ROLE_CHANGED',
  userId,
  { from: 'user', to: 'premiumuser' }
);
```

### 4.5 Rate Limiting

```typescript
// Different limits for different endpoints
Admin dashboard:  100 requests / 15 min
User management:  100 requests / 15 min
Finance/Analytics: 50 requests / 15 min
Regular users:     50 requests / 15 min
Auth endpoints:     5 requests / 15 min
```

---

## 5. Frontend Components

### 5.1 Component Structure

```
apps/web/app/admin/
├── layout.tsx                 # Admin layout with nav
├── page.tsx                   # Redirect to /admin/overview
├── overview/
│   └── page.tsx              # Dashboard overview
├── users/
│   ├── page.tsx              # Users list
│   ├── [userId]/
│   │   └── page.tsx          # User details page
│   └── components/
│       ├── UsersTable.tsx
│       ├── UserDetailsModal.tsx
│       ├── UserActionsMenu.tsx
│       └── UserStatsCard.tsx
├── finance/
│   ├── page.tsx
│   └── components/
│       ├── RevenueChart.tsx
│       ├── CostBreakdown.tsx
│       └── ModelUsageChart.tsx
├── analytics/
│   ├── page.tsx
│   └── components/
│       ├── ActivityMetrics.tsx
│       ├── RetentionChart.tsx
│       └── ConversionFunnel.tsx
└── components/
    ├── AdminNav.tsx          # Top navigation tabs
    ├── MetricCard.tsx        # Reusable metric card
    ├── DateRangePicker.tsx   # Period selector
    ├── ExportButton.tsx      # CSV export button
    └── AdminGuard.tsx        # Route protection HOC
```

### 5.2 Key Components

**MetricCard.tsx:**
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  format = 'number'
}: MetricCardProps) {
  const formattedValue = formatValue(value, format);
  const changeColor = change >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {change !== undefined && (
          <p className={`text-xs ${changeColor} flex items-center gap-1`}>
            {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**AdminNav.tsx:**
```typescript
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
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2",
              pathname.startsWith(item.href)
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

**RevenueChart.tsx (Recharts):**
```typescript
export function RevenueChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value) => `$${value.toFixed(2)}`}
          labelFormatter={(label) => formatDate(label)}
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

### 5.3 State Management

**Zustand Store:**
```typescript
// lib/stores/admin-store.ts
interface AdminStore {
  selectedPeriod: string;
  selectedUsers: string[];
  filters: {
    role?: UserRole;
    status?: 'active' | 'blocked';
    search?: string;
  };

  setSelectedPeriod: (period: string) => void;
  toggleUserSelection: (userId: string) => void;
  setFilters: (filters: Partial<AdminStore['filters']>) => void;
  clearFilters: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  selectedPeriod: '30d',
  selectedUsers: [],
  filters: {},

  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  toggleUserSelection: (userId) => set((state) => ({
    selectedUsers: state.selectedUsers.includes(userId)
      ? state.selectedUsers.filter(id => id !== userId)
      : [...state.selectedUsers, userId]
  })),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  clearFilters: () => set({ filters: {} }),
}));
```

---

## 6. Implementation Plan

### Phase 1: Database & Backend Core (3-4 days)

**Day 1-2: Database Setup**
- [ ] Create migration files for new tables (usage_logs, model_pricing, admin_actions)
- [ ] Add columns to users table (role, isBlocked, blockedReason, blockedAt)
- [ ] Create indexes for performance
- [ ] Seed model_pricing table with current API prices
- [ ] Run migrations on dev database

**Day 3-4: Usage Logging**
- [ ] Create usage logging utility (`services/api/src/utils/usage-logger.ts`)
- [ ] Integrate logging into chat message handler
- [ ] Add cost calculation logic (fetch from model_pricing)
- [ ] Test logging with various models
- [ ] Write unit tests for usage logger

### Phase 2: Admin API Routes (4-5 days)

**Day 5-6: Authentication & Middleware**
- [ ] Create `requireAdmin` middleware
- [ ] Create audit logging middleware
- [ ] Add rate limiting for admin endpoints
- [ ] Write tests for middleware

**Day 7-8: Core Endpoints**
- [ ] Dashboard overview endpoint
- [ ] Users list endpoint with filters/search
- [ ] User details endpoint
- [ ] User usage history endpoint
- [ ] Change role endpoint
- [ ] Block/unblock user endpoint

**Day 9: Finance & Analytics**
- [ ] Finance summary endpoint
- [ ] Advanced analytics endpoint
- [ ] Model usage endpoint
- [ ] CSV export functionality

### Phase 3: Frontend Components (5-6 days)

**Day 10-11: Admin Layout & Overview**
- [ ] Create admin layout with navigation
- [ ] Build MetricCard component
- [ ] Build DateRangePicker component
- [ ] Create Overview dashboard page
- [ ] Integrate Recharts for cost/revenue chart
- [ ] Add top users and models widgets

**Day 12-13: Users Management**
- [ ] Create UsersTable component with search/filters
- [ ] Build UserDetailsModal
- [ ] Build UserActionsMenu dropdown
- [ ] Implement pagination
- [ ] Add CSV export button
- [ ] Wire up API calls

**Day 14-15: Finance & Analytics**
- [ ] Create Finance page with charts
- [ ] Build cost breakdown components
- [ ] Create Analytics page
- [ ] Build retention and conversion charts
- [ ] Add responsive design tweaks
- [ ] Polish UI/UX

### Phase 4: Integration & Testing (2-3 days)

**Day 16-17: Testing**
- [ ] Write E2E tests for critical flows
- [ ] Performance testing with large datasets
- [ ] Security audit (SQL injection, XSS, RBAC)
- [ ] Load testing admin endpoints
- [ ] Fix bugs and edge cases

**Day 18: Documentation & Deployment**
- [ ] Write admin panel user guide
- [ ] Document API endpoints
- [ ] Create seed script for test admin user
- [ ] Deploy to staging
- [ ] QA testing

**Total: 14-18 days (2.5-3 weeks)**

---

## 7. Future Enhancements

### Post-MVP Features

**Real-time Dashboard:**
- WebSocket for live metric updates
- Live counter of online users
- Push notifications for critical alerts
- Auto-refresh dashboard every 30 seconds

**Advanced Filters & Segments:**
- Cohort analysis (users registered in specific month)
- Custom date ranges with calendar picker
- Save filter presets
- Compare periods (current vs previous)

**Automated Alerts:**
- Email/Telegram when costs exceed threshold
- Alert when user approaches limit
- Weekly/Monthly automated reports
- Anomaly detection for unusual spending

**Bulk Actions:**
- Select multiple users → change role
- Bulk export/import users
- Mass blocking by criteria
- Scheduled actions

**Audit Trail UI:**
- Dedicated page for admin actions log
- Filter by admin, action type, date
- Export audit log to CSV
- Search through audit history

**Cost Predictions:**
- ML model to forecast next month's costs
- Budget alerts and recommendations
- Trend analysis and predictions
- Cost optimization suggestions

**Advanced Analytics:**
- Funnel analysis for user journey
- A/B testing results dashboard
- Revenue forecasting
- Churn prediction

---

## Appendix A: Database Migrations

**0001_add_admin_tables.sql:**
```sql
-- Add role column to users
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN blocked_reason TEXT;
ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP;

-- Migrate existing data
UPDATE users SET role = 'premiumuser' WHERE subscription_tier = 'premium';
UPDATE users SET role = 'user' WHERE subscription_tier = 'free';

-- Create indexes
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

-- Seed model pricing
INSERT INTO model_pricing (model_id, price_per_input_token, price_per_output_token) VALUES
  ('gpt-4-turbo', 0.00001, 0.00003),
  ('gpt-4', 0.00003, 0.00006),
  ('gpt-3.5-turbo', 0.0000005, 0.0000015),
  ('claude-3-opus-20240229', 0.000015, 0.000075),
  ('claude-3-sonnet-20240229', 0.000003, 0.000015),
  ('claude-3-haiku-20240307', 0.00000025, 0.00000125),
  ('gemini-pro', 0.0000005, 0.0000015);

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

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id, created_at DESC);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_user_id, created_at DESC);
```

---

## Appendix B: Example API Responses

**Dashboard Overview Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalCosts": 234.50,
      "costsChange": 12.3,
      "totalRevenue": 450.00,
      "revenueChange": 8.5,
      "profit": 215.50,
      "profitChange": 15.2,
      "totalUsers": 1234,
      "usersChange": 45,
      "activeUsers": 456
    },
    "costRevenueChart": [
      { "date": "2024-02-01", "costs": 12.50, "revenue": 25.00 },
      { "date": "2024-02-02", "costs": 15.20, "revenue": 28.50 },
      { "date": "2024-02-03", "costs": 18.90, "revenue": 32.00 }
    ],
    "topUsers": [
      {
        "userId": "uuid-1",
        "email": "poweruser@example.com",
        "role": "premiumuser",
        "spent": 125.40,
        "messageCount": 2456
      },
      {
        "userId": "uuid-2",
        "email": "heavyuser@test.com",
        "role": "premiumuser",
        "spent": 89.20,
        "messageCount": 1892
      }
    ],
    "topModels": [
      {
        "model": "gpt-4-turbo",
        "usage": 125000,
        "cost": 156.78,
        "percentage": 45.2
      },
      {
        "model": "claude-3-opus",
        "usage": 89000,
        "cost": 98.45,
        "percentage": 30.5
      }
    ]
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2026-02-10
**Next Review:** After Phase 1 completion
