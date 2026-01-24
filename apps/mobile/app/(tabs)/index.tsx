import { useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useChats } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function ChatsScreen() {
  const router = useRouter();
  const { token, loadToken, isLoading: authLoading } = useAuthStore();
  const { data: chats, isLoading } = useChats();

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [authLoading, token]);

  if (authLoading || !token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  if (!chats?.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No chats yet</Text>
        <Text style={styles.emptyText}>
          Start a new conversation with AI
        </Text>
        <Pressable
          style={styles.newChatButton}
          onPress={() => router.push('/(tabs)/new')}
        >
          <Text style={styles.newChatButtonText}>New Chat</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.chatItem}
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <View style={styles.chatIcon}>
              <Text style={styles.chatIconText}>AI</Text>
            </View>
            <View style={styles.chatContent}>
              <Text style={styles.chatTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.lastMessage && (
                <Text style={styles.chatPreview} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              )}
            </View>
            <Text style={styles.chatTime}>
              {formatTime(item.updatedAt)}
            </Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

function formatTime(dateString: string): string {
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
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  newChatButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  chatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIconText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  chatContent: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  chatPreview: {
    fontSize: 14,
    color: '#6b7280',
  },
  chatTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 72,
  },
});
