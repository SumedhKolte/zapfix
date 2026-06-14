import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  white: '#FFFFFF'
};

const logoSource = require('../../assets/icon.png');

// A single expanding ring that pulses outward from the logo like a stamp
// impact / sonar ping. Driven entirely on the native thread.
const PulseRing = ({ delay, value }: { delay: number; value: Animated.Value }) => {
  const scale = value.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.2] });
  const opacity = value.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.45, 0] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: Theme.amber,
        opacity,
        transform: [{ scale }]
      }}
    />
  );
};

const LoadingDot = ({ value, index }: { value: Animated.Value; index: number }) => {
  // Each dot lights up in sequence as the shared 0→1 value sweeps across.
  const start = index * 0.18;
  const opacity = value.interpolate({
    inputRange: [start, start + 0.18, start + 0.36, 1],
    outputRange: [0.25, 1, 0.25, 0.25],
    extrapolate: 'clamp'
  });
  const scale = value.interpolate({
    inputRange: [start, start + 0.18, start + 0.36, 1],
    outputRange: [1, 1.6, 1, 1],
    extrapolate: 'clamp'
  });
  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Theme.amber,
        opacity,
        transform: [{ scale }]
      }}
    />
  );
};

export const AppSplash = () => {
  // Entrance: the logo "stamps" down from above into place.
  const stampScale = useRef(new Animated.Value(1.6)).current;
  const stampOpacity = useRef(new Animated.Value(0)).current;
  const stampDrop = useRef(new Animated.Value(-26)).current;
  // Looping: gentle float + ring pulse + sweeping dots.
  const float = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const dots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Stamp the logo in with a slight overshoot, like pressing a seal.
    Animated.parallel([
      Animated.timing(stampOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(stampDrop, { toValue: 0, tension: 70, friction: 6, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(stampScale, {
          toValue: 0.94,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.spring(stampScale, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true })
      ])
    ]).start();

    // 2. Continuous gentle float of the badge.
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    ).start();

    // 3. Ring pulse radiating out on a steady beat.
    Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 1800, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ).start();

    // 4. Loading dots sweep.
    Animated.loop(
      Animated.timing(dots, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [dots, float, ring, stampDrop, stampOpacity, stampScale]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <LinearGradient
      colors={[Theme.navy, Theme.navyMid]}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
    >
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <PulseRing delay={0} value={ring} />
        <Animated.View
          style={{
            opacity: stampOpacity,
            transform: [{ translateY }, { translateY: stampDrop }, { scale: stampScale }]
          }}
        >
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(245,184,0,0.25)'
            }}
          >
            <Image source={logoSource} style={{ width: 88, height: 88 }} resizeMode="contain" />
          </View>
        </Animated.View>
      </View>

      <Text style={{ color: Theme.white, fontSize: 26, fontWeight: '800', marginTop: 8 }}>Zapfix</Text>

      <View style={{ flexDirection: 'row', gap: 7, marginTop: 18, alignItems: 'center', height: 8 }}>
        {[0, 1, 2].map((i) => (
          <LoadingDot key={i} value={dots} index={i} />
        ))}
      </View>
    </LinearGradient>
  );
};
