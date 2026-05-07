import { Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

type BadgeProps = {
  label: string;
  backgroundColor?: string;
  textColor?: string;
};

export const Badge = ({ label, backgroundColor = Colors.lightGray, textColor = Colors.darkGray }: BadgeProps) => {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor
      }}
    >
      <Text style={{ color: textColor, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
};
