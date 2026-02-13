'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { FileUpload, Attachment } from './FileUpload';
import { AI_MODELS } from '@ai-chat/shared';
import { toast } from 'sonner';

interface MessageInputProps {
  chatId: string;
  selectedModel: string;
  onMessagesUpdate: (updater: (prev: any[]) => any[]) => void;
  onStreamingChange: (streaming: boolean) => void;
  onMessageLimitExceeded?: () => void;
}

export function MessageInput({
  chatId,
  selectedModel,
  onMessagesUpdate,
  onStreamingChange,
  onMessageLimitExceeded,
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const currentModel = [...AI_MODELS.free, ...AI_MODELS.premium].find(
    m => m.id === selectedModel
  );
  const supportsVision = currentModel?.supportsVision || false;
  const supportsFiles = currentModel?.supportsFiles || false;

  // Clear incompatible attachments when model changes
  useEffect(() => {
    if (attachments.length === 0) return;

    const incompatibleAttachments = attachments.filter(att => {
      if (att.type === 'image' && !supportsVision) return true;
      if (att.type === 'file' && !supportsFiles) return true;
      return false;
    });

    if (incompatibleAttachments.length > 0) {
      const compatibleAttachments = attachments.filter(att => {
        if (att.type === 'image') return supportsVision;
        if (att.type === 'file') return supportsFiles;
        return false;
      });

      setAttachments(compatibleAttachments);

      const removedNames = incompatibleAttachments.map(a => a.name).join(', ');
      toast.warning(
        `Файлы удалены: ${removedNames}. Текущая модель не поддерживает эти типы файлов.`
      );
    }
  }, [selectedModel, supportsVision, supportsFiles]);

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
    } catch (error: any) {
      console.error('[MessageInput] Error streaming message:', error);

      // Check if this is a message limit exceeded error
      if (error.status === 429 || error.code === 'MESSAGE_LIMIT_EXCEEDED') {
        // Remove the user message since it wasn't sent
        onMessagesUpdate((prev: any[]) => {
          return prev.filter((m) => m.id !== userMessage.id && m.id !== assistantMessage.id);
        });

        // Show the limit modal
        if (onMessageLimitExceeded) {
          onMessageLimitExceeded();
        }

        // Restore the input text so user doesn't lose it
        setInput(userMessage.content);
      } else {
        // For other errors, show error message
        onMessagesUpdate((prev: any[]) => {
          const filtered = prev.filter((m) => m.id !== assistantMessage.id);
          return [...filtered, {
            ...assistantMessage,
            content: 'Ошибка при получении ответа. Попробуйте еще раз.',
          }];
        });
      }

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
          attachments={attachments}
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
