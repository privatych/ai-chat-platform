'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: any[];
}

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

function AttachmentDisplay({ attachment }: { attachment: any }) {
  if (attachment.type === 'image') {
    return (
      <div className="relative w-48 h-48 rounded overflow-hidden bg-muted my-2">
        <img
          src={`data:${attachment.mimeType};base64,${attachment.data}`}
          alt={attachment.name}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-secondary rounded-lg p-2 my-2 max-w-xs">
      <FileText className="w-5 h-5 text-muted-foreground" />
      <span className="text-sm">{attachment.name}</span>
    </div>
  );
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4 max-w-3xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.attachments.map((att: any, idx: number) => (
                    <AttachmentDisplay key={idx} attachment={att} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
