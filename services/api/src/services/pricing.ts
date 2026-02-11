/**
 * Pricing Service
 *
 * Fetches and caches model pricing from OpenRouter API
 * Calculates costs based on token usage
 */

import { getEnv } from '../config/env';

interface ModelPricing {
  prompt: string;
  completion: string;
  image?: string;
  audio?: string;
  web_search?: string;
  input_cache_read?: string;
  input_cache_write?: string;
  internal_reasoning?: string;
}

interface PricingCache {
  [modelId: string]: ModelPricing;
}

let pricingCache: PricingCache | null = null;
let lastFetched: number = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch pricing data from OpenRouter API
 */
async function fetchPricing(): Promise<PricingCache> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${getEnv('OPENROUTER_API_KEY')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pricing: ${response.statusText}`);
    }

    const data = await response.json();
    const pricing: PricingCache = {};

    for (const model of data.data) {
      if (model.pricing) {
        pricing[model.id] = model.pricing;
      }
    }

    pricingCache = pricing;
    lastFetched = Date.now();

    console.log(`[Pricing] Loaded pricing for ${Object.keys(pricing).length} models`);
    return pricing;
  } catch (error) {
    console.error('[Pricing] Failed to fetch pricing:', error);

    // Return fallback pricing for our models if API fails
    return getFallbackPricing();
  }
}

/**
 * Fallback pricing for common models (current as of 2026-02-11)
 */
function getFallbackPricing(): PricingCache {
  return {
    'openai/gpt-3.5-turbo': {
      prompt: '0.0000005',
      completion: '0.0000015',
    },
    'openai/gpt-4o': {
      prompt: '0.0000025',
      completion: '0.00001',
    },
    'anthropic/claude-3.5-sonnet': {
      prompt: '0.000006',
      completion: '0.00003',
    },
    'google/gemini-2.0-flash-001': {
      prompt: '0.0000001',
      completion: '0.0000004',
    },
    'google/gemini-2.5-pro': {
      prompt: '0.00000125',
      completion: '0.00001',
    },
    'meta-llama/llama-3.1-8b-instruct': {
      prompt: '0.00000002',
      completion: '0.00000005',
    },
    'meta-llama/llama-3.3-70b-instruct': {
      prompt: '0.0000001',
      completion: '0.00000032',
    },
  };
}

/**
 * Get pricing for a specific model
 */
export async function getModelPricing(modelId: string): Promise<ModelPricing | null> {
  // Check if cache is valid
  if (!pricingCache || Date.now() - lastFetched > CACHE_TTL) {
    await fetchPricing();
  }

  return pricingCache?.[modelId] || null;
}

/**
 * Calculate cost in USD based on tokens used
 *
 * @param modelId - OpenRouter model ID
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output/completion tokens
 * @returns Cost in USD, or null if pricing not available
 */
export async function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): Promise<number | null> {
  const pricing = await getModelPricing(modelId);

  if (!pricing) {
    console.warn(`[Pricing] No pricing found for model: ${modelId}`);
    return null;
  }

  const promptCost = promptTokens * parseFloat(pricing.prompt);
  const completionCost = completionTokens * parseFloat(pricing.completion);
  const totalCost = promptCost + completionCost;

  console.log(`[Pricing] Model: ${modelId}, Prompt: ${promptTokens} tokens ($${promptCost.toFixed(6)}), Completion: ${completionTokens} tokens ($${completionCost.toFixed(6)}), Total: $${totalCost.toFixed(6)}`);

  return totalCost;
}

/**
 * Initialize pricing cache on server start
 */
export async function initializePricing() {
  console.log('[Pricing] Initializing pricing service...');
  await fetchPricing();
}
