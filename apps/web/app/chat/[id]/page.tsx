'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useChat, useSendMessage, useModels, useUpdateChat, useCurrentUser } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import { useTranslation, getLocalizedText } from '@/lib/i18n';

interface Attachment {
  url: string;
  filename: string;
  type: string;
  size: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  attachments?: string;
  createdAt: string;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const { data, isLoading, refetch } = useChat(chatId);
  const { data: models } = useModels();
  const { data: user } = useCurrentUser();
  const sendMessage = useSendMessage(chatId);
  const updateChat = useUpdateChat(chatId);
  const { language, contextSize } = useUIStore();
  const t = useTranslation(language);

  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages: Message[] = data?.messages || [];
  const chat = data?.chat;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          alert(t.fileTooBig);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || 'Upload failed');
          continue;
        }

        const attachment = await response.json();
        setPendingAttachments((prev) => [...prev, attachment]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && pendingAttachments.length === 0) || isStreaming) return;

    const content = input.trim() || (pendingAttachments.length > 0 ? '[Attachments]' : '');
    const attachments = pendingAttachments.length > 0 ? [...pendingAttachments] : undefined;

    const savedInput = input;
    const savedAttachments = [...pendingAttachments];

    setInput('');
    setPendingAttachments([]);
    setStreamingContent('');
    setIsStreaming(true);

    try {
      await sendMessage.mutateAsync({
        content,
        attachments,
        contextSize,
        onChunk: (chunk: string) => {
          setStreamingContent((prev) => prev + chunk);
        },
      });
    } catch (error: any) {
      console.error('Failed to send message:', error);
      // Check if it's a premium model error
      if (error?.premiumRequired) {
        setShowUpgradeModal(true);
        // Restore input
        setInput(savedInput);
        setPendingAttachments(savedAttachments);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleModelChange = async (modelId: string) => {
    try {
      await updateChat.mutateAsync({ model: modelId });
      setShowModelSelector(false);
      refetch();
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    // Find the user message before this assistant message
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex <= 0) return;

    const userMessage = messages[msgIndex - 1];
    if (userMessage.role !== 'user') return;

    setRegeneratingId(messageId);
    setStreamingContent('');
    setIsStreaming(true);

    try {
      await sendMessage.mutateAsync({
        content: userMessage.content,
        contextSize,
        onChunk: (chunk: string) => {
          setStreamingContent((prev) => prev + chunk);
        },
      });
      refetch();
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setRegeneratingId(null);
    }
  };

  const getModelName = (modelId?: string) => {
    const model = models?.find((m: any) => m.id === modelId);
    return model?.name || modelId || 'AI';
  };

  const parseAttachments = (attachmentsStr?: string): Attachment[] => {
    if (!attachmentsStr) return [];
    try {
      return JSON.parse(attachmentsStr);
    } catch {
      return [];
    }
  };

  const isImageType = (type: string) => type.startsWith('image/');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-[#343541]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#10a37f] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">{t.loadingChat}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#343541]">
      {/* Model selector header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto flex justify-center">
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#40414f] rounded-lg transition-colors"
            >
              <span>{getModelName(chat?.model)}</span>
              <svg
                className={`w-4 h-4 transition-transform ${showModelSelector ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Model dropdown */}
            {showModelSelector && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowModelSelector(false)} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 bg-white dark:bg-[#2f2f2f] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
                  {models?.map((model: any) => {
                    const isPremium = model.tier === 'premium';
                    const isLocked = isPremium && user?.tier !== 'premium';

                    return (
                      <button
                        key={model.id}
                        onClick={() => !isLocked && handleModelChange(model.id)}
                        disabled={isLocked}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#40414f] flex items-center gap-3 ${
                          model.id === chat?.model ? 'bg-gray-100 dark:bg-[#40414f]' : ''
                        } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{model.name}</span>
                            {isPremium && (
                              <span className="text-xs bg-[#10a37f] text-white px-1.5 py-0.5 rounded font-medium">
                                PRO
                              </span>
                            )}
                            {isLocked && (
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {getLocalizedText(model.description, language)}
                          </p>
                        </div>
                        {model.id === chat?.model && (
                          <svg className="w-4 h-4 text-[#10a37f]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isStreaming ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#10a37f] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{t.startConversation}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {language === 'ru'
                  ? 'Начните диалог с AI. Задайте вопрос или поделитесь идеей.'
                  : 'Start a conversation with AI. Ask a question or share an idea.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((message) => {
              const attachments = parseAttachments(message.attachments);
              const isUser = message.role === 'user';

              return (
                <div
                  key={message.id}
                  className={`message-row ${isUser ? 'user' : 'assistant'}`}
                >
                  <div className="max-w-3xl mx-auto px-4 flex gap-4">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 ${
                      isUser ? 'bg-[#5436DA]' : 'bg-[#10a37f]'
                    }`}>
                      {isUser ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Attachments */}
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {attachments.map((attachment, idx) => (
                            <div key={idx}>
                              {isImageType(attachment.type) ? (
                                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={attachment.url}
                                    alt={attachment.filename}
                                    className="max-w-xs max-h-60 rounded-lg border border-gray-200 dark:border-gray-700"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#40414f] rounded-lg hover:bg-gray-200 dark:hover:bg-[#565869] transition-colors"
                                >
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{attachment.filename}</span>
                                  <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Text content */}
                      {message.content && message.content !== '[Attachments]' && (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-100 leading-relaxed m-0">{message.content}</p>
                        </div>
                      )}

                      {/* Action buttons for assistant messages */}
                      {!isUser && message.content && (
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() => handleCopy(message.content, message.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#40414f] rounded transition-colors"
                            title={language === 'ru' ? 'Копировать' : 'Copy'}
                          >
                            {copiedId === message.id ? (
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleRegenerate(message.id)}
                            disabled={isStreaming || regeneratingId === message.id}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#40414f] rounded transition-colors disabled:opacity-50"
                            title={language === 'ru' ? 'Перегенерировать' : 'Regenerate'}
                          >
                            {regeneratingId === message.id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Streaming message */}
            {isStreaming && (
              <div className="message-row assistant">
                <div className="max-w-3xl mx-auto px-4 flex gap-4">
                  <div className="w-8 h-8 rounded-sm bg-[#10a37f] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {streamingContent ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-100 leading-relaxed m-0">
                          {streamingContent}
                          <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-400 animate-pulse" />
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-1 py-2">
                        <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#343541]">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2">
              {pendingAttachments.map((attachment, idx) => (
                <div key={idx} className="relative group">
                  {isImageType(attachment.type) ? (
                    <img
                      src={attachment.url}
                      alt={attachment.filename}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-16 h-16 flex flex-col items-center justify-center bg-gray-100 dark:bg-[#40414f] rounded-lg">
                      <svg className="w-5 h-5 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs text-gray-500 truncate max-w-14 px-1">{attachment.filename.split('.').pop()}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 bg-white dark:bg-[#343541]">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-white dark:bg-[#40414f] border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm">
            {/* File upload button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || isUploading}
              className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={t.attachFile}
            >
              {isUploading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              )}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.typeMessage}
              disabled={isStreaming}
              rows={1}
              className="flex-1 resize-none py-3 pr-12 bg-transparent border-0 focus:outline-none focus:ring-0 disabled:cursor-not-allowed text-gray-800 dark:text-gray-100 placeholder-gray-500"
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />

            <button
              onClick={handleSend}
              disabled={(!input.trim() && pendingAttachments.length === 0) || isStreaming}
              className="absolute right-2 bottom-2 p-2 bg-[#10a37f] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0d8c6d] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {t.sendHint}
          </p>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#40414f] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t.premiumRequired}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t.premiumModelMessage}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-[#10a37f]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t.unlimitedMessages}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-[#10a37f]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t.accessAllModels}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-[#10a37f]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t.prioritySupport}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-[#565869] transition-colors"
              >
                {t.cancel}
              </button>
              <a
                href="/pricing"
                className="flex-1 py-3 px-4 bg-[#10a37f] text-white rounded-xl font-medium hover:bg-[#0d8c6d] transition-colors text-center"
              >
                {t.upgradeNow}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
