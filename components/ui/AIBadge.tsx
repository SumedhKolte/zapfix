import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type AIBadgeProps = {
  size?: 'sm' | 'md';
};

export const AIBadge = ({ size = 'sm' }: AIBadgeProps) => {
  const { colors } = useTheme();
  const paddingHorizontal = size === 'sm' ? 8 : 10;
  const paddingVertical = size === 'sm' ? 4 : 6;
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal,
        paddingVertical,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.blue.border,
        backgroundColor: colors.blue.light
      }}
    >
      <Ionicons name="hardware-chip-outline" size={14} color={colors.blue.primary} />
      <Text style={{ marginLeft: 4, fontSize, fontWeight: '600', color: colors.blue.primary }}>AI</Text>
    </View>
  );
};
