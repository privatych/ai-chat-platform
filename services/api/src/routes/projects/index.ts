import { FastifyInstance } from 'fastify';
import { createProjectHandler } from './create';
import { listProjectsHandler } from './list';
import { getProjectHandler } from './get';
import { updateProjectHandler } from './update';
import { deleteProjectHandler } from './delete';
import { contextRoutes } from './context';
import { authenticate } from '../../plugins/jwt';

export async function projectRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('preHandler', authenticate);

  app.post('/projects', createProjectHandler);
  app.get('/projects', listProjectsHandler);
  app.get('/projects/:projectId', getProjectHandler);
  app.patch('/projects/:projectId', updateProjectHandler);
  app.delete('/projects/:projectId', deleteProjectHandler);

  // Register context sub-routes
  await contextRoutes(app);
}
