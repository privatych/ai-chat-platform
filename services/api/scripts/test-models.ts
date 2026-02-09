import 'dotenv/config';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS_TO_TEST = [
  // Free models
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },

  // Premium models
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
];

async function testModel(modelId: string, modelName: string) {
  console.log(`\n🧪 Testing ${modelName} (${modelId})...`);

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
      console.error(`❌ FAILED - HTTP ${response.status}: ${errorText}`);
      return {
        model: modelId,
        name: modelName,
        status: 'error',
        error: `HTTP ${response.status}`,
        message: errorText,
      };
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'No response';

    console.log(`✅ SUCCESS - Response: ${answer}`);

    return {
      model: modelId,
      name: modelName,
      status: 'success',
      response: answer,
    };
  } catch (error: any) {
    console.error(`❌ FAILED - Error: ${error.message}`);
    return {
      model: modelId,
      name: modelName,
      status: 'error',
      error: error.message,
    };
  }
}

async function testAllModels() {
  console.log('🚀 Starting model tests...\n');
  console.log('API Key:', OPENROUTER_API_KEY ? '✓ Set' : '✗ Not set');

  if (!OPENROUTER_API_KEY) {
    console.error('\n❌ OPENROUTER_API_KEY is not set in .env file');
    process.exit(1);
  }

  const results = [];

  for (const model of MODELS_TO_TEST) {
    const result = await testModel(model.id, model.name);
    results.push(result);

    // Wait 1 second between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 Summary:\n');
  console.log('Working models:');
  results
    .filter(r => r.status === 'success')
    .forEach(r => {
      console.log(`  ✅ ${r.name} (${r.model})`);
      console.log(`     Response: ${r.response?.substring(0, 100)}...`);
    });

  console.log('\nFailed models:');
  results
    .filter(r => r.status === 'error')
    .forEach(r => {
      console.log(`  ❌ ${r.name} (${r.model})`);
      console.log(`     Error: ${r.error}`);
    });

  console.log('\n');
  process.exit(0);
}

testAllModels();
