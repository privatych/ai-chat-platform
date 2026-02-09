import 'dotenv/config';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const NEW_MODELS = [
  // Free models
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', tier: 'Free' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', tier: 'Free' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', tier: 'Free' },

  // Premium models
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', tier: 'Premium' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', tier: 'Premium' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'Premium' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', tier: 'Premium' },
];

async function testModel(modelId: string, modelName: string, tier: string) {
  console.log(`\n🧪 Testing [${tier}] ${modelName} (${modelId})...`);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'user',
            content: 'Какая ты модель? Назови себя кратко (одно предложение).'
          }
        ],
        stream: false,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ FAILED - HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      return { model: modelId, name: modelName, tier, status: 'error', error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'No response';

    // Check if model identifies itself correctly
    const lowerAnswer = answer.toLowerCase();
    const correctIdentity =
      (modelId.includes('gpt') && (lowerAnswer.includes('gpt') || lowerAnswer.includes('openai'))) ||
      (modelId.includes('claude') && (lowerAnswer.includes('claude') || lowerAnswer.includes('anthropic'))) ||
      (modelId.includes('gemini') && lowerAnswer.includes('gemini')) ||
      (modelId.includes('llama') && (lowerAnswer.includes('llama') || lowerAnswer.includes('meta')));

    const statusIcon = correctIdentity ? '✅' : '⚠️';
    console.log(`   ${statusIcon} Response: ${answer}`);

    return { model: modelId, name: modelName, tier, status: 'success', response: answer, correctIdentity };
  } catch (error: any) {
    console.error(`   ❌ FAILED - Error: ${error.message}`);
    return { model: modelId, name: modelName, tier, status: 'error', error: error.message };
  }
}

async function testAllModels() {
  console.log('🚀 Testing NEW model configuration...\n');

  const results = [];

  for (const model of NEW_MODELS) {
    const result = await testModel(model.id, model.name, model.tier);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 Summary:\n');

  console.log('FREE TIER MODELS:');
  results
    .filter(r => r.tier === 'Free')
    .forEach(r => {
      const icon = r.status === 'success' ? (r.correctIdentity ? '✅' : '⚠️') : '❌';
      console.log(`  ${icon} ${r.name}`);
      if (r.status === 'success') {
        console.log(`     ${r.response?.substring(0, 80)}...`);
      } else {
        console.log(`     Error: ${r.error}`);
      }
    });

  console.log('\nPREMIUM TIER MODELS:');
  results
    .filter(r => r.tier === 'Premium')
    .forEach(r => {
      const icon = r.status === 'success' ? (r.correctIdentity ? '✅' : '⚠️') : '❌';
      console.log(`  ${icon} ${r.name}`);
      if (r.status === 'success') {
        console.log(`     ${r.response?.substring(0, 80)}...`);
      } else {
        console.log(`     Error: ${r.error}`);
      }
    });

  const successCount = results.filter(r => r.status === 'success').length;
  const correctIdCount = results.filter(r => r.status === 'success' && r.correctIdentity).length;

  console.log(`\n✅ ${successCount}/${results.length} models working`);
  console.log(`✅ ${correctIdCount}/${successCount} correctly identify themselves\n`);

  process.exit(0);
}

testAllModels();
