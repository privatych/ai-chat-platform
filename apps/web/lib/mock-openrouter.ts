// Mock OpenRouter service for development
// Simulates streaming responses from different AI models

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const MODEL_RESPONSES: Record<string, string[]> = {
  'gpt-4o-mini': [
    'I understand your question. Let me help you with that.',
    'Based on my analysis, here are some key points to consider.',
    'This is a great question! Here is what I think about it.',
  ],
  'gpt-4o': [
    'Thank you for your thoughtful question. Allow me to provide a comprehensive response.',
    'I have analyzed your query carefully. Here is my detailed perspective.',
    'This is an interesting topic. Let me share my insights with you.',
  ],
  'claude-3-haiku': [
    'Hi there! I am happy to help you with this.',
    'Great question! Let me give you a quick answer.',
    'Sure thing! Here is what you need to know.',
  ],
  'claude-3.5-sonnet': [
    'I appreciate your question. Let me think through this carefully.',
    'This is a nuanced topic. Here is my thoughtful analysis.',
    'Thank you for asking. I will do my best to provide a helpful response.',
  ],
  'gemini-1.5-flash': [
    'Hello! I am Gemini, and I am here to assist you.',
    'That is an interesting question. Here is my take on it.',
    'Let me help you understand this better.',
  ],
  'gemini-1.5-pro': [
    'I have carefully considered your question. Here is my comprehensive response.',
    'This requires some in-depth analysis. Let me break it down for you.',
    'Thank you for this thought-provoking question.',
  ],
  'deepseek-chat': [
    'As an AI assistant, I will help you with this query.',
    'Let me provide you with relevant information on this topic.',
    'I understand what you are asking. Here is my response.',
  ],
  'grok-2': [
    'Hey! Let me give you a straight answer on this.',
    'Interesting question! Here is my honest take.',
    'Let me cut to the chase and give you what you need.',
  ],
};

const LOREM_PARAGRAPHS = [
  'Artificial intelligence continues to evolve at a remarkable pace, transforming how we interact with technology and process information.',
  'When considering this topic, it is important to weigh multiple perspectives and examine the evidence carefully.',
  'The key to understanding this concept lies in breaking it down into smaller, more manageable components.',
  'I hope this explanation helps clarify things. Feel free to ask if you have any follow-up questions!',
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomResponse(model: string): string {
  const responses = MODEL_RESPONSES[model] || MODEL_RESPONSES['gpt-4o-mini'];
  const intro = responses[Math.floor(Math.random() * responses.length)];
  const body = LOREM_PARAGRAPHS.slice(0, 2 + Math.floor(Math.random() * 2)).join('\n\n');
  return `${intro}\n\n${body}`;
}

export async function* streamMockResponse(
  messages: Message[],
  model: string
): AsyncGenerator<string> {
  // Simulate initial delay (model loading)
  await delay(300);

  const response = getRandomResponse(model);
  const words = response.split(' ');

  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i < words.length - 1 ? ' ' : '');
    // Variable delay to simulate natural typing (30-80ms per word)
    await delay(30 + Math.random() * 50);
  }
}

export function getMockResponse(messages: Message[], model: string): string {
  return getRandomResponse(model);
}
