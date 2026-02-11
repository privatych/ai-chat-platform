import { FastifyRequest, FastifyReply } from 'fastify';
import { db, users, adminActions } from '@ai-chat/database';
import { eq } from 'drizzle-orm';
import { AdminErrors } from '../constants/errors';

/**
 * Middleware to check if the authenticated user has admin role and log all admin actions to the audit trail.
 *
 * This middleware performs three main functions:
 * 1. Verifies the user is authenticated (has valid JWT token)
 * 2. Checks if the user has admin role in the database
 * 3. Logs all admin actions to the audit trail for security monitoring
 *
 * @param {FastifyRequest} request - The Fastify request object with user authentication data
 * @param {FastifyReply} reply - The Fastify reply object for sending responses
 * @returns {Promise<void>} Resolves if admin access is granted, sends 403 response if denied
 *
 * @throws {Error} Returns 403 Forbidden if:
 * - User is not authenticated
 * - User does not exist in database
 * - User role is not 'admin'
 * - Database query fails
 *
 * @security
 * - All admin actions are logged to the adminActions table for audit purposes
 * - Logs include: adminId, action type, IP address, user agent, request method, and URL
 * - Audit logging failures are logged to console but do not block admin access
 * - Failed authentication attempts result in immediate 403 response
 *
 * @example
 * // Protect an admin route
 * app.get('/admin/users', {
 *   preHandler: requireAdmin
 * }, async (request, reply) => {
 *   // Handler code - only executed if user is admin
 * });
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Check if user is authenticated
  if (!request.user?.userId) {
    reply.code(403).send({
      success: false,
      error: AdminErrors.FORBIDDEN,
    });
    return;
  }

  const userId = request.user.userId;

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
        error: AdminErrors.FORBIDDEN,
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
      error: AdminErrors.FORBIDDEN,
    });
  }
}
