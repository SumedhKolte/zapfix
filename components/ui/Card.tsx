import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { PressableStateCallbackType } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type CardProps = {
  children: ReactNode;
  padding?: number;
  onPress?: () => void;
};

export const Card = ({ children, padding = 16, onPress }: CardProps) => {
  const { colors } = useTheme();
  const baseStyle = {
    padding,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.navy.primary,
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

  return <View style={baseStyle}>{children}</View>;
};
