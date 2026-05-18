import { useMemo, useRef, useEffect } from 'react';
import {
  ScrollView, Text, View, Pressable,
  Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useJob } from '@/hooks/useJob';
import { WarrantyCard } from '@/components/customer/WarrantyCard';
import { StatusPill } from '@/components/ui/StatusPill';

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

const categories = [
  { label: 'AC Repair',    icon: 'thermometer', color: '#EBF3FF' },
  { label: 'Electrical',   icon: 'flash',        color: '#FFF8D6' },
  { label: 'Plumbing',     icon: 'water',        color: '#E8F5FF' },
  { label: 'Washing',      icon: 'shirt',        color: '#F0E6FF' },
  { label: 'Refrigerator', icon: 'snow',         color: '#E6FFF3' },
];

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

function CategoryChip({ label, icon, color, onPress }: any) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          backgroundColor: color,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          alignItems: 'center',
          minWidth: 82,
          borderWidth: 1,
          borderColor: Theme.border,
        }}
      >
        <Ionicons name={icon as any} size={20} color={Theme.navy} />
        <Text style={{ fontSize: 11, color: Theme.textDark, marginTop: 4, fontWeight: '700' }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function ActionButton({ icon, label, onPress, accent }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          backgroundColor: accent ? Theme.amber : Theme.cream,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: accent ? Theme.amber : Theme.border,
          gap: 6,
        }}
      >
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: accent ? Theme.navy : Theme.navy,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={18} color={Theme.white} />
        </View>
        <Text style={{ fontSize: 12, color: Theme.textDark, fontWeight: '700' }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Logo placeholder component ──────────────────────────────────────────────
function LogoMark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {/* Replace <Image> below with your actual logo asset:
          <Image source={require('@/assets/logo.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
      */}
      <View style={{
        width: 32, height: 32, borderRadius: 9,
        backgroundColor: Theme.amber,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="flash" size={18} color={Theme.navy} />
      </View>
      <Text style={{ color: Theme.white, fontSize: 19, fontWeight: '800', letterSpacing: -0.5 }}>
        Zapfix
      </Text>
    </View>
  );
}

export default function CustomerHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const { areaName } = useLocation();
  const { jobsQuery } = useJob({ customerId: profile?.id });
  const headerAnim = useRef(new Animated.Value(0)).current;

  const activeJob = useMemo(() => {
    return jobsQuery.data?.find(
      (job) => job.status !== 'completed' && job.status !== 'cancelled'
    );
  }, [jobsQuery.data]);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

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

            {/* Greeting row */}
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500' }}>
                {greeting()} 👋
              </Text>
              <Text style={{ color: Theme.white, fontSize: 22, fontWeight: '800', marginTop: 2 }}>
                {profile?.full_name?.split(' ')[0] ?? 'there'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <Ionicons name="location" size={13} color='rgba(255,255,255,0.5)' />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                {areaName || 'Fetching location...'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -20, paddingHorizontal: 20, gap: 16 }}>

          {/* Active Job Card */}
          {activeJob ? (
            <AnimatedCard delay={50}>
              <View style={{
                backgroundColor: Theme.amberLight,
                borderRadius: 20,
                padding: 16,
                borderWidth: 1.5,
                borderColor: Theme.amberBorder,
                shadowColor: Theme.amber,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 12,
                elevation: 4,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.amber }} />
                    <Text style={{ fontWeight: '700', color: Theme.textDark, fontSize: 14 }}>Job in Progress</Text>
                  </View>
                  {activeJob.status ? <StatusPill status={activeJob.status} /> : null}
                </View>
                <Text style={{ color: Theme.textMid, marginTop: 6, fontSize: 13 }}>{activeJob.ai_diagnosis}</Text>
                <Pressable
                  onPress={() => router.push(`/(customer)/job/${activeJob.id}`)}
                  style={{
                    marginTop: 12, backgroundColor: Theme.navy,
                    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
                  }}
                >
                  <Text style={{ color: Theme.white, fontWeight: '700', fontSize: 13 }}>Track Job →</Text>
                </Pressable>
              </View>
            </AnimatedCard>
          ) : null}

          {/* Problem Card */}
          <AnimatedCard delay={100}>
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
                <ActionButton icon="camera" label="Photo" onPress={() => router.push('/(customer)/diagnose')} />
                <ActionButton icon="cloud-upload" label="Upload" onPress={() => router.push('/(customer)/diagnose')} />
                <ActionButton icon="chatbubble-ellipses" label="Describe" onPress={() => router.push('/(customer)/diagnose')} />
              </View>
            </View>
          </AnimatedCard>

          {/* Quick Categories */}
          <AnimatedCard delay={150}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.textDark, marginBottom: 12 }}>
              Quick Categories
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.label}
                  label={cat.label}
                  icon={cat.icon}
                  color={cat.color}
                  onPress={() => router.push({ pathname: '/(customer)/diagnose', params: { category: cat.label } })}
                />
              ))}
            </ScrollView>
          </AnimatedCard>

          {/* Warranties */}
          <AnimatedCard delay={200}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.textDark }}>Active Warranties</Text>
              <Text style={{ color: Theme.blue, fontSize: 13, fontWeight: '600' }}>See all</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <WarrantyCard appliance="Refrigerator" validUntil={new Date().toISOString()} />
              <WarrantyCard appliance="AC" validUntil={new Date().toISOString()} />
            </ScrollView>
          </AnimatedCard>

          {/* Zap Rewards Banner */}
          <AnimatedCard delay={250}>
            <Pressable
              onPress={() => router.push('/(customer)/rewards')}
              style={{
                backgroundColor: Theme.navy,
                borderRadius: 20,
                padding: 20,
                overflow: 'hidden',
              }}
            >
              <View style={{
                position: 'absolute', right: -24, top: -24,
                width: 130, height: 130, borderRadius: 65,
                backgroundColor: 'rgba(245,184,0,0.12)',
              }} />
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
                  borderRadius: 12, padding: 9,
                }}>
                  <Ionicons name="flash" size={20} color={Theme.navy} />
                </View>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.55)', marginTop: 8, fontSize: 13 }}>
                Points · Achievements · Exclusive offers
              </Text>
            </Pressable>
          </AnimatedCard>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}