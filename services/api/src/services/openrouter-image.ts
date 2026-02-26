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

  console.log('[OpenRouter] Generating image:', {
    model: req.model,
    prompt: req.prompt.substring(0, 50) + '...',
    resolution: `${req.width}x${req.height}`,
  });

  try {
    // OpenRouter uses chat completions endpoint with modalities for image generation
    const response = await axios.post(
      `${OPENROUTER_API}/chat/completions`,
      {
        model: req.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: req.prompt,
              },
            ],
          },
        ],
        modalities: ['image'], // Request image output
        image_config: {
          width: req.width,
          height: req.height,
          negative_prompt: req.negativePrompt,
          steps: req.steps || 20,
        },
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
  const megapixels = (width * height) / 1_000_000;

  const modelCosts: Record<string, number> = {
    // Free tier models
    'black-forest-labs/flux.2-klein-4b': 0.01,
    'google/gemini-2.5-flash-image': 0.005,
    'sourceful/riverflow-v2-fast': 0.008,
    // Premium tier models
    'black-forest-labs/flux.2-max': 0.07,
    'black-forest-labs/flux.2-pro': 0.03,
    'black-forest-labs/flux.2-flex': 0.025,
    'openai/gpt-5-image': 0.08,
    'sourceful/riverflow-v2-pro': 0.02,
  };

  return (modelCosts[model] || 0.01) * megapixels;
}
