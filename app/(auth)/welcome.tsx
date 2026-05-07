import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';

export default function Welcome() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true
    }).start();

    Animated.timing(contentTranslate, {
      toValue: 0,
      duration: 450,
      useNativeDriver: true
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [contentFade, contentTranslate, logoScale]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.navy.primary }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Ionicons name="flash" size={64} color={Colors.amber.primary} />
        </Animated.View>
        <Animated.View
          style={{ alignItems: 'center', opacity: contentFade, transform: [{ translateY: contentTranslate }] }}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.white, marginTop: 12 }}>
            Zapfix
          </Text>
          <Text style={{ fontSize: 14, color: Colors.midGray, marginTop: 4 }}>
            Diagnosed First. Fixed Right.
          </Text>
        </Animated.View>
      </View>
      <View
        style={{
          backgroundColor: Colors.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          gap: 16
        }}
      >
        <Button onPress={() => router.push('/(auth)/phone-entry')} accessibilityLabel="Get started">
          Get Started
        </Button>
        <Text style={{ textAlign: 'center', color: Colors.darkGray }}>
          Already have an account?{' '}
          <Text
            style={{ color: Colors.navy.primary, fontWeight: '700' }}
            onPress={() => router.push('/(auth)/phone-entry')}
          >
            Sign In
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
