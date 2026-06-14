import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { getCategoryCatalog, type FixedIssue } from '@/constants/pricing';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTheme } from '@/hooks/useTheme';

const CATEGORY_META: Record<string, { icon: string; gradient: [string, string]; estimatedMins: number }> = {
  'AC Repair':    { icon: 'snow',        gradient: ['#1B6FE8', '#0F2057'], estimatedMins: 60 },
  Electrical:     { icon: 'flash',       gradient: ['#F5B800', '#C27A00'], estimatedMins: 45 },
  Plumbing:       { icon: 'water',       gradient: ['#1B6FE8', '#1447A0'], estimatedMins: 45 },
  Washing:        { icon: 'shirt',       gradient: ['#7C3AED', '#4C1D95'], estimatedMins: 90 },
  Refrigerator:   { icon: 'snow-outline',gradient: ['#1A7A4A', '#0D4A2C'], estimatedMins: 75 },
  Geyser:         { icon: 'flame',       gradient: ['#C2410C', '#7C2007'], estimatedMins: 50 },
};

// ── Staggered card animation wrapper ────────────────────────────────────────
function SlideCard({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  const scale      = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const delay = 120 + index * 80;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 380, delay, useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, tension: 80, friction: 10, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      {children}
    </Animated.View>
  );
}

// ── Animated icon with subtle glow pulse ────────────────────────────────────
function GlowIcon({ icon, gradient }: { icon: string; gradient: [string, string] }) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.38] });
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

  return (
    <View style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 68, height: 68, borderRadius: 20,
          backgroundColor: gradient[0],
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          width: 58, height: 58, borderRadius: 17,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as any} size={26} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
}

// ── Service card ────────────────────────────────────────────────────────────
function ServiceCard({
  issue,
  popular,
  estimatedMins,
  gradient,
  onPress,
}: {
  issue: FixedIssue;
  popular: boolean;
  estimatedMins: number;
  gradient: [string, string];
  onPress: () => void;
}) {
  const { theme: Theme } = useTheme();
  const pressScale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 15 }).start();
  const onPressOut = () => Animated.spring(pressScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 15 }).start();

  const estLabel = estimatedMins >= 60
    ? `~${Math.round(estimatedMins / 60)}h`
    : `~${estimatedMins}m`;

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={{
          backgroundColor: Theme.creamCard,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: Theme.border,
          overflow: 'hidden',
          shadowColor: gradient[0],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 18,
          elevation: 5,
        }}
      >
        {/* Popular badge */}
        {popular && (
          <View style={{
            position: 'absolute', top: 0, right: 0, zIndex: 2,
            flexDirection: 'row', alignItems: 'center', gap: 3,
            backgroundColor: gradient[0],
            paddingHorizontal: 12, paddingVertical: 5,
            borderBottomLeftRadius: 14,
          }}>
            <Ionicons name="star" size={10} color="#FFF" />
            <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#FFF', letterSpacing: 0.6 }}>
              MOST BOOKED
            </Text>
          </View>
        )}

        {/* Body */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, paddingRight: popular ? 100 : 18 }}>
          <GlowIcon icon={issue.icon} gradient={gradient} />

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15.5, fontWeight: '900', color: Theme.textDark, letterSpacing: -0.2 }} numberOfLines={1}>
              {issue.title}
            </Text>
            <Text style={{ fontSize: 12.5, color: Theme.textMid, marginTop: 3, lineHeight: 17 }} numberOfLines={2}>
              {issue.description}
            </Text>

            {/* Price + time row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: Theme.textDark, letterSpacing: -0.5 }}>
                {formatCurrency(issue.pricePaise)}
              </Text>
              <View style={{ backgroundColor: Theme.amberLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#9A7A00', letterSpacing: 0.6 }}>
                  FIXED PRICE
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 }}>
                <Ionicons name="time-outline" size={12} color={Theme.textLight} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: Theme.textLight }}>{estLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18, paddingVertical: 12,
          borderTopWidth: 1, borderTopColor: Theme.border,
          backgroundColor: Theme.cream,
        }}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {[
              { icon: 'shield-checkmark', label: '30-day warranty' },
              { icon: 'flash-outline',    label: 'Upfront price' },
            ].map(chip => (
              <View key={chip.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={chip.icon as any} size={12} color={gradient[0]} />
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: Theme.textMid }}>{chip.label}</Text>
              </View>
            ))}
          </View>

          {/* Book CTA */}
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingLeft: 14, paddingRight: 10, paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#FFF' }}>Book Zap</Text>
            <Ionicons name="chevron-forward" size={13} color="#FFF" />
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────
export default function CategoryIssues() {
  const { theme: Theme } = useTheme();
  const router   = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const category = useMemo(() => decodeURIComponent(slug ?? ''), [slug]);
  const catalog  = useMemo(() => getCategoryCatalog(category), [category]);
  const meta     = CATEGORY_META[category] ?? { icon: 'construct', gradient: ['#0F2057', '#1A3580'] as [string,string], estimatedMins: 60 };

  // Header entrance
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, []);

  const handleSelect = (issue: FixedIssue) => {
    router.push({ pathname: '/(customer)/quick-book', params: { category, issueKey: issue.key } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Header ── */}
        <Animated.View style={{ opacity: headerAnim }}>
          <LinearGradient
            colors={[meta.gradient[0], meta.gradient[1]]}
            style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 44 }}
          >
            {/* Back */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <Pressable
                onPress={() => router.back()}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="arrow-back" size={20} color="#FFF" />
              </Pressable>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>
                QUICK ZAP
              </Text>
            </View>

            {/* Category identity */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={meta.icon as any} size={30} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
                  {category || 'Service'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 3 }}>
                  {catalog ? `${catalog.issues.length} fixed-price Zaps available` : 'Fixed-price Zaps'}
                </Text>
              </View>
            </View>

            {/* Trust strip */}
            <View style={{
              flexDirection: 'row', gap: 0,
              marginTop: 20,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              {[
                { icon: 'shield-checkmark-outline', label: 'Verified Pros' },
                { icon: 'cash-outline',             label: 'Fixed price' },
                { icon: 'refresh-circle-outline',   label: '24h refund' },
              ].map((item, i) => (
                <View key={item.label} style={{
                  flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10,
                  borderLeftWidth: i > 0 ? 1 : 0,
                  borderLeftColor: 'rgba(255,255,255,0.15)',
                }}>
                  <Ionicons name={item.icon as any} size={16} color="rgba(255,255,255,0.85)" />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Issue cards ── */}
        <View style={{ paddingHorizontal: 18, marginTop: -22 }}>
          {!catalog ? (
            <SlideCard index={0}>
              <View style={{
                backgroundColor: Theme.creamCard, borderRadius: 20,
                padding: 20, borderWidth: 1, borderColor: Theme.border,
              }}>
                <Text style={{ fontSize: 14, color: Theme.textMid }}>
                  No common issues listed for this category yet. Use AI Diagnose below.
                </Text>
              </View>
            </SlideCard>
          ) : (
            <>
              <Text style={{
                fontSize: 11, fontWeight: '900', color: Theme.textLight,
                letterSpacing: 1.2, marginBottom: 14,
              }}>
                COMMON FIXES
              </Text>
              <View style={{ gap: 14 }}>
                {catalog.issues.map((issue, idx) => (
                  <SlideCard key={issue.key} index={idx}>
                    <ServiceCard
                      issue={issue}
                      popular={idx === 0}
                      estimatedMins={meta.estimatedMins}
                      gradient={meta.gradient}
                      onPress={() => handleSelect(issue)}
                    />
                  </SlideCard>
                ))}
              </View>
            </>
          )}

          {/* ── AI fallback ── */}
          <SlideCard index={(catalog?.issues.length ?? 0) + 1}>
            <View style={{ marginTop: 28, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: Theme.border }} />
                <Text style={{ color: Theme.textLight, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }}>
                  NOT LISTED?
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: Theme.border }} />
              </View>

              <Pressable
                onPress={() => router.push({ pathname: '/(customer)/diagnose', params: { category, resetKey: Date.now().toString() } })}
                style={({ pressed }) => ({
                  backgroundColor: Theme.navy,
                  borderRadius: 20, padding: 18, overflow: 'hidden',
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                {/* Decorative orbs */}
                <View style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(245,184,0,0.1)' }} />
                <View style={{ position: 'absolute', left: -10, bottom: -10, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(27,111,232,0.12)' }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 14,
                    backgroundColor: Theme.amber,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="sparkles" size={22} color={Theme.navy} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>
                      Describe your issue
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3, lineHeight: 16 }}>
                      Photo · voice · text — our AI identifies the fault and quotes you instantly.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
                </View>
              </Pressable>
            </View>
          </SlideCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
