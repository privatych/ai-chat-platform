import { FastifyRequest, FastifyReply } from 'fastify';
import { db, usageLogs, users, subscriptions } from '@ai-chat/database';
import { sql, eq, gte, and, desc, count, sum } from 'drizzle-orm';
import { z } from 'zod';
import { SUBSCRIPTION_PLANS } from '@ai-chat/shared';

// Query parameter validation
const querySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
});

// Helper function to calculate start date based on period
function getStartDate(period: '7d' | '30d' | '90d'): Date {
  const now = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);
  return now;
}

// Helper function to format costs to 2 decimal places
function formatCost(value: string | number | null): number {
  if (value === null || value === undefined) return 0;
  return Math.round(parseFloat(String(value)) * 100) / 100;
}

/**
 * GET /api/admin/dashboard/overview
 *
 * Returns comprehensive dashboard metrics for admin analytics.
 * Provides cost/revenue analysis, user statistics, and usage breakdowns.
 *
 * NOTE: Costs are in USD (from OpenAI/Anthropic API providers).
 *       Revenue is in RUB (from Russian user subscriptions).
 *       Profit calculation reflects mixed currencies for Russian market.
 *
 * Query Parameters:
 * - period: '7d' | '30d' | '90d' (default: '30d')
 *
 * Response:
 * {
 *   metrics: {
 *     totalCosts: number,      // in USD
 *     totalRevenue: number,    // in RUB
 *     totalProfit: number,     // in RUB (revenue - costs, mixed currency)
 *     totalUsers: number,
 *     activeUsers: number,
 *     totalRequests: number
 *   },
 *   costRevenueChart: [
 *     { date: "2026-02-01", costs: 145.50, revenue: 29700.00 },
 *     ...
 *   ],
 *   topUsers: [
 *     { userId: string, email: string, totalCost: number, requestCount: number },
 *     ...
 *   ],
 *   topModels: [
 *     { model: string, totalCost: number, requestCount: number },
 *     ...
 *   ]
 * }
 */
export async function dashboardOverviewHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Validate query parameters
    const { period } = querySchema.parse(request.query);
    const startDate = getStartDate(period);

    // Fetch all data in parallel for better performance
    const [
      metricsResult,
      totalUsersResult,
      chartDataResult,
      topUsersResult,
      topModelsResult,
    ] = await Promise.all([
      // 1. Calculate main metrics (costs, active users, requests)
      db
        .select({
          totalCosts: sum(usageLogs.costUsd),
          activeUsers: sql<number>`COUNT(DISTINCT ${usageLogs.userId})`,
          totalRequests: count(),
        })
        .from(usageLogs)
        .where(gte(usageLogs.createdAt, startDate)),

      // 2. Get total users count (all time)
      db
        .select({
          totalUsers: count(),
        })
        .from(users),

      // 3. Get daily cost/revenue chart data
      db
        .select({
          date: sql<string>`DATE(${usageLogs.createdAt})`,
          costs: sum(usageLogs.costUsd),
        })
        .from(usageLogs)
        .where(gte(usageLogs.createdAt, startDate))
        .groupBy(sql`DATE(${usageLogs.createdAt})`)
        .orderBy(sql`DATE(${usageLogs.createdAt})`),

      // 4. Get top users by cost
      db
        .select({
          userId: usageLogs.userId,
          email: users.email,
          totalCost: sum(usageLogs.costUsd),
          requestCount: count(),
        })
        .from(usageLogs)
        .innerJoin(users, eq(usageLogs.userId, users.id))
        .where(gte(usageLogs.createdAt, startDate))
        .groupBy(usageLogs.userId, users.email)
        .orderBy(desc(sum(usageLogs.costUsd)))
        .limit(10),

      // 5. Get top models by usage
      db
        .select({
          model: usageLogs.model,
          totalCost: sum(usageLogs.costUsd),
          requestCount: count(),
        })
        .from(usageLogs)
        .where(gte(usageLogs.createdAt, startDate))
        .groupBy(usageLogs.model)
        .orderBy(desc(sum(usageLogs.costUsd)))
        .limit(10),
    ]);

    // Calculate revenue from premium subscriptions (in RUB)
    // Revenue is in RUB from Russian user subscriptions
    const PREMIUM_MONTHLY_PRICE_RUB = SUBSCRIPTION_PLANS.premium.price; // 990 RUB
    const activePremiumUsers = await db
      .select({
        count: count(),
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.plan, 'premium'),
          eq(subscriptions.status, 'active')
        )
      );

    const premiumUserCount = activePremiumUsers[0]?.count || 0;

    // Calculate revenue based on period (in RUB)
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const totalRevenue = formatCost((premiumUserCount * PREMIUM_MONTHLY_PRICE_RUB * periodDays) / 30);

    // Build metrics object
    // Note: totalCosts is in USD (from API providers), totalRevenue is in RUB (from subscriptions)
    const totalCosts = formatCost(metricsResult[0]?.totalCosts || 0);
    const metrics = {
      totalCosts, // in USD
      totalRevenue, // in RUB
      totalProfit: formatCost(totalRevenue - totalCosts), // in RUB (mixed currency for Russian market)
      totalUsers: totalUsersResult[0]?.totalUsers || 0,
      activeUsers: Number(metricsResult[0]?.activeUsers) || 0,
      totalRequests: Number(metricsResult[0]?.totalRequests) || 0,
    };

    // Build cost/revenue chart data
    // Create a map for quick lookup of daily costs (in USD)
    const costsByDate = new Map<string, number>();
    chartDataResult.forEach((row) => {
      costsByDate.set(row.date, formatCost(row.costs || 0));
    });

    // Generate complete date range with costs (USD) and estimated daily revenue (RUB)
    const dailyRevenue = formatCost(totalRevenue / periodDays);
    const costRevenueChart = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      costRevenueChart.push({
        date: dateStr,
        costs: costsByDate.get(dateStr) || 0,
        revenue: dailyRevenue,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Format top users
    const topUsers = topUsersResult.map((row) => ({
      userId: row.userId,
      email: row.email,
      totalCost: formatCost(row.totalCost || 0),
      requestCount: Number(row.requestCount),
    }));

    // Format top models
    const topModels = topModelsResult.map((row) => ({
      model: row.model,
      totalCost: formatCost(row.totalCost || 0),
      requestCount: Number(row.requestCount),
    }));

    return reply.send({
      success: true,
      data: {
        metrics,
        costRevenueChart,
        topUsers,
        topModels,
      },
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      });
    }

    // Handle unexpected errors
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard data',
      },
    });
  }
}
