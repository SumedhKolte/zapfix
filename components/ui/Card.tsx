import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { PressableStateCallbackType } from 'react-native';

import { Colors } from '@/constants/colors';

type CardProps = {
  children: ReactNode;
  padding?: number;
  onPress?: () => void;
};

export const Card = ({ children, padding = 16, onPress }: CardProps) => {
  const baseStyle = {
    padding,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.navy.primary,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3
  };

  if (onPress) {
    const resolveStyle = (state: PressableStateCallbackType) => [
      baseStyle,
      state.pressed ? { transform: [{ scale: 0.97 }] } : null
    ];

    return (
      <Pressable onPress={onPress} style={resolveStyle}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={baseStyle}>
      {children}
    </View>
  );
}; // ✅ Added missing closing bracket