import { Animated, Image, ScrollView, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

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
}) => {
  const { theme: Theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center', paddingVertical: 2 }}>
      <Ionicons name={icon as any} size={28} color={Theme.textDark} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textDark }}>
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: Theme.textMid, marginTop: 3, lineHeight: 20 }}>
          {description}
        </Text>
      </View>
    </View>
  );
};

export default function Welcome() {
  const { theme: Theme } = useTheme();
  const avatarColors = [Theme.textMid, Theme.navyMid, Theme.amber];
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

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{
            paddingHorizontal: 24,
            paddingTop: 36,
            paddingBottom: 88,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              <View
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <View style={{ width: 78, height: 78, position: 'relative' }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 78,
                      height: 78,
                      borderRadius: 20,
                      backgroundColor: 'rgba(62, 197, 255, 0.65)',
                      shadowColor: '#3EC5FF',
                      shadowOpacity: 1,
                      shadowRadius: 28,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 14
                    }}
                  />
                  <View style={{ width: 78, height: 78, borderRadius: 20, overflow: 'hidden' }}>
                    <Image
                      source={logoSource}
                      style={{ width: 78, height: 78, borderRadius: 20, transform: [{ scale: 1.08 }] }}
                      resizeMode="contain"
                    />
                  </View>
                </View>
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
                  fontSize: 36,
                  fontWeight: '800',
                  color: Theme.white,
                  marginTop: 20,
                  letterSpacing: 0.4
                }}
              >
                ZapFix
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: Theme.amber
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.65)',
                    letterSpacing: 1.8,
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}
                >
                  Diagnosed First. Fixed Right.
                </Text>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: Theme.amber
                  }}
                />
              </View>
            </Animated.View>
          </View>
        </LinearGradient>

        {/* ── Cards ── */}
        <View style={{ marginTop: -48, paddingHorizontal: 20, gap: 14 }}>

          {/* Features card */}
          <View
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: Theme.border,
              shadowColor: Theme.navy,
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 4,
              gap: 20
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 5,
                  height: 32,
                  borderRadius: 3,
                  backgroundColor: Theme.amber
                }}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: Theme.textDark,
                  letterSpacing: 0.2,
                  lineHeight: 26
                }}
              >
                {'Why customers\nchoose us'}
              </Text>
            </View>

            {features.map((item, index) => (
              <View key={item.title}>
                <FeatureRow {...item} />
                {index < features.length - 1 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: Theme.border,
                      marginTop: 20
                    }}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Joined by pill */}
          <View
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 50,
              paddingHorizontal: 18,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 25,
              borderWidth: 1,
              borderColor: Theme.border,
              shadowColor: Theme.navy,
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2
            }}
          >
            <View style={{ flexDirection: 'row', width: 72 }}>
              {avatarColors.map((color, i) => (
                <View
                  key={i}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: color,
                    borderWidth: 2,
                    borderColor: Theme.white,
                    marginLeft: i === 0 ? 0 : -12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Ionicons name="person" size={16} color={Theme.white} />
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 13, color: Theme.textDark, fontWeight: '600', flex: 1 }}>
              Joined by 1k+ local homeowners
            </Text>
          </View>

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
        <Text
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 12,
            color: Theme.textMid
          }}
        >
          By continuing, you agree to our{' '}
          <Text style={{ color: Theme.amber, fontWeight: '600' }}>Terms of Service</Text>
        </Text>
      </View>

    </SafeAreaView>
  );
}
