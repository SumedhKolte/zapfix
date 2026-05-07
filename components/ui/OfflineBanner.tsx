import { Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

type OfflineBannerProps = {
  visible: boolean;
};

export const OfflineBanner = ({ visible }: OfflineBannerProps) => {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: Colors.amber.primary,
        paddingVertical: 8,
        alignItems: 'center'
      }}
    >
      <Text style={{ color: Colors.navy.primary, fontWeight: '700' }}>No internet connection</Text>
    </View>
  );
};
