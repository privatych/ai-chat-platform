import { db, modelPricing, usageLogs, UsageLog } from '@ai-chat/database';
import { eq } from 'drizzle-orm';

export interface LogUsageParams {
  userId: string;
  eventType: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  metadata?: Record<string, any>;
}

/**
 * Calculates the cost for a given model and token usage
 * @param model - The model identifier (e.g., 'gpt-4-turbo', 'claude-3-opus')
 * @param tokensInput - Number of input tokens
 * @param tokensOutput - Number of output tokens
 * @returns The calculated cost in USD
 * @throws Error if model pricing is not found
 */
export async function calculateCost(
  model: string,
  tokensInput: number,
  tokensOutput: number
): Promise<number> {
  // Query the model pricing table
  const pricingData = await db
    .select()
    .from(modelPricing)
    .where(eq(modelPricing.modelId, model));

  if (!pricingData || pricingData.length === 0) {
    throw new Error(`Model pricing not found for: ${model}`);
  }

  const pricing = pricingData[0];

  // Convert decimal strings to numbers and calculate cost
  const inputCost = tokensInput * parseFloat(pricing.pricePerInputToken);
  const outputCost = tokensOutput * parseFloat(pricing.pricePerOutputToken);

  return inputCost + outputCost;
}

/**
 * Logs API usage to the database with cost calculation
 * @param params - The usage log parameters
 * @returns The created usage log record
 * @throws Error if model pricing is not found
 */
export async function logUsage(params: LogUsageParams): Promise<UsageLog> {
  const { userId, eventType, model, tokensInput, tokensOutput, metadata } = params;

  // Calculate the cost using the calculateCost function
  const cost = await calculateCost(model, tokensInput, tokensOutput);

  // Calculate total tokens
  const tokensTotal = tokensInput + tokensOutput;

  // Format cost to 6 decimal places for database
  const costUsd = cost.toFixed(6);

  // Insert into usage_logs table
  const result = await db
    .insert(usageLogs)
    .values({
      userId,
      eventType,
      model,
      tokensInput,
      tokensOutput,
      tokensTotal,
      costUsd,
      metadata: metadata || null,
    })
    .returning();

  return result[0];
}
