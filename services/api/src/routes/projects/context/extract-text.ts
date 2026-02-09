import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { extractTextFromFile } from '../../../utils/text-extractor';

const extractTextSchema = z.object({
  file: z.object({
    name: z.string(),
    mimeType: z.string(),
    data: z.string(),
  }),
});

export async function extractTextHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = extractTextSchema.parse(request.body);

  try {
    const extractedText = await extractTextFromFile(body.file);

    return reply.send({
      success: true,
      data: {
        extractedText,
      },
    });
  } catch (error: any) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'EXTRACTION_FAILED',
        message: error.message || 'Failed to extract text',
      },
    });
  }
}
