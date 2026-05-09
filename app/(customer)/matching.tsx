import { useEffect, useRef, useState } from 'react';
import { Text, View, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { triggerMatching } from '@/services/matching';
import { useRealtime } from '@/hooks/useRealtime';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  blue: '#1B6FE8',
  blueLight: '#E8F0FF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  white: '#FFFFFF',
};

function PulseRing({ delay, size }: { delay: number; size: number }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.65, duration: 1700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,    duration: 1700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 1.5, borderColor: Theme.amber,
      transform: [{ scale }], opacity,
    }} />
  );
}

export default function Matching() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { subscribeToJob } = useRealtime();
  const [timeoutVisible, setTimeoutVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const centerScale   = useRef(new Animated.Value(0.8)).current;
  const centerOpacity = useRef(new Animated.Value(0)).current;
  const textFade      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(centerScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(centerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(textFade, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!jobId) return;
    triggerMatching(jobId);
    const unsubscribe = subscribeToJob(jobId, (payload) => {
      const next = payload as { new?: { status?: string; id?: string } };
      if (next.new?.status === 'matched' && next.new.id) {
        router.replace(`/(customer)/job/${next.new.id}`);
      }
    });
    const timeout = setTimeout(() => setTimeoutVisible(true), 3 * 60 * 1000);
    return () => { clearTimeout(timeout); unsubscribe(); };
  }, [jobId]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.navy }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 32 }}>

        {/* Animated Rings */}
        <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
          <PulseRing delay={0}    size={160} />
          <PulseRing delay={560}  size={160} />
          <PulseRing delay={1120} size={160} />

          <Animated.View style={{
            transform: [{ scale: centerScale }], opacity: centerOpacity,
            width: 110, height: 110, borderRadius: 55,
            backgroundColor: Theme.amber,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: Theme.amber,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45, shadowRadius: 22, elevation: 14,
          }}>
            <Ionicons name="flash" size={42} color={Theme.navy} />
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: textFade, alignItems: 'center', gap: 10 }}>
          <Text style={{ color: Theme.white, fontSize: 25, fontWeight: '800' }}>Finding your Pro</Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 260, fontSize: 14, lineHeight: 20 }}>
            Zapfix is matching you with the best professional for this exact problem
          </Text>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20,
            paddingHorizontal: 16, paddingVertical: 6, marginTop: 6,
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
              Searching · {formatTime(elapsed)}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textFade, width: '100%', paddingHorizontal: 36 }}>
          {[
            { icon: 'shield-checkmark', text: 'All pros are background-verified' },
            { icon: 'star',             text: 'Only top-rated pros are matched' },
            { icon: 'cash',             text: 'No charges until job is done' },
          ].map((item) => (
            <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Ionicons name={item.icon as any} size={16} color={Theme.amber} />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{item.text}</Text>
            </View>
          ))}
        </Animated.View>

      </View>

      <BottomSheet visible={timeoutVisible} onClose={() => setTimeoutVisible(false)}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.textDark }}>
          No pros available right now
        </Text>
        <Text style={{ marginTop: 8, color: Theme.textMid, lineHeight: 20 }}>
          We'll notify you as soon as a pro becomes available for your area.
        </Text>
        <View style={{ marginTop: 20 }}>
          <Button onPress={() => router.replace('/(customer)/home')}>Okay, Got It</Button>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}