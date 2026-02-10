import { FastifyRequest, FastifyReply } from 'fastify';
import { db, users, adminActions } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

/**
 * Middleware to check if the authenticated user has admin role
 * and log all admin actions to the audit trail
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Check if user is authenticated
  if (!request.user || !(request.user as any).userId) {
    reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
    return;
  }

  const userId = (request.user as any).userId;

  try {
    // Check if user has admin role
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Reject if user not found or not admin
    if (!user || user.role !== 'admin') {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
      return;
    }

    // Log admin action to audit trail
    try {
      await db.insert(adminActions).values({
        adminId: userId,
        action: 'ADMIN_ACCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        details: {
          method: request.method,
          url: request.url,
        },
      }).returning();
    } catch (logError) {
      // Log error but don't block the request
      // Admin access should continue even if audit logging fails
      console.error('Failed to log admin action:', logError);
    }

    // Continue to next handler - no reply sent, no return
  } catch (error) {
    // If any error occurs during authentication/authorization, deny access
    reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
}
