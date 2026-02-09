import 'dotenv/config';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function checkVisionSupport() {
  console.log('🔍 Checking vision support for our models...\n');

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
  });

  const data = await response.json();
  const models = data.data || [];

  const ourModels = [
    'openai/gpt-3.5-turbo',
    'google/gemini-2.0-flash-001',
    'meta-llama/llama-3.1-8b-instruct',
    'openai/gpt-4-turbo',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-2.5-pro',
    'meta-llama/llama-3.3-70b-instruct',
  ];

  console.log('Model Vision Support:\n');

  ourModels.forEach(modelId => {
    const model = models.find((m: any) => m.id === modelId);
    if (model) {
      const supportsVision = model.architecture?.modality?.includes('image') ||
                            model.architecture?.modality?.includes('multimodal');
      const icon = supportsVision ? '✅' : '❌';
      console.log(`${icon} ${model.name}`);
      console.log(`   ID: ${modelId}`);
      console.log(`   Modality: ${model.architecture?.modality || 'text'}`);
      console.log('');
    }
  });

  // Find other vision models
  console.log('\n🎨 Other popular vision models:\n');

  const visionModels = models.filter((m: any) =>
    (m.architecture?.modality?.includes('image') ||
     m.architecture?.modality?.includes('multimodal')) &&
    (m.id.includes('gpt-4') || m.id.includes('claude') || m.id.includes('gemini'))
  ).slice(0, 10);

  visionModels.forEach((model: any) => {
    console.log(`✅ ${model.name}`);
    console.log(`   ID: ${model.id}`);
    console.log(`   Modality: ${model.architecture?.modality}`);
    console.log('');
  });
}

checkVisionSupport();
