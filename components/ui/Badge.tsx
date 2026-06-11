import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type BadgeProps = {
  label: string;
  backgroundColor?: string;
  textColor?: string;
};

export const Badge = ({ label, backgroundColor, textColor }: BadgeProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: backgroundColor ?? colors.surfaceAlt
      }}
    >
      <Text style={{ color: textColor ?? colors.text.secondary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
};
