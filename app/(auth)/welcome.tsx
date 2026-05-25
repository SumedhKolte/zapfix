import { Animated, Image, ScrollView, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF'
};

const logoSource = require('../../assets/icon.png');

const features = [
  {
    icon: 'flash',
    title: 'Instant diagnosis',
    description: 'AI-led checks with expert follow up.'
  },
  {
    icon: 'shield-checkmark',
    title: 'Trusted professionals',
    description: 'Verified technicians for every job.'
  },
  {
    icon: 'wallet',
    title: 'Upfront pricing',
    description: 'Know the cost before work begins.'
  }
];

const FeatureRow = ({
  icon,
  title,
  description
}: {
  icon: string;
  title: string;
  description: string;
}) => (
  <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Theme.amberLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: `${Theme.amber}30`
      }}
    >
      <Ionicons name={icon as any} size={20} color={Theme.navy} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>
        {title}
      </Text>
      <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 2, lineHeight: 17 }}>
        {description}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={14} color={Theme.textLight} />
  </View>
);

export default function Welcome() {
  const router = useRouter();
  const logoScale = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.06,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>

      {/* ── Scrollable body ── */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 64,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.18)'
                }}
              >
                <Image
                  source={logoSource}
                  style={{ width: 62, height: 62 }}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            <Animated.View
              style={{
                alignItems: 'center',
                opacity: contentFade,
                transform: [{ translateY: contentTranslate }]
              }}
            >
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: '800',
                  color: Theme.white,
                  marginTop: 18,
                  letterSpacing: 0.3
                }}
              >
                Zapfix
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 6
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: Theme.amber
                  }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.65)',
                    letterSpacing: 0.4
                  }}
                >
                  Diagnosed First. Fixed Right.
                </Text>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: Theme.amber
                  }}
                />
              </View>
            </Animated.View>
          </View>
        </LinearGradient>

        {/* ── Cards ── */}
        <View style={{ marginTop: -36, paddingHorizontal: 20, gap: 14 }}>
          {/* Features card */}
          <View
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 22,
              padding: 20,
              borderWidth: 1,
              borderColor: Theme.border,
              shadowColor: Theme.navy,
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 4,
              gap: 16
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 4,
                  height: 18,
                  borderRadius: 2,
                  backgroundColor: Theme.amber
                }}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '800',
                  color: Theme.textDark,
                  letterSpacing: 0.2
                }}
              >
                Why customers choose us
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: Theme.border, marginHorizontal: -4 }} />

            {features.map((item, index) => (
              <View key={item.title}>
                <FeatureRow {...item} />
                {index < features.length - 1 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: Theme.border,
                      marginTop: 16,
                      marginHorizontal: 4
                    }}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Live tracking card */}
          <LinearGradient
            colors={[Theme.navy, Theme.navyMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 22,
              padding: 20,
              shadowColor: Theme.navy,
              shadowOpacity: 0.2,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: 'rgba(245,184,0,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(245,184,0,0.28)'
                }}
              >
                <Ionicons name="navigate" size={20} color={Theme.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '800',
                    color: Theme.white,
                    letterSpacing: 0.2
                  }}
                >
                  Live tracking included
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.62)',
                    marginTop: 5,
                    lineHeight: 18
                  }}
                >
                  Real-time job status, ETA, and technician details — all in one place.
                </Text>
              </View>
            </View>

            {/* Stat pills */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              {[
                { label: '10k+ Jobs', icon: 'checkmark-done' },
                { label: '4.9 ★ Rating', icon: 'star' },
                { label: '< 60 min', icon: 'time' }
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)'
                  }}
                >
                  <Ionicons name={stat.icon as any} size={11} color={Theme.amber} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.white }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* ── Sticky CTA footer ── */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 24 : 16
        }}
      >
        <Button size="lg" onPress={() => router.push('/(auth)/phone-entry')}>
          Continue with phone
        </Button>
      </View>

    </SafeAreaView>
  );
}