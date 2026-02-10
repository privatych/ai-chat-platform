import 'dotenv/config';
import { db } from '../src';
import { modelPricing } from '../src/schema/model-pricing';

/**
 * Seed model pricing data for common AI models
 * Prices are per token in USD (e.g., 0.00001 = $0.01 per 1000 tokens)
 */
const modelPricingData = [
  {
    modelId: 'gpt-4',
    pricePerInputToken: '0.0000300000',
    pricePerOutputToken: '0.0000600000',
    isActive: true,
  },
  {
    modelId: 'gpt-4-turbo',
    pricePerInputToken: '0.0000100000',
    pricePerOutputToken: '0.0000300000',
    isActive: true,
  },
  {
    modelId: 'gpt-3.5-turbo',
    pricePerInputToken: '0.0000005000',
    pricePerOutputToken: '0.0000015000',
    isActive: true,
  },
  {
    modelId: 'claude-3-opus-20240229',
    pricePerInputToken: '0.0000150000',
    pricePerOutputToken: '0.0000750000',
    isActive: true,
  },
  {
    modelId: 'claude-3-sonnet-20240229',
    pricePerInputToken: '0.0000030000',
    pricePerOutputToken: '0.0000150000',
    isActive: true,
  },
  {
    modelId: 'claude-3-haiku-20240307',
    pricePerInputToken: '0.0000002500',
    pricePerOutputToken: '0.0000012500',
    isActive: true,
  },
  {
    modelId: 'gemini-pro',
    pricePerInputToken: '0.0000005000',
    pricePerOutputToken: '0.0000015000',
    isActive: true,
  },
];

async function seedModelPricing() {
  console.log('Seeding model pricing data...');
  console.log('---');

  try {
    for (const model of modelPricingData) {
      console.log(`Inserting pricing for: ${model.modelId}`);

      await db
        .insert(modelPricing)
        .values(model)
        .onConflictDoUpdate({
          target: modelPricing.modelId,
          set: {
            pricePerInputToken: model.pricePerInputToken,
            pricePerOutputToken: model.pricePerOutputToken,
            isActive: model.isActive,
            updatedAt: new Date(),
          },
        });

      console.log(`✓ ${model.modelId} - Input: $${model.pricePerInputToken}/token, Output: $${model.pricePerOutputToken}/token`);
    }

    console.log('---');
    console.log(`✅ Successfully seeded ${modelPricingData.length} model pricing records`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding model pricing:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

seedModelPricing();
