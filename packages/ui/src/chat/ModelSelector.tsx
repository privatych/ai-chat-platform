import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import { Avatar } from '../primitives/Avatar';

export interface Model {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'premium';
}

export interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  userTier: 'free' | 'premium';
  visible: boolean;
  onClose: () => void;
}

export function ModelSelector({
  models,
  selectedModel,
  onSelect,
  userTier,
  visible,
  onClose,
}: ModelSelectorProps) {
  const handleSelect = (model: Model) => {
    if (model.tier === 'premium' && userTier === 'free') {
      // Could show upgrade prompt here
      return;
    }
    onSelect(model.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Model</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeButton}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.list}>
            {models.map((model) => {
              const isSelected = model.id === selectedModel;
              const isLocked = model.tier === 'premium' && userTier === 'free';

              return (
                <Pressable
                  key={model.id}
                  onPress={() => handleSelect(model)}
                  style={[
                    styles.modelItem,
                    isSelected && styles.modelItemSelected,
                    isLocked && styles.modelItemLocked,
                  ]}
                >
                  <Avatar model={model.id} size="sm" />
                  <View style={styles.modelInfo}>
                    <View style={styles.modelHeader}>
                      <Text style={styles.modelName}>{model.name}</Text>
                      {model.tier === 'premium' && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumText}>PRO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.modelDescription}>{model.description}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    fontSize: 16,
    color: '#3b82f6',
  },
  list: {
    padding: 8,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  modelItemSelected: {
    backgroundColor: '#eff6ff',
  },
  modelItemLocked: {
    opacity: 0.5,
  },
  modelInfo: {
    flex: 1,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  modelDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  premiumBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
