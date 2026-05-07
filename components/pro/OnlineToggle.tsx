import { Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Button } from '../ui/Button';

type OnlineToggleProps = {
  isOnline: boolean;
  onToggle: () => void;
};

export const OnlineToggle = ({ isOnline, onToggle }: OnlineToggleProps) => {
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 16,
        backgroundColor: isOnline ? `${Colors.success}1A` : Colors.lightGray,
        gap: 12
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {isOnline ? (
          <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: Colors.success }} />
        ) : null}
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.navy.primary }}>
          {isOnline ? 'You are Online' : 'You are Offline'}
        </Text>
      </View>
      <Button onPress={onToggle}>{isOnline ? 'Go Offline' : 'Go Online'}</Button>
    </View>
  );
};
