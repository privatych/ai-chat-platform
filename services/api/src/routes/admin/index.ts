import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/jwt';
import { requireAdmin } from '../../middleware/admin-auth';
import { dashboardOverviewHandler } from './dashboard';

/**
 * Admin routes
 *
 * All routes under /api/admin are protected by authenticate and requireAdmin middleware.
 * - authenticate: Verifies JWT and populates request.user
 * - requireAdmin: Verifies the user has admin role and logs all actions to audit trail
 */
export async function adminRoutes(app: FastifyInstance) {
  // All routes require authentication and admin role
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireAdmin);

  // Dashboard routes
  app.get('/dashboard/overview', dashboardOverviewHandler);
}
