import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export interface AvatarProps {
  source?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  model?: string;
}

const MODEL_COLORS: Record<string, string> = {
  'gpt-4o-mini': '#10a37f',
  'gpt-4o': '#10a37f',
  'claude-3-haiku': '#d4a373',
  'claude-3.5-sonnet': '#d4a373',
  'gemini-1.5-flash': '#4285f4',
  'gemini-1.5-pro': '#4285f4',
  'deepseek-chat': '#8b5cf6',
  'grok-2': '#000000',
};

const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
};

export function Avatar({ source, name, size = 'md', model }: AvatarProps) {
  const dimension = SIZES[size];
  const backgroundColor = model ? MODEL_COLORS[model] || '#6b7280' : '#6b7280';

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[
          styles.image,
          { width: dimension, height: dimension, borderRadius: dimension / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: dimension * 0.4 }]}>
        {model ? getModelInitials(model) : initials}
      </Text>
    </View>
  );
}

function getModelInitials(model: string): string {
  if (model.includes('gpt')) return 'G';
  if (model.includes('claude')) return 'C';
  if (model.includes('gemini')) return 'Ge';
  if (model.includes('deepseek')) return 'D';
  if (model.includes('grok')) return 'X';
  return 'AI';
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
