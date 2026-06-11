import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useProTheme } from '@/hooks/useTheme';

type OnlineToggleProps = {
  isOnline: boolean;
  onToggle: () => void;
  busy?: boolean;
};

export const OnlineToggle = ({ isOnline, onToggle, busy }: OnlineToggleProps) => {
  const ProTheme = useProTheme();
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!isOnline) {
      pulse.setValue(0.85);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [isOnline]);

  const trackBg = isOnline ? ProTheme.colors.success : ProTheme.colors.text.muted + '60';
  const knobLeft = isOnline ? 36 : 4;

  return (
    <Pressable
      onPress={busy ? undefined : onToggle}
      disabled={busy}
      style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: isOnline ? `${ProTheme.colors.success}12` : ProTheme.colors.surface,
        borderWidth: 1.5,
        borderColor: isOnline ? `${ProTheme.colors.success}40` : ProTheme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: busy ? 0.6 : 1,
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isOnline ? ProTheme.colors.success : ProTheme.colors.text.muted, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{
          position: 'absolute', width: 44, height: 44, borderRadius: 22,
          backgroundColor: isOnline ? ProTheme.colors.success : 'transparent',
          opacity: isOnline ? 0.25 : 0,
          transform: [{ scale: pulse }],
        }} />
        <Ionicons name={isOnline ? 'flash' : 'moon'} size={20} color={ProTheme.colors.text.inverse} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: ProTheme.colors.text.primary }}>
          {busy ? 'Updating…' : isOnline ? 'You are Online' : 'You are Offline'}
        </Text>
        <Text style={{ fontSize: 12, color: ProTheme.colors.text.secondary, marginTop: 2 }}>
          {isOnline ? 'Receiving live job requests in your area' : 'Tap to start accepting jobs near you'}
        </Text>
      </View>
      {/* Toggle visual */}
      <View style={{ width: 64, height: 30, borderRadius: 15, backgroundColor: trackBg, padding: 3, justifyContent: 'center' }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: ProTheme.colors.text.inverse, position: 'absolute', left: knobLeft, top: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 }} />
      </View>
    </Pressable>
  );
};
