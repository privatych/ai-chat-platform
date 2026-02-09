import { FastifyInstance } from 'fastify';
import { createSectionHandler } from './create-section';
import { listSectionsHandler } from './list-sections';
import { updateSectionHandler } from './update-section';
import { deleteSectionHandler } from './delete-section';
import { extractTextHandler } from './extract-text';

export async function contextRoutes(server: FastifyInstance) {
  server.post('/projects/:projectId/context/sections', createSectionHandler);
  server.get('/projects/:projectId/context/sections', listSectionsHandler);
  server.put('/projects/:projectId/context/sections/:id', updateSectionHandler);
  server.delete('/projects/:projectId/context/sections/:id', deleteSectionHandler);
  server.post('/projects/:projectId/context/extract-text', extractTextHandler);
}
