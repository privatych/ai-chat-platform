import { z } from 'zod';
import { extractTextFromFile } from '../utils/text-extractor';
import { getEnv } from '../config/env';

const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
}

interface Attachment {
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  data: string;
  size: number;
}

export async function formatMessageWithAttachments(
  content: string,
  attachments?: Attachment[]
): Promise<string | MessageContent[]> {
  if (!attachments || attachments.length === 0) {
    return content;
  }

  const contentParts: MessageContent[] = [
    { type: 'text', text: content }
  ];

  for (const attachment of attachments) {
    if (attachment.type === 'image') {
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: `data:${attachment.mimeType};base64,${attachment.data}`
        }
      });
    } else if (attachment.type === 'file') {
      // Extract text from PDF/TXT/JSON files
      try {
        const extractedText = await extractTextFromFile({
          name: attachment.name,
          mimeType: attachment.mimeType,
          data: attachment.data,
          size: attachment.size,
        });

        contentParts.push({
          type: 'text',
          text: `\n\n=== File: ${attachment.name} ===\n${extractedText}\n=== End of file ===\n`
        });
      } catch (error: any) {
        console.error(`Failed to extract text from ${attachment.name}:`, error);
        contentParts.push({
          type: 'text',
          text: `\n\n[File: ${attachment.name} - Failed to extract text: ${error.message}]\n`
        });
      }
    }
  }

  return contentParts;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export async function streamChatCompletion(
  model: string,
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: (tokenUsage: TokenUsage) => void
) {
  console.log('[OpenRouter] Sending request:', { model, messageCount: messages.length });

  const response = await fetch(openRouterUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getEnv('OPENROUTER_API_KEY')}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.WEB_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OpenRouter] API error:', response.status, errorText);
    throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
  }

  console.log('[OpenRouter] Response received, starting stream');

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  let buffer = '';
  let tokenUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);

        if (data === '[DONE]') {
          onDone(tokenUsage);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;

          if (content) {
            onChunk(content);
          }

          // Capture token usage breakdown from OpenRouter API
          if (parsed.usage) {
            tokenUsage = {
              promptTokens: parsed.usage.prompt_tokens || 0,
              completionTokens: parsed.usage.completion_tokens || 0,
              totalTokens: parsed.usage.total_tokens || 0,
            };
          }

          // Check for errors in response
          if (parsed.error) {
            console.error('[OpenRouter] Stream error:', parsed.error);
            throw new Error(parsed.error.message || 'OpenRouter API error');
          }
        } catch (e) {
          if (e instanceof Error && e.message.includes('OpenRouter')) {
            throw e;
          }
          // Skip invalid JSON
        }
      }
    }
  }

  onDone(tokenUsage);
}
