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

// Helper to convert width/height to aspect ratio
function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  return `${w}:${h}`;
}

// Helper to determine image size
function getImageSize(width: number, height: number): string {
  const pixels = width * height;
  if (pixels >= 4000000) return '4K'; // 4K ~= 2048x2048 or higher
  if (pixels >= 2000000) return '2K'; // 2K ~= 1448x1448 or higher
  if (pixels >= 500000) return '1K';  // 1K ~= 1024x1024
  return '0.5K';
}

export async function generateImage(
  req: GenerateImageRequest
): Promise<GenerateImageResponse> {
  const apiKey = getEnv('OPENROUTER_API_KEY');

  console.log('[OpenRouter] Generating image:', {
    model: req.model,
    prompt: req.prompt.substring(0, 50) + '...',
    resolution: `${req.width}x${req.height}`,
    aspectRatio: getAspectRatio(req.width, req.height),
    imageSize: getImageSize(req.width, req.height),
  });

  try {
    // Build prompt with negative prompt if provided
    const fullPrompt = req.negativePrompt
      ? `${req.prompt}\n\nNegative prompt: ${req.negativePrompt}`
      : req.prompt;

    // OpenRouter uses chat completions endpoint with modalities for image generation
    const response = await axios.post(
      `${OPENROUTER_API}/chat/completions`,
      {
        model: req.model,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        modalities: ['image'], // Request image output
        aspect_ratio: getAspectRatio(req.width, req.height),
        image_size: getImageSize(req.width, req.height),
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://ai.itoq.ru',
          'X-Title': 'AI Chat Platform',
          'Content-Type': 'application/json',
        },
        timeout: 90000, // 90 seconds for image generation
      }
    );

    console.log('[OpenRouter] Generation successful');
    console.log('[OpenRouter] Response structure:', JSON.stringify({
      hasChoices: !!response.data.choices,
      choicesLength: response.data.choices?.length,
      hasMessage: !!response.data.choices?.[0]?.message,
      hasImages: !!response.data.choices?.[0]?.message?.images,
      imagesLength: response.data.choices?.[0]?.message?.images?.length,
      imageType: typeof response.data.choices?.[0]?.message?.images?.[0],
    }, null, 2));

    // OpenRouter returns base64 encoded images in the images field
    const imageData = response.data.choices[0].message.images?.[0];
    if (!imageData) {
      console.error('[OpenRouter] No image data found. Full response:', JSON.stringify(response.data, null, 2));
      throw new Error('No image data in response');
    }

    console.log('[OpenRouter] Image data type:', typeof imageData);
    console.log('[OpenRouter] Image data preview:',
      typeof imageData === 'string' ? imageData.substring(0, 100) : JSON.stringify(imageData, null, 2));

    const cost = calculateCost(req.model, req.width, req.height);

    // OpenRouter returns image in format: { type: "image_url", image_url: { url: "data:..." } }
    let imageUrl: string;
    if (typeof imageData === 'string') {
      imageUrl = imageData;
    } else if (imageData.image_url?.url) {
      imageUrl = imageData.image_url.url;
    } else if (imageData.url) {
      imageUrl = imageData.url;
    } else {
      console.error('[OpenRouter] Cannot extract image URL from:', JSON.stringify(imageData, null, 2));
      throw new Error('Invalid image data format');
    }

    console.log('[OpenRouter] Extracted image URL type:', typeof imageUrl);
    console.log('[OpenRouter] Image URL starts with:', imageUrl.substring(0, 30));

    return { imageUrl, cost };
  } catch (error: any) {
    console.error('[OpenRouter] Generation failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: JSON.stringify(error.response?.data, null, 2),
    });

    if (error.response?.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (error.response?.status === 402 || error.response?.status === 401) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    throw new Error(`GENERATION_FAILED: ${error.response?.data?.error?.message || error.message}`);
  }
}

export function calculateCost(model: string, width: number, height: number): number {
  // Cost per completion token from OpenRouter API
  const modelCosts: Record<string, number> = {
    // Google models (per completion token)
    'google/gemini-2.5-flash-image': 0.0000025,
    'google/gemini-3.1-flash-image-preview': 0.0000015,
    'google/gemini-3-pro-image-preview': 0.000012,
    // OpenAI models (per completion token)
    'openai/gpt-5-image-mini': 0.000002,
    'openai/gpt-5-image': 0.00001,
  };

  // Estimate ~1000 completion tokens for image generation
  const estimatedTokens = 1000;
  const costPerToken = modelCosts[model] || 0.000001;

  return costPerToken * estimatedTokens;
}
