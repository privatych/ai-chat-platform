import { FastifyRequest, FastifyReply } from 'fastify';
import { db, users, usageLogs, adminActions } from '@ai-chat/database';
import { eq, and, or, ilike, desc, count, sum, sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['admin', 'premiumuser', 'user']).optional(),
  status: z.enum(['blocked', 'active']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'premiumuser', 'user']),
});

const updateBlockSchema = z.object({
  blocked: z.boolean(),
  reason: z.string().min(1).optional(),
});

// Helper function to format cost
function formatCost(value: string | number | null): number {
  if (value === null || value === undefined) return 0;
  return Math.round(parseFloat(String(value)) * 100) / 100;
}

/**
 * GET /api/admin/users
 *
 * Returns paginated list of users with filtering support.
 *
 * Query Parameters:
 * - search: string (optional) - Search by email or full name
 * - role: 'admin' | 'premiumuser' | 'user' (optional) - Filter by role
 * - status: 'blocked' | 'active' (optional) - Filter by block status
 * - page: number (default: 1) - Page number
 * - limit: number (default: 20, max: 100) - Items per page
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     users: [...],
 *     pagination: {
 *       page: number,
 *       limit: number,
 *       total: number,
 *       totalPages: number
 *     }
 *   }
 * }
 */
export async function listUsersHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Validate query parameters
    const { search, role, status, page, limit } = listUsersQuerySchema.parse(request.query);

    // Build WHERE conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.fullName, `%${search}%`)
        )
      );
    }

    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (status === 'blocked') {
      conditions.push(eq(users.isBlocked, true));
    } else if (status === 'active') {
      conditions.push(eq(users.isBlocked, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get paginated users
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        role: users.role,
        subscriptionTier: users.subscriptionTier,
        isBlocked: users.isBlocked,
        blockedReason: users.blockedReason,
        blockedAt: users.blockedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return reply.send({
      success: true,
      data: {
        users: usersList.map((user) => ({
          ...user,
          blockedAt: user.blockedAt ? user.blockedAt.toISOString() : null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('List users error:', error);

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
        message: 'Failed to fetch users',
      },
    });
  }
}

/**
 * GET /api/admin/users/:userId
 *
 * Returns detailed user information including usage stats and recent activity.
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     user: {...},
 *     stats: {
 *       totalSpent: number,      // in RUB
 *       requestCount: number,
 *       lastActive: string | null
 *     },
 *     recentActivity: [...]      // Last 10 usage logs
 *   }
 * }
 */
export async function getUserDetailsHandler(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;

    // Fetch user details, stats, and recent activity in parallel
    const [userResult, statsResult, recentActivity] = await Promise.all([
      // 1. Get user details
      db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          role: users.role,
          subscriptionTier: users.subscriptionTier,
          subscriptionExpiresAt: users.subscriptionExpiresAt,
          isBlocked: users.isBlocked,
          blockedReason: users.blockedReason,
          blockedAt: users.blockedAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),

      // 2. Get usage statistics
      db
        .select({
          totalSpent: sum(usageLogs.costUsd),
          requestCount: count(),
          lastActive: sql<string>`MAX(${usageLogs.createdAt})`,
        })
        .from(usageLogs)
        .where(eq(usageLogs.userId, userId)),

      // 3. Get recent activity (last 10 usage logs)
      db
        .select({
          id: usageLogs.id,
          eventType: usageLogs.eventType,
          model: usageLogs.model,
          tokensInput: usageLogs.tokensInput,
          tokensOutput: usageLogs.tokensOutput,
          tokensTotal: usageLogs.tokensTotal,
          costUsd: usageLogs.costUsd,
          metadata: usageLogs.metadata,
          createdAt: usageLogs.createdAt,
        })
        .from(usageLogs)
        .where(eq(usageLogs.userId, userId))
        .orderBy(desc(usageLogs.createdAt))
        .limit(10),
    ]);

    // Check if user exists
    if (!userResult || userResult.length === 0) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const user = userResult[0];
    const stats = statsResult[0];

    return reply.send({
      success: true,
      data: {
        user: {
          ...user,
          subscriptionExpiresAt: user.subscriptionExpiresAt
            ? user.subscriptionExpiresAt.toISOString()
            : null,
          blockedAt: user.blockedAt ? user.blockedAt.toISOString() : null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        stats: {
          totalSpent: formatCost(stats?.totalSpent || 0),
          requestCount: Number(stats?.requestCount || 0),
          lastActive: stats?.lastActive || null,
        },
        recentActivity: recentActivity.map((log) => ({
          ...log,
          costUsd: formatCost(log.costUsd),
          createdAt: log.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Get user details error:', error);

    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user details',
      },
    });
  }
}

/**
 * PATCH /api/admin/users/:userId/role
 *
 * Updates a user's role. Prevents admin from changing their own role for safety.
 *
 * Body:
 * {
 *   role: 'admin' | 'premiumuser' | 'user'
 * }
 */
export async function updateUserRoleHandler(
  request: FastifyRequest<{
    Params: { userId: string };
    Body: { role: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;
    const adminUserId = request.user.userId;

    // Validate request body
    const { role } = updateRoleSchema.parse(request.body);

    // Prevent changing own role
    if (userId === adminUserId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot change your own role',
        },
      });
    }

    // Fetch current user
    const currentUserResult = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUserResult || currentUserResult.length === 0) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const currentUser = currentUserResult[0];
    const oldRole = currentUser.role;

    // Update user role
    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Log admin action
    await db.insert(adminActions).values({
      adminId: adminUserId,
      action: 'USER_ROLE_CHANGED',
      targetUserId: userId,
      details: {
        from: oldRole,
        to: role,
        userEmail: currentUser.email,
      },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: {
        userId,
        oldRole,
        newRole: role,
      },
    });
  } catch (error) {
    console.error('Update user role error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.errors,
        },
      });
    }

    // Handle unexpected errors
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user role',
      },
    });
  }
}

/**
 * PATCH /api/admin/users/:userId/block
 *
 * Blocks or unblocks a user. Prevents admin from blocking themselves.
 *
 * Body:
 * {
 *   blocked: boolean,
 *   reason?: string  // Required when blocking
 * }
 */
export async function updateUserBlockHandler(
  request: FastifyRequest<{
    Params: { userId: string };
    Body: { blocked: boolean; reason?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;
    const adminUserId = request.user.userId;

    // Validate request body
    const { blocked, reason } = updateBlockSchema.parse(request.body);

    // Require reason when blocking
    if (blocked && !reason) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reason is required when blocking a user',
        },
      });
    }

    // Prevent self-block
    if (userId === adminUserId) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot block yourself',
        },
      });
    }

    // Fetch current user
    const currentUserResult = await db
      .select({
        id: users.id,
        email: users.email,
        isBlocked: users.isBlocked,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUserResult || currentUserResult.length === 0) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const currentUser = currentUserResult[0];

    // Update user block status
    await db
      .update(users)
      .set({
        isBlocked: blocked,
        blockedReason: blocked ? reason : null,
        blockedAt: blocked ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Log admin action
    await db.insert(adminActions).values({
      adminId: adminUserId,
      action: blocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
      targetUserId: userId,
      details: {
        blocked,
        reason: reason || null,
        userEmail: currentUser.email,
      },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: {
        userId,
        blocked,
        reason: blocked ? reason : null,
      },
    });
  } catch (error) {
    console.error('Update user block error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.errors,
        },
      });
    }

    // Handle unexpected errors
    return reply.code(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update user block status',
      },
    });
  }
}
