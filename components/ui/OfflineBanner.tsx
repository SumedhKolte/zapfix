import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type OfflineBannerProps = {
  visible: boolean;
};

export const OfflineBanner = ({ visible }: OfflineBannerProps) => {
  const { colors } = useTheme();
  if (!visible) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: colors.amber.primary,
        paddingVertical: 8,
        alignItems: 'center'
      }}
    >
      <Text style={{ color: colors.navy.primary, fontWeight: '700' }}>No internet connection</Text>
    </View>
  );
};
