import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '../primitives/Avatar';

export interface ChatListItemProps {
  id: string;
  title: string;
  model: string;
  lastMessage?: string;
  updatedAt: string;
  onPress: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ChatListItem({
  id,
  title,
  model,
  lastMessage,
  updatedAt,
  onPress,
}: ChatListItemProps) {
  const timeAgo = formatTimeAgo(updatedAt);

  return (
    <Pressable
      onPress={() => onPress(id)}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <Avatar model={model} size="md" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        {lastMessage && (
          <Text style={styles.preview} numberOfLines={2}>
            {lastMessage}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pressed: {
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
  },
  preview: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
