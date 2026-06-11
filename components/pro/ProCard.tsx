import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { PressableStateCallbackType, StyleProp, ViewStyle } from 'react-native';

import { useProTheme } from '@/hooks/useTheme';

type ProCardProps = {
  children: ReactNode;
  padding?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  backgroundColor?: string;
};

export const ProCard = ({
  children,
  padding = 14,
  onPress,
  style,
  borderColor,
  backgroundColor,
}: ProCardProps) => {
  const ProTheme = useProTheme();
  const baseStyle: ViewStyle = {
    padding,
    backgroundColor: backgroundColor ?? ProTheme.colors.card,
    borderRadius: ProTheme.radius.lg,
    borderWidth: 1,
    borderColor: borderColor ?? ProTheme.colors.border,
    ...ProTheme.shadow.card,
  };

  if (onPress) {
    const resolveStyle = (state: PressableStateCallbackType) => [
      baseStyle,
      state.pressed ? { transform: [{ scale: 0.98 }] } : null,
      style,
    ];

    return (
      <Pressable onPress={onPress} style={resolveStyle}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, style]}>
      {children}
    </View>
  );
};
