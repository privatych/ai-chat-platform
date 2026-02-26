import { FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs/promises';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'images');

interface ServeImageParams {
  userId: string;
  filename: string;
}

interface ServeImageQuery {
  download?: string;
}

export async function serveImageHandler(
  request: FastifyRequest<{ Params: ServeImageParams; Querystring: ServeImageQuery }>,
  reply: FastifyReply
) {
  try {
    const { userId, filename } = request.params;
    const { download } = request.query;
    
    // Security: validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return reply.code(400).send({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(UPLOAD_DIR, userId, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return reply.code(404).send({ error: 'Image not found' });
    }
    
    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    
    // Set headers
    reply.type('image/png');
    reply.header('Cache-Control', 'public, max-age=31536000');
    
    // If download parameter is present, add Content-Disposition header
    if (download !== undefined) {
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    return reply.send(fileBuffer);
      
  } catch (error) {
    console.error('Error serving image:', error);
    return reply.code(500).send({ error: 'Failed to serve image' });
  }
}
