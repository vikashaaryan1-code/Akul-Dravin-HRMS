import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // In React Native, true blur requires expo-blur, but for scaffolding we simulate the Glass UI structure
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
  },
});
