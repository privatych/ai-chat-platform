import { FastifyRequest, FastifyReply } from 'fastify';
import { generateImage } from '../../services/openrouter-image';
import { saveImage } from '../../services/image-storage';
import { checkImageLimit } from '../../middleware/image-limit';
import { db } from '@ai-chat/database';
import { imageGenerations } from '@ai-chat/database/schema';
import { IMAGE_LIMITS } from '@ai-chat/shared';
import { v4 as uuidv4 } from 'uuid';

interface GenerateRequest {
  model: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

export async function generateHandler(
  request: FastifyRequest<{ Body: GenerateRequest }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any).id;
    const tier = (request.user as any).subscriptionTier as 'free' | 'premium';
    const { model, prompt, negativePrompt, width = 1024, height = 1024 } = request.body;

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return reply.code(400).send({ error: 'Prompt is required' });
    }

    if (prompt.length > 1000) {
      return reply.code(400).send({ error: 'Prompt too long (max 1000 characters)' });
    }

    // Check tier limits
    const limits = IMAGE_LIMITS[tier];

    if (!limits.allowedModels.includes(model)) {
      return reply.code(403).send({ error: 'Model not available for your tier' });
    }

    if (width > limits.maxResolution || height > limits.maxResolution) {
      return reply.code(403).send({
        error: `Resolution exceeds limit (${limits.maxResolution}x${limits.maxResolution})`
      });
    }

    // Check daily limit
    await checkImageLimit(userId, tier);

    // Generate image
    const generationId = uuidv4();
    const result = await generateImage({
      model,
      prompt,
      negativePrompt,
      width,
      height,
    });

    // Save image to local storage
    const imageUrl = await saveImage(result.imageUrl, userId, generationId);

    // Save to database
    await db.insert(imageGenerations).values({
      id: generationId,
      userId,
      model,
      prompt,
      negativePrompt: negativePrompt || null,
      width,
      height,
      imageUrl,
      cost: result.cost.toString(),
    });

    return reply.send({
      success: true,
      data: {
        id: generationId,
        imageUrl: `https://ai.itoq.ru${imageUrl}`,
        cost: result.cost,
      },
    });

  } catch (error: any) {
    console.error('Image generation error:', error);

    if (error.message === 'DAILY_LIMIT_REACHED') {
      return reply.code(429).send({
        error: 'Daily generation limit reached. Upgrade to Premium or wait until tomorrow.'
      });
    }

    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return reply.code(429).send({
        error: 'OpenRouter rate limit exceeded. Please try again in a minute.'
      });
    }

    return reply.code(500).send({ error: 'Image generation failed' });
  }
}
