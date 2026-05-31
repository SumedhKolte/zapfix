import { useMemo, useRef, useEffect } from 'react';
import {
  ScrollView, Text, View, Pressable,
  Animated, Easing, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useProfile } from '@/hooks/useProfile';
import { parseAddressText } from '@/utils/geo';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  amberBorder: '#F5B80040',
  blue: '#1B6FE8',
  blueLight: '#E8F0FF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  success: '#1A7A4A',
  white: '#FFFFFF',
};

type Category = {
  label: string;
  icon: string;
  tint: string;          // pastel background
  iconBg: string;        // contrasting accent for the icon chip
  description: string;
};

const categories: Category[] = [
  { label: 'AC Repair',     icon: 'thermometer', tint: '#EBF3FF', iconBg: '#1B6FE8', description: 'Cooling, gas, filter' },
  { label: 'Electrical',    icon: 'flash',       tint: '#FFF8D6', iconBg: '#F5B800', description: 'Wiring, switches' },
  { label: 'Plumbing',      icon: 'water',       tint: '#E8F5FF', iconBg: '#1B6FE8', description: 'Leaks, taps, drains' },
  { label: 'Washing',       icon: 'shirt',       tint: '#F0E6FF', iconBg: '#7C3AED', description: 'Washer & dryer fixes' },
  { label: 'Refrigerator',  icon: 'snow',        tint: '#E6FFF3', iconBg: '#1A7A4A', description: 'Cooling, ice, noise' },
  { label: 'Geyser',        icon: 'flame',       tint: '#FFEDE5', iconBg: '#C2410C', description: 'Hot water issues' },
];

// ---------- Animation helpers ----------

function AnimatedCard({ children, delay = 0, style }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// Shimmering pulse used while jobs / addresses are loading.
function ShimmerBlock({ height = 70, radius = 14, style }: any) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return (
    <Animated.View
      style={[{
        height,
        borderRadius: radius,
        backgroundColor: Theme.border,
        opacity,
      }, style]}
    />
  );
}

function CategoryCard({ category, onPress, delay = 0 }: { category: Category; onPress: () => void; delay?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 380,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const enterStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
      { scale },
    ],
  };

  return (
    <Animated.View style={[{ width: '48%' }, enterStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          backgroundColor: category.tint,
          borderRadius: 18,
          padding: 14,
          minHeight: 118,
          borderWidth: 1,
          borderColor: Theme.border,
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: category.iconBg,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: category.iconBg,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Ionicons name={category.icon as any} size={20} color={Theme.white} />
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark }}>{category.label}</Text>
          <Text style={{ fontSize: 11, color: Theme.textMid, marginTop: 2 }} numberOfLines={1}>
            {category.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ActionButton({ icon, label, onPress }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          backgroundColor: Theme.cream,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: Theme.border,
          gap: 6,
        }}
      >
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: Theme.navy,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={18} color={Theme.white} />
        </View>
        <Text style={{ fontSize: 12, color: Theme.textDark, fontWeight: '700' }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function LogoMark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 34, height: 34, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: 'rgba(62, 197, 255, 0.65)',
            shadowColor: '#3EC5FF',
            shadowOpacity: 1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
            elevation: 10,
          }}
        />
        <View style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 34, height: 34, transform: [{ scale: 1.08 }] }}
            resizeMode="contain"
          />
        </View>
      </View>
      <Text style={{ color: Theme.white, fontSize: 19, fontWeight: '800', letterSpacing: -0.5 }}>
        ZapFix
      </Text>
    </View>
  );
}

export default function CustomerHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const { areaName } = useLocation();
  const { addressesQuery } = useProfile(profile?.id ?? '');
  const headerAnim = useRef(new Animated.Value(0)).current;

  const defaultAddress = useMemo(() => {
    const list = addressesQuery.data ?? [];
    return list.find((a) => a.is_default) ?? list[0] ?? null;
  }, [addressesQuery.data]);

  // Strip the receiver suffix (we encode receiver/landmark inside address_text)
  // so the header pill stays short.
  const headerLocation =
    parseAddressText(defaultAddress?.address_text).formatted ||
    areaName ||
    'Add a service address';
  const isAddressesLoading = addressesQuery.isLoading;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Build the 2-col grid as rows so we vertically scroll, 2 cards per row.
  const categoryRows = useMemo(() => {
    const rows: Category[][] = [];
    for (let i = 0; i < categories.length; i += 2) {
      rows.push(categories.slice(i, i + 2));
    }
    return rows;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 /* room for sticky tracker + tab bar */ }}
      >
        {/* Header */}
        <Animated.View style={{ opacity: headerAnim }}>
          <LinearGradient
            colors={[Theme.navy, Theme.navyMid]}
            style={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 36 }}
          >
            {/* Top row: Logo + Notification */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <LogoMark />
              <Pressable
                onPress={() => router.push('/(customer)/notifications')}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="notifications" size={20} color={Theme.amber} />
                <View style={{
                  position: 'absolute', top: 9, right: 9,
                  width: 7, height: 7, borderRadius: 3.5,
                  backgroundColor: Theme.amber, borderWidth: 1.5, borderColor: Theme.navy,
                }} />
              </Pressable>
            </View>

            <View>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500' }}>
                {greeting()},
              </Text>
              <Text style={{ color: Theme.white, fontSize: 22, fontWeight: '800', marginTop: 2 }}>
                {profile?.full_name?.split(' ')[0] ?? 'there'}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/(customer)/addresses')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}
            >
              <Ionicons name="location" size={13} color={defaultAddress ? Theme.amber : 'rgba(255,255,255,0.5)'} />
              {isAddressesLoading && !defaultAddress ? (
                <ShimmerBlock height={12} radius={6} style={{ flex: 1, maxWidth: 160 }} />
              ) : (
                <Text
                  numberOfLines={1}
                  style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, flex: 1, fontWeight: defaultAddress ? '600' : '400' }}
                >
                  {defaultAddress?.label ? `${defaultAddress.label} · ` : ''}{headerLocation}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -20, paddingHorizontal: 20, gap: 16 }}>

          {/* Problem Card */}
          <AnimatedCard delay={80}>
            <View style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 20,
              padding: 20,
              shadowColor: Theme.navy,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 12,
              elevation: 3,
            }}>
              <Text style={{ fontSize: 19, fontWeight: '800', color: Theme.textDark }}>
                What's the problem?
              </Text>
              <Text style={{ color: Theme.textMid, marginTop: 4, fontSize: 13 }}>
                Describe it, show it, or just tell us
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <ActionButton icon="camera" label="Photo" onPress={() => router.push({ pathname: '/(customer)/diagnose', params: { resetKey: Date.now().toString() } })} />
                <ActionButton icon="cloud-upload" label="Upload" onPress={() => router.push({ pathname: '/(customer)/diagnose', params: { resetKey: Date.now().toString() } })} />
                <ActionButton icon="chatbubble-ellipses" label="Describe" onPress={() => router.push({ pathname: '/(customer)/diagnose', params: { resetKey: Date.now().toString() } })} />
              </View>
            </View>
          </AnimatedCard>

          {/* Zap Rewards (moved above categories) */}
          <AnimatedCard delay={140}>
            <Pressable
              onPress={() => router.push('/(customer)/rewards')}
              style={{
                backgroundColor: Theme.navy,
                borderRadius: 20,
                padding: 20,
                overflow: 'hidden',
              }}
            >
              {/* amber glow removed */}
              <View style={{
                position: 'absolute', right: 30, bottom: -30,
                width: 90, height: 90, borderRadius: 45,
                backgroundColor: 'rgba(27,111,232,0.10)',
              }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="gift" size={13} color={Theme.amber} />
                    <Text style={{ color: Theme.amber, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                      ZAP REWARDS
                    </Text>
                  </View>
                  <Text style={{ color: Theme.white, fontSize: 22, fontWeight: '800', marginTop: 2 }}>
                    Earn &amp; Save
                  </Text>
                </View>
                <View style={{
                  backgroundColor: Theme.amber,
                  borderRadius: 12,
                  padding: 9,
                  position: 'relative',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons
                    name="flash"
                    size={20}
                    color={Theme.navy}
                    style={{
                      textShadowColor: 'rgba(245,184,0,0.95)',
                      textShadowRadius: 10,
                      textShadowOffset: { width: 0, height: 0 },
                    }}
                  />
                </View>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.55)', marginTop: 8, fontSize: 13 }}>
                Points · Achievements · Exclusive offers
              </Text>
            </Pressable>
          </AnimatedCard>

          {/* Quick Categories — vertical grid, 2 per row */}
          <AnimatedCard delay={200}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.textDark }}>Quick Categories</Text>
            </View>

            <View style={{ gap: 12 }}>
              {categoryRows.map((row, rowIndex) => (
                <View
                  key={`row-${rowIndex}`}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
                >
                  {row.map((category, colIndex) => (
                    <CategoryCard
                      key={category.label}
                      category={category}
                      delay={(rowIndex * 2 + colIndex) * 60}
                      onPress={() =>
                        router.push({
                          pathname: '/(customer)/category/[slug]',
                          params: { slug: encodeURIComponent(category.label) },
                        })
                      }
                    />
                  ))}
                  {row.length === 1 ? <View style={{ width: '48%' }} /> : null}
                </View>
              ))}
            </View>
          </AnimatedCard>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
