import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateChat, useModels } from '@/lib/api';
import { useUIStore } from '@/lib/store';

export default function NewChatScreen() {
  const router = useRouter();
  const createChat = useCreateChat();
  const { data: models, isLoading } = useModels();
  const { selectedModel, setSelectedModel } = useUIStore();

  const handleCreateChat = async () => {
    try {
      const { chat } = await createChat.mutateAsync({ model: selectedModel });
      router.push(`/chat/${chat.id}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading models...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Start a New Chat</Text>
        <Text style={styles.subtitle}>
          Select an AI model to begin your conversation
        </Text>

        <View style={styles.modelList}>
          {models?.map((model: any) => (
            <Pressable
              key={model.id}
              style={[
                styles.modelItem,
                selectedModel === model.id && styles.modelItemSelected,
              ]}
              onPress={() => setSelectedModel(model.id)}
            >
              <View style={styles.modelHeader}>
                <Text style={styles.modelName}>{model.name}</Text>
                {model.tier === 'premium' && (
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.modelDescription}>{model.description}</Text>
              {selectedModel === model.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[
            styles.createButton,
            createChat.isPending && styles.createButtonDisabled,
          ]}
          onPress={handleCreateChat}
          disabled={createChat.isPending}
        >
          <Text style={styles.createButtonText}>
            {createChat.isPending ? 'Creating...' : 'Start Chat'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
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
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  modelList: {
    gap: 12,
    marginBottom: 24,
  },
  modelItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  modelItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modelDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  proBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
