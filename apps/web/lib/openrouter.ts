// Real OpenRouter API integration
// Uses the OpenRouter API for AI model access

// Text-only message content
type TextContent = string;

// Multimodal content (text + images)
type MultimodalContent = Array<
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
>;

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: TextContent | MultimodalContent;
}

// Models that support vision (image input)
export const VISION_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3.5-sonnet',
  'claude-3-haiku',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// Model ID mapping from our internal IDs to OpenRouter model IDs
// See: https://openrouter.ai/models
const MODEL_MAPPING: Record<string, string> = {
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4o': 'openai/gpt-4o',
  'claude-3-haiku': 'anthropic/claude-3-haiku',
  'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
  'gemini-1.5-flash': 'google/gemini-flash-1.5',
  'gemini-1.5-pro': 'google/gemini-pro-1.5',
  'deepseek-chat': 'deepseek/deepseek-chat',
  'grok-2': 'x-ai/grok-3',
};

export function getOpenRouterModelId(internalId: string): string {
  return MODEL_MAPPING[internalId] || internalId;
}

export async function* streamOpenRouterResponse(
  messages: Message[],
  model: string
): AsyncGenerator<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const openRouterModel = getOpenRouterModelId(model);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'AI Chat Platform',
    },
    body: JSON.stringify({
      model: openRouterModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter API error:', error);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split by double newline (SSE format) or single newline
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('data: ')) {
        const data = trimmedLine.slice(6).trim();

        if (data === '[DONE]') {
          continue;
        }

        if (!data) continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;

          if (content) {
            yield content;
          }
        } catch (e) {
          // Skip invalid JSON - this can happen with partial chunks
          console.error('JSON parse error in OpenRouter stream:', e, 'Data:', data.substring(0, 100));
        }
      }
    }
  }
}

export async function getOpenRouterResponse(
  messages: Message[],
  model: string
): Promise<string> {
  let fullResponse = '';

  for await (const chunk of streamOpenRouterResponse(messages, model)) {
    fullResponse += chunk;
  }

  return fullResponse;
}

// Check if OpenRouter is configured
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
