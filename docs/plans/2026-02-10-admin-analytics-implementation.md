# Admin Analytics Panel - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build comprehensive admin analytics panel with usage tracking, user management, financial metrics, and advanced analytics.

**Architecture:** Three-tier architecture with PostgreSQL analytics tables (usage_logs, model_pricing, admin_actions), Fastify REST API with RBAC middleware, and Next.js admin dashboard using shadcn/ui + Recharts for visualization. Redis caching for performance.

**Tech Stack:** PostgreSQL, Drizzle ORM, Fastify, Next.js 15, shadcn/ui, Recharts, Zustand, Vitest, Zod

---

## Overview

This implementation plan covers building the complete Admin Analytics Panel in 4 phases over ~18 days:

- **Phase 1:** Database & Backend Core (Days 1-4) - Create analytics tables, usage logger, integrate tracking
- **Phase 2:** Admin API Routes (Days 5-9) - Build all admin endpoints with RBAC and audit trail
- **Phase 3:** Frontend Components (Days 10-15) - Admin UI with dashboards, charts, user management
- **Phase 4:** Testing & Polish (Days 16-18) - E2E tests, optimization, security, docs

Each task follows TDD: write test → run (fail) → implement → run (pass) → commit.

---

## Phase 1: Database & Backend Core

Estimated: 3-4 days

### Task 1: Create Database Schemas for Analytics Tables

**Goal:** Define Drizzle ORM schemas for usage_logs, model_pricing, admin_actions, and update users table.

**Files:**
- Create: `packages/database/src/schema/usage-logs.ts`
- Create: `packages/database/src/schema/model-pricing.ts`
- Create: `packages/database/src/schema/admin-actions.ts`
- Modify: `packages/database/src/schema/users.ts` (add role, isBlocked fields)
- Modify: `packages/database/src/schema/index.ts` (export new schemas)

**Commands:**
```bash
cd packages/database
```

**Implementation:** See design doc sections 1.1-1.2 for complete schema definitions.

**Testing:**
```bash
pnpm db:generate
# Expected: Migration files generated successfully
```

**Commit:**
```bash
git add packages/database/src/schema/
git commit -m "feat(db): add admin analytics schemas"
```

---

### Task 2: Create SQL Migration File

**Goal:** Write SQL migration to create all analytics tables with indexes and seed data.

**Files:**
- Create: `packages/database/drizzle/0002_add_admin_analytics.sql`

**Implementation:**
Create comprehensive SQL migration including:
- ALTER users table (add role, isBlocked, blockedReason, blockedAt)
- UPDATE users (migrate subscriptionTier → role)
- CREATE usage_logs table with 4 indexes
- CREATE model_pricing table
- INSERT seed data for 7 common models
- CREATE admin_actions table with 2 indexes

**Testing:**
```bash
tsx packages/database/scripts/run-migration.ts
psql $DATABASE_URL -c "\dt"
# Expected: See new tables
```

**Commit:**
```bash
git add packages/database/drizzle/
git commit -m "feat(db): add admin analytics migration"
```

---

### Task 3: Create Usage Logger Utility

**Goal:** Build utility to calculate costs and log API usage to database.

**Files:**
- Create: `services/api/src/utils/usage-logger.ts`
- Create: `services/api/src/__tests__/utils/usage-logger.test.ts`

**Step 1:** Write failing tests for calculateCost() and logUsage()

**Step 2:** Implement usage-logger.ts:
```typescript
export async function calculateCost(model: string, tokensInput: number, tokensOutput: number): Promise<number>
export async function logUsage(params: LogUsageParams): Promise<UsageLog>
```

**Testing:**
```bash
pnpm --filter @ai-chat/api test:run usage-logger
# Expected: 2 test files, 5+ tests passing
```

**Commit:**
```bash
git add services/api/src/utils/usage-logger.ts services/api/src/__tests__/utils/usage-logger.test.ts
git commit -m "feat(api): add usage logging utility"
```

---

### Task 4: Integrate Usage Logging into Chat Handler

**Goal:** Log every chat message to usage_logs for analytics.

**Files:**
- Modify: `services/api/src/routes/chat/message.ts`

**Implementation:**
After saving assistant message (around line 220), add:
```typescript
await logUsage({
  userId,
  eventType: 'chat_message',
  model: currentModel,
  tokensInput: Math.floor(tokensUsed * 0.4),
  tokensOutput: Math.floor(tokensUsed * 0.6),
  metadata: { chatId, messageLength: assistantMessage.length }
});
```

**Testing:**
```bash
pnpm --filter @ai-chat/api dev
# Send test message via UI
psql $DATABASE_URL -c "SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 1;"
# Expected: See logged usage entry with cost
```

**Commit:**
```bash
git add services/api/src/routes/chat/message.ts
git commit -m "feat(api): integrate usage logging into chat"
```

---

## Phase 2: Admin API Routes

Estimated: 4-5 days

### Task 5: Create Admin Authorization Middleware

**Goal:** Build middleware to check admin role and log all admin actions.

**Files:**
- Create: `services/api/src/middleware/admin-auth.ts`
- Create: `services/api/src/__tests__/middleware/admin-auth.test.ts`

**Step 1:** Write tests for:
- Allow admin users (role='admin')
- Reject non-admin users (403)
- Reject unauthenticated requests
- Log action to audit trail

**Step 2:** Implement requireAdmin middleware:
```typescript
export async function requireAdmin(request, reply) {
  if (!user || user.role !== 'admin') {
    return reply.code(403).send({ error: 'FORBIDDEN' });
  }
  await logAdminAction(...);
}
```

**Testing:**
```bash
pnpm --filter @ai-chat/api test:run admin-auth
# Expected: 4 tests passing
```

**Commit:**
```bash
git add services/api/src/middleware/admin-auth.ts
git commit -m "feat(api): add admin auth middleware"
```

---

### Task 6: Create Dashboard Overview Endpoint

**Goal:** Build GET /api/admin/dashboard/overview endpoint returning metrics, charts, top users/models.

**Files:**
- Create: `services/api/src/routes/admin/dashboard.ts`
- Create: `services/api/src/routes/admin/index.ts`
- Modify: `services/api/src/app.ts` (register admin routes)
- Create: `services/api/src/__tests__/routes/admin/dashboard.test.ts`

**Implementation:**
```typescript
GET /api/admin/dashboard/overview?period=30d
Response: {
  metrics: { totalCosts, revenue, profit, users... },
  costRevenueChart: [...],
  topUsers: [...],
  topModels: [...]
}
```

**Testing:**
```bash
pnpm --filter @ai-chat/api test:run dashboard
# Expected: Tests pass
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3001/api/admin/dashboard/overview
# Expected: JSON with metrics
```

**Commit:**
```bash
git add services/api/src/routes/admin/
git commit -m "feat(api): add dashboard overview endpoint"
```

---

### Task 7: Create User Management Endpoints

**Goal:** Build endpoints for listing, filtering, and managing users.

**Files:**
- Create: `services/api/src/routes/admin/users.ts`
- Modify: `services/api/src/routes/admin/index.ts`
- Create: `services/api/src/__tests__/routes/admin/users.test.ts`

**Endpoints:**
```
GET    /api/admin/users              # List with filters
GET    /api/admin/users/:userId      # User details
PATCH  /api/admin/users/:userId/role # Change role
PATCH  /api/admin/users/:userId/block # Block/unblock
```

**Implementation:**
- listUsers: support search, role filter, status filter, pagination
- getUserDetails: return user + stats + recent activity
- changeUserRole: validate role, update, log action
- blockUser: require reason when blocking, prevent self-block

**Testing:**
```bash
pnpm --filter @ai-chat/api test:run users
# Expected: 10+ tests passing
```

**Commit:**
```bash
git add services/api/src/routes/admin/users.ts
git commit -m "feat(api): add user management endpoints"
```

---

## Phase 3: Frontend Components

Estimated: 5-6 days

### Task 8: Create Admin Layout and Navigation

**Goal:** Build admin panel layout with route protection and tab navigation.

**Files:**
- Create: `apps/web/app/admin/layout.tsx`
- Create: `apps/web/app/admin/page.tsx` (redirect to /overview)
- Create: `apps/web/components/admin/AdminNav.tsx`
- Create: `apps/web/components/admin/AdminGuard.tsx`

**Implementation:**
- AdminGuard: check isAuthenticated && user.role === 'admin', redirect if not
- AdminNav: tab navigation (Overview, Users, Finance, Analytics)
- Layout: header + nav + content wrapper

**Testing:**
```bash
pnpm --filter @ai-chat/web dev
# Navigate to /admin
# Expected: Redirects to /admin/overview if not admin, shows 403 if not logged in
```

**Commit:**
```bash
git add apps/web/app/admin/ apps/web/components/admin/
git commit -m "feat(web): add admin layout and navigation"
```

---

### Task 9: Create Reusable Components (MetricCard, Charts)

**Goal:** Build MetricCard component and setup Recharts.

**Files:**
- Create: `apps/web/components/admin/MetricCard.tsx`
- Create: `apps/web/components/admin/charts/RevenueChart.tsx`
- Modify: `apps/web/package.json` (add recharts)

**Implementation:**
- MetricCard: display title, value, change%, trend icon
- RevenueChart: dual area chart (revenue green, costs red)

**Testing:**
```bash
pnpm --filter @ai-chat/web add recharts
pnpm --filter @ai-chat/web dev
# Create test page with sample data
# Expected: Metric cards render correctly, chart displays
```

**Commit:**
```bash
git add apps/web/components/admin/
git commit -m "feat(web): add MetricCard and RevenueChart"
```

---

### Task 10: Create Admin API Client

**Goal:** Build TypeScript client for all admin API endpoints.

**Files:**
- Create: `apps/web/lib/api/admin-client.ts`
- Modify: `apps/web/lib/api/client.ts` (export adminApiClient)

**Implementation:**
```typescript
export class AdminAPIClient {
  async getDashboardOverview(period): Promise<DashboardOverview>
  async listUsers(params): Promise<UserListResponse>
  async getUserDetails(userId): Promise<UserDetails>
  async changeUserRole(userId, role)
  async blockUser(userId, reason)
  async unblockUser(userId)
}
```

**Testing:**
Manual testing in browser console or create simple test page.

**Commit:**
```bash
git add apps/web/lib/api/admin-client.ts
git commit -m "feat(web): add admin API client"
```

---

### Task 11: Create Overview Dashboard Page

**Goal:** Build complete overview page with metrics, chart, top users/models.

**Files:**
- Create: `apps/web/app/admin/overview/page.tsx`

**Implementation:**
- Fetch dashboard data on mount
- Display 4 MetricCards (costs, revenue, profit, users)
- Display RevenueChart
- Display top 5 users table
- Display top models list
- Period selector (7d/30d buttons)

**Testing:**
```bash
pnpm --filter @ai-chat/web dev
# Navigate to /admin/overview
# Expected: See dashboard with real data, click period buttons
```

**Commit:**
```bash
git add apps/web/app/admin/overview/
git commit -m "feat(web): add admin overview dashboard"
```

---

### Task 12: Create Users Management Page

**Goal:** Build users list with search, filters, pagination, and actions.

**Files:**
- Create: `apps/web/app/admin/users/page.tsx`
- Create: `apps/web/components/admin/UsersTable.tsx`
- Create: `apps/web/components/admin/UserActionsMenu.tsx`

**Implementation:**
- UsersTable: display users with role badges, spent, message count
- Search input with debounce
- Filter dropdowns (role, status)
- Pagination controls
- UserActionsMenu: view details, change role, block/unblock

**Testing:**
```bash
pnpm --filter @ai-chat/web dev
# Navigate to /admin/users
# Test search, filters, pagination
```

**Commit:**
```bash
git add apps/web/app/admin/users/ apps/web/components/admin/
git commit -m "feat(web): add users management page"
```

---

### Task 13: Create User Details Modal

**Goal:** Modal showing full user details, stats, recent activity.

**Files:**
- Create: `apps/web/components/admin/UserDetailsModal.tsx`

**Implementation:**
- Display user info, stats (spent, messages, last active)
- Mini bar chart of usage over time
- Actions: change role, block/unblock
- Close button

**Testing:**
Click user in table → modal opens with details

**Commit:**
```bash
git add apps/web/components/admin/UserDetailsModal.tsx
git commit -m "feat(web): add user details modal"
```

---

### Task 14: Create Finance Analytics Page

**Goal:** Financial dashboard with cost breakdown, revenue analysis.

**Files:**
- Create: `apps/web/app/admin/finance/page.tsx`
- Create: `apps/web/components/admin/charts/CostBreakdown.tsx`
- Create: `apps/web/components/admin/charts/ModelUsageChart.tsx`

**Implementation:**
- Display finance metrics (costs, revenue, margin, ARPU)
- Revenue vs Costs stacked area chart
- Cost breakdown by user type (donut chart)
- Model usage bar chart

**Testing:**
Navigate to /admin/finance, verify all charts render

**Commit:**
```bash
git add apps/web/app/admin/finance/
git commit -m "feat(web): add finance analytics page"
```

---

### Task 15: Create Advanced Analytics Page

**Goal:** Dashboard with DAU/WAU/MAU, retention, conversion metrics.

**Files:**
- Create: `apps/web/app/admin/analytics/page.tsx`
- Create: `apps/web/components/admin/charts/RetentionChart.tsx`
- Create: `apps/web/components/admin/charts/ConversionFunnel.tsx`

**Implementation:**
- Display activity metrics (DAU, WAU, MAU)
- Messages per day line chart
- Retention heatmap (day 1, 7, 30)
- Conversion funnel chart

**Testing:**
Navigate to /admin/analytics

**Commit:**
```bash
git add apps/web/app/admin/analytics/
git commit -m "feat(web): add advanced analytics page"
```

---

## Phase 4: Testing, Optimization & Documentation

Estimated: 2-3 days

### Task 16: Write E2E Tests for Critical Admin Flows

**Goal:** Playwright tests for key admin workflows.

**Files:**
- Create: `apps/web/e2e/admin-dashboard.spec.ts`
- Create: `apps/web/e2e/user-management.spec.ts`

**Tests:**
1. Admin can login and view dashboard
2. Admin can search and filter users
3. Admin can change user role
4. Admin can block user with reason
5. Dashboard metrics display correctly

**Testing:**
```bash
pnpm --filter @ai-chat/web test:e2e
# Expected: All E2E tests pass
```

**Commit:**
```bash
git add apps/web/e2e/
git commit -m "test(web): add E2E tests for admin panel"
```

---

### Task 17: Performance Optimization

**Goal:** Add Redis caching, optimize queries, lazy loading.

**Tasks:**
- Implement Redis caching for dashboard queries (5min TTL)
- Add database query explain analyze for slow queries
- Lazy load heavy components (charts)
- Add loading skeletons

**Testing:**
- Measure dashboard load time before/after
- Verify Redis cache hits in logs
- Check database query performance

**Commit:**
```bash
git add services/api/src/routes/admin/ apps/web/
git commit -m "perf(admin): add caching and optimize queries"
```

---

### Task 18: Security Audit

**Goal:** Review and harden admin panel security.

**Checklist:**
- [ ] All admin routes protected by requireAdmin middleware
- [ ] All inputs validated with Zod schemas
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React auto-escaping verified)
- [ ] CSRF protection (check JWT implementation)
- [ ] Rate limiting on admin endpoints
- [ ] Audit trail logging all admin actions
- [ ] Sensitive data (passwords) never exposed in responses

**Testing:**
- Try to access admin endpoints as regular user (should 403)
- Try SQL injection in search fields
- Verify audit trail logs actions
- Check rate limiting works

**Commit:**
```bash
git add services/api/src/middleware/ services/api/src/routes/admin/
git commit -m "security(admin): harden admin panel security"
```

---

### Task 19: Write API Documentation

**Goal:** Document all admin API endpoints.

**Files:**
- Create: `docs/api/admin-endpoints.md`

**Content:**
- Endpoint list with method, path, auth
- Request/response examples
- Error codes
- Rate limits

**Commit:**
```bash
git add docs/api/admin-endpoints.md
git commit -m "docs(api): document admin endpoints"
```

---

### Task 20: Write Admin Panel User Guide

**Goal:** User-facing documentation for admin panel.

**Files:**
- Create: `docs/guides/admin-panel-guide.md`

**Content:**
- How to access admin panel
- Dashboard overview explanation
- User management guide
- Finance metrics guide
- How to interpret analytics

**Commit:**
```bash
git add docs/guides/admin-panel-guide.md
git commit -m "docs: add admin panel user guide"
```

---

## Final Steps

### Integration & Testing

1. **Full System Test:**
```bash
# Start all services
docker-compose up -d
pnpm dev

# Test full flow:
# 1. Login as admin
# 2. View dashboard
# 3. Search users
# 4. Change user role
# 5. View finance page
# 6. Check analytics
```

2. **Performance Test:**
```bash
# Generate test data
tsx services/api/scripts/seed-usage-data.ts

# Load test dashboard
ab -n 100 -c 10 http://localhost:3001/api/admin/dashboard/overview
```

3. **Security Test:**
```bash
# Try accessing as non-admin
curl -H "Authorization: Bearer $USER_TOKEN" http://localhost:3001/api/admin/users
# Expected: 403 Forbidden
```

### Deployment

1. Run migrations on production DB
2. Deploy API with new admin routes
3. Deploy Web with admin panel
4. Create first admin user manually:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

5. Test admin login
6. Monitor logs for admin actions
7. Set up alerts for high costs

---

## Summary

**Total Tasks:** 20 tasks
**Estimated Time:** 16-18 days (2.5-3 weeks)
**Team Size:** 1-2 developers

**Phases:**
1. Database & Backend Core (4 tasks, 3-4 days)
2. Admin API Routes (3 tasks, 4-5 days)
3. Frontend Components (8 tasks, 5-6 days)
4. Testing & Polish (5 tasks, 2-3 days)

**Key Deliverables:**
- ✅ Complete admin analytics infrastructure
- ✅ User management system
- ✅ Financial dashboards
- ✅ Advanced analytics
- ✅ Audit trail
- ✅ Full test coverage
- ✅ Documentation

**Success Metrics:**
- All API endpoints return data in <200ms
- Admin dashboard loads in <1s
- 100% test coverage for admin routes
- Zero security vulnerabilities
- Audit trail captures all admin actions

---

## Next Steps

**Execute this plan using:**

1. **superpowers:subagent-driven-development** (in this session)
   - Dispatch fresh subagent per task
   - Code review between tasks
   - Fast iteration with human feedback

2. **superpowers:executing-plans** (separate session)
   - Batch execution with checkpoints
   - Run in worktree
   - Review at phase completion

**Ready to begin implementation!**
