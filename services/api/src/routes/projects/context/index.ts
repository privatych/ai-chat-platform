import { FastifyInstance } from 'fastify';
import { createSectionHandler } from './create-section';
import { listSectionsHandler } from './list-sections';
import { updateSectionHandler } from './update-section';
import { extractTextHandler } from './extract-text';

export async function contextRoutes(server: FastifyInstance) {
  server.post('/projects/:projectId/context/sections', createSectionHandler);
  server.get('/projects/:projectId/context/sections', listSectionsHandler);
  server.put('/projects/:projectId/context/sections/:id', updateSectionHandler);
  server.post('/projects/:projectId/context/extract-text', extractTextHandler);
}
