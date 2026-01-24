import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';

export interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export function Spinner({
  size = 'small',
  color = '#3b82f6',
  style,
}: SpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
