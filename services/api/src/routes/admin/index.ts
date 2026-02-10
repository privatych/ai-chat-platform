import { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/admin-auth';
import { dashboardOverviewHandler } from './dashboard';

/**
 * Admin routes
 *
 * All routes under /api/admin are protected by requireAdmin middleware
 * which verifies the user has admin role and logs all actions to audit trail.
 */
export async function adminRoutes(app: FastifyInstance) {
  // Dashboard routes
  app.get('/dashboard/overview', {
    preHandler: requireAdmin,
  }, dashboardOverviewHandler);
}
