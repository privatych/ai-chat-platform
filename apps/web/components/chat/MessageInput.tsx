'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { FileUpload, Attachment } from './FileUpload';
import { AI_MODELS } from '@ai-chat/shared';

interface MessageInputProps {
  chatId: string;
  selectedModel: string;
  onMessagesUpdate: (updater: (prev: any[]) => any[]) => void;
  onStreamingChange: (streaming: boolean) => void;
}

export function MessageInput({
  chatId,
  selectedModel,
  onMessagesUpdate,
  onStreamingChange,
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const currentModel = [...AI_MODELS.free, ...AI_MODELS.premium].find(
    m => m.id === selectedModel
  );
  const supportsVision = currentModel?.supportsVision || false;
  const supportsFiles = currentModel?.supportsFiles || false;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setIsLoading(true);
    onStreamingChange(true);

    // Add user message
    onMessagesUpdate((prev: any[]) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);

    let assistantContent = '';
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: '',
    };

    try {
      console.log('[MessageInput] Sending message to chat:', chatId, 'with model:', selectedModel);
      await apiClient.streamMessage(
        chatId,
        userMessage.content,
        selectedModel,
        attachments,
        (chunk) => {
          console.log('[MessageInput] Received chunk:', chunk);
          assistantContent += chunk;
          assistantMessage.content = assistantContent;
          onMessagesUpdate((prev: any[]) => {
            const filtered = prev.filter((m) => m.id !== assistantMessage.id);
            return [...filtered, { ...assistantMessage }];
          });
        },
        (tokensUsed) => {
          console.log('[MessageInput] Stream complete, tokens:', tokensUsed);
          onStreamingChange(false);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('[MessageInput] Error streaming message:', error);
      onMessagesUpdate((prev: any[]) => {
        const filtered = prev.filter((m) => m.id !== assistantMessage.id);
        return [...filtered, {
          ...assistantMessage,
          content: 'Ошибка при получении ответа. Попробуйте еще раз.',
        }];
      });
      onStreamingChange(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border-t">
      <div className="flex flex-col gap-2 max-w-3xl mx-auto">
        <FileUpload
          onAttachmentsChange={setAttachments}
          supportsVision={supportsVision}
          supportsFiles={supportsFiles}
          disabled={isLoading}
        />
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
