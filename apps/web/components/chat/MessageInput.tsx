'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface MessageInputProps {
  chatId: string;
  onMessagesUpdate: (updater: (prev: any[]) => any[]) => void;
  onStreamingChange: (streaming: boolean) => void;
}

export function MessageInput({
  chatId,
  onMessagesUpdate,
  onStreamingChange,
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: input };

    setIsLoading(true);
    onStreamingChange(true);

    // Add user message
    onMessagesUpdate((prev: any[]) => [...prev, userMessage]);
    setInput('');

    let assistantContent = '';
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: '',
    };

    try {
      await apiClient.streamMessage(
        chatId,
        userMessage.content,
        (chunk) => {
          assistantContent += chunk;
          assistantMessage.content = assistantContent;
          onMessagesUpdate((prev: any[]) => {
            const filtered = prev.filter((m) => m.id !== assistantMessage.id);
            return [...filtered, { ...assistantMessage }];
          });
        },
        () => {
          onStreamingChange(false);
          setIsLoading(false);
        }
      );
    } catch (error) {
      onStreamingChange(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border-t">
      <div className="flex gap-2 max-w-3xl mx-auto">
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
  );
}
