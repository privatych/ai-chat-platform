import axios from 'axios';
import { getEnv } from '../config/env';

const OPENROUTER_API = 'https://openrouter.ai/api/v1';

interface GenerateImageRequest {
  model: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps?: number;
}

interface GenerateImageResponse {
  imageUrl: string;
  cost: number;
}

export async function generateImage(
  req: GenerateImageRequest
): Promise<GenerateImageResponse> {
  const apiKey = getEnv('OPENROUTER_API_KEY');

  try {
    const response = await axios.post(
      `${OPENROUTER_API}/images/generations`,
      {
        model: req.model,
        prompt: req.prompt,
        negative_prompt: req.negativePrompt,
        width: req.width,
        height: req.height,
        num_inference_steps: req.steps || 20,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://ai.itoq.ru',
          'X-Title': 'AI Chat Platform',
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const imageUrl = response.data.data[0].url;
    const cost = calculateCost(req.model, req.width, req.height);

    return { imageUrl, cost };
  } catch (error: any) {
    if (error.response?.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (error.response?.status === 402) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    throw new Error('GENERATION_FAILED');
  }
}

export function calculateCost(model: string, width: number, height: number): number {
  const megapixels = (width * height) / 1_000_000;

  const modelCosts: Record<string, number> = {
    'flux-2-pro': 0.03,
    'flux-2-max': 0.07,
    'flux-2-klein': 0.014,
    'flux-1-dev': 0.014,
    'flux-1-schnell': 0.003,
    'sdxl-turbo': 0.004,
    'playground-v2.5': 0.004,
    'realvisxl-v4': 0.005,
    'dreamshaper-xl': 0.006,
    'juggernaut-xl': 0.006,
    'anything-v5': 0.004,
    'novelai-diffusion': 0.008,
    'pastel-mix': 0.004,
    'sdxl-base': 0.008,
    'sd-3.5-large-turbo': 0.012,
    'openjourney-v4': 0.005,
    'architecture-xl': 0.006,
    'food-photography': 0.005,
    'landscape-xl': 0.005,
  };

  return (modelCosts[model] || 0.01) * megapixels;
}
