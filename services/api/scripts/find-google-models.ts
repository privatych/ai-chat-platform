import 'dotenv/config';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function findGoogleModels() {
  console.log('🔍 Searching for available Google models on OpenRouter...\n');

  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
  });

  const data = await response.json();
  const models = data.data || [];

  const googleModels = models.filter((m: any) =>
    m.id.toLowerCase().includes('google') ||
    m.id.toLowerCase().includes('gemini')
  );

  console.log('Available Google/Gemini models:\n');
  googleModels.forEach((model: any) => {
    console.log(`ID: ${model.id}`);
    console.log(`Name: ${model.name}`);
    console.log(`Context: ${model.context_length} tokens`);
    console.log(`Pricing: $${model.pricing?.prompt} per token\n`);
  });

  console.log(`\nTotal found: ${googleModels.length} models`);
}

findGoogleModels();
