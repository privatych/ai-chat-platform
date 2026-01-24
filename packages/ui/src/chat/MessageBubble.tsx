import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Avatar } from '../primitives/Avatar';

export interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  model?: string;
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

export function MessageBubble({
  content,
  role,
  model,
  isStreaming = false,
  onCopy,
  onRegenerate,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.container, isUser && styles.containerUser]}>
      <Avatar
        model={isUser ? undefined : model}
        name={isUser ? 'You' : undefined}
        size="sm"
      />
      <View style={[styles.bubble, isUser && styles.bubbleUser]}>
        <Text style={[styles.content, isUser && styles.contentUser]}>
          {content}
          {isStreaming && <Text style={styles.cursor}>|</Text>}
        </Text>

        {!isUser && !isStreaming && (
          <View style={styles.actions}>
            {onCopy && (
              <Pressable onPress={onCopy} style={styles.actionButton}>
                <Text style={styles.actionText}>Copy</Text>
              </Pressable>
            )}
            {onRegenerate && (
              <Pressable onPress={onRegenerate} style={styles.actionButton}>
                <Text style={styles.actionText}>Regenerate</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  containerUser: {
    flexDirection: 'row-reverse',
  },
  bubble: {
    flex: 1,
    maxWidth: '80%',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
  },
  bubbleUser: {
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  contentUser: {
    color: '#ffffff',
  },
  cursor: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
