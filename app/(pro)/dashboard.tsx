import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useJob } from '@/hooks/useJob';
import { getAvailability, updateAvailability } from '@/services/availability';
import { subscribeToOpenJobRequests } from '@/services/jobs';
import { formatCurrency } from '@/utils/formatCurrency';
import { distanceKm, normalizeGeoPoint } from '@/utils/geo';

/* ── Hero header card ─────────────────────────────────────────────── */
function HeroHeader({
  fullName,
  avatarUrl,
  skillScore,
  jobsDone,
  isOnline,
  onToggle,
  busy,
  onAvatarPress,
}: {
  fullName: string;
  avatarUrl?: string | null;
  skillScore: number;
  jobsDone: number;
  isOnline: boolean;
  onToggle: () => void;
  busy: boolean;
  onAvatarPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const nameTranslate = useRef(new Animated.Value(-18)).current;
  const avatarScale = useRef(new Animated.Value(0.6)).current;
  const pill1 = useRef(new Animated.Value(0)).current;
  const pill2 = useRef(new Animated.Value(0)).current;
  const pill3 = useRef(new Animated.Value(0)).current;

  const knobX = useRef(new Animated.Value(isOnline ? 1 : 0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const onlineGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(nameTranslate, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, tension: 100, friction: 9, delay: 120, useNativeDriver: true }),
      Animated.stagger(80, [
        Animated.spring(pill1, { toValue: 1, tension: 110, friction: 10, useNativeDriver: true }),
        Animated.spring(pill2, { toValue: 1, tension: 110, friction: 10, useNativeDriver: true }),
        Animated.spring(pill3, { toValue: 1, tension: 110, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(knobX, {
      toValue: isOnline ? 1 : 0,
      tension: 90,
      friction: 11,
      useNativeDriver: false,
    }).start();
    Animated.timing(onlineGlow, {
      toValue: isOnline ? 1 : 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) {
      pulse.setValue(0);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [isOnline]);

  const knobLeft = knobX.interpolate({ inputRange: [0, 1], outputRange: [3, 31] });
  const trackColor = onlineGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.midGray + '70', Colors.success],
  });
  const onlineTextOpacity = onlineGlow;
  const offlineTextOpacity = onlineGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.6] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const greet = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <Animated.View
      style={{
        opacity,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 30,
        shadowColor: Colors.navy.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 22,
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={[Colors.navy.primary, Colors.navy.light, Colors.amber.primary]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 22,
          paddingTop: 18,
          paddingBottom: 28,
          borderRadius: 30,
          overflow: 'hidden',
        }}
      >
        {/* Top row: greeting */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>
            {greet}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <Animated.View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: isOnline ? Colors.success : Colors.midGray,
            }} />
            <Animated.Text style={{ color: Colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
              {isOnline ? 'LIVE' : 'AWAY'}
            </Animated.Text>
          </View>
        </View>

        {/* Name + Avatar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Animated.View style={{ flex: 1, paddingRight: 14, transform: [{ translateX: nameTranslate }] }}>
            <Text
              style={{
                color: Colors.white,
                fontSize: 30,
                fontWeight: '800',
                letterSpacing: -0.5,
                lineHeight: 36,
              }}
              numberOfLines={2}
            >
              {fullName}
            </Text>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
            <Pressable onPress={onAvatarPress}>
              <View
                style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: Colors.navy.primary,
                  borderWidth: 3, borderColor: Colors.white,
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
                  overflow: 'hidden',
                }}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <Text style={{ color: Colors.amber.primary, fontSize: 22, fontWeight: '800' }}>{initials || '?'}</Text>
                )}
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* Pro stats + availability */}
        <View style={{ gap: 10, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Skill Score */}
            <Animated.View
              style={{
                flex: 1,
                opacity: pill1,
                transform: [{ translateY: pill1.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
              }}
            >
              <View
                style={{
                  paddingHorizontal: 12, paddingVertical: 8,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: Colors.amber.primary,
                  backgroundColor: 'rgba(255, 200, 75, 0.12)',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  minHeight: 40,
                }}
              >
                <Ionicons name="star" size={13} color={Colors.amber.primary} />
                <Text style={{ color: Colors.amber.primary, fontSize: 12, fontWeight: '700' }}>Skill Score</Text>
                <Text style={{ color: Colors.amber.primary, fontSize: 13, fontWeight: '900' }}>{skillScore}</Text>
              </View>
            </Animated.View>

            {/* Jobs Done */}
            <Animated.View
              style={{
                flex: 1,
                opacity: pill2,
                transform: [{ translateY: pill2.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
              }}
            >
              <View
                style={{
                  paddingHorizontal: 12, paddingVertical: 8,
                  borderRadius: 14,
                  backgroundColor: 'rgba(13,27,62,0.68)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.18)',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  minHeight: 40,
                }}
              >
                <Ionicons name="briefcase" size={13} color={Colors.white} />
                <Text style={{ color: Colors.white, fontSize: 12, fontWeight: '700' }}>Jobs Done</Text>
                <Text style={{ color: Colors.white, fontSize: 13, fontWeight: '900' }}>
                  {jobsDone >= 320 ? '320+' : jobsDone}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Online toggle pill */}
          <Animated.View
            style={{
              opacity: pill3,
              transform: [{ translateY: pill3.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            <Pressable onPress={busy ? undefined : onToggle} disabled={busy}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.96)',
                  shadowColor: isOnline ? Colors.success : '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isOnline ? 0.35 : 0.15,
                  shadowRadius: 10,
                  elevation: 6,
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {/* Label (crossfaded) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: isOnline ? Colors.success + '18' : Colors.lightGray, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={isOnline ? 'flash' : 'moon'} size={14} color={isOnline ? Colors.success : Colors.midGray} />
                  </View>
                  <View style={{ position: 'relative', minWidth: 74, alignItems: 'flex-start' }}>
                    <Animated.Text
                      style={{
                        color: Colors.success,
                        fontSize: 13, fontWeight: '800',
                        opacity: onlineTextOpacity,
                      }}
                    >
                      Online
                    </Animated.Text>
                    <Animated.Text
                      style={{
                        position: 'absolute',
                        color: Colors.midGray,
                        fontSize: 13, fontWeight: '800',
                        opacity: offlineTextOpacity,
                      }}
                    >
                      Offline
                    </Animated.Text>
                  </View>
                </View>

                {/* Track */}
                <View style={{ width: 54, height: 28, justifyContent: 'center' }}>
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: 0, right: 0, height: 28, borderRadius: 14,
                      backgroundColor: trackColor as any,
                    }}
                  />
                  {/* Knob with pulse */}
                  <Animated.View
                    style={{
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: Colors.white,
                      position: 'absolute', top: 3,
                      left: knobLeft,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.25, shadowRadius: 2, elevation: 3,
                    }}
                  >
                    {isOnline ? (
                      <Animated.View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: Colors.success,
                          opacity: pulseOpacity,
                          transform: [{ scale: pulseScale }],
                        }}
                      />
                    ) : null}
                  </Animated.View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

/* ── Stat card ────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, accent }: any) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 14,
        gap: 8,
        shadowColor: Colors.navy.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            backgroundColor: accent ? Colors.amber.primary + '20' : Colors.navy.primary + '12',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={15} color={accent ? Colors.amber.dark : Colors.navy.primary} />
        </View>
        <Text style={{ fontSize: 11, color: Colors.midGray, flex: 1, fontWeight: '600', letterSpacing: 0.3 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.navy.primary }}>{value}</Text>
    </View>
  );
}

function OpenRequestCard({ job, onPress, index }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay: index * 50, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 90, friction: 10, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const scheduling = (job?.ai_raw_response as any)?.scheduling;
  const scheduledAt = scheduling?.scheduled_at ? new Date(scheduling.scheduled_at) : null;
  const scheduledLabel = scheduledAt
    ? scheduledAt.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : 'Time not set';

  const max = job?.est_cost_max ?? 0;
  const payout = max > 0 ? Math.round(max * 0.75) : 0;

  const minutesAgo = job?.created_at
    ? Math.max(0, Math.round((Date.now() - new Date(job.created_at).getTime()) / 60000))
    : null;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: Colors.white,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: Colors.amber.primary + '70',
          padding: 16,
          gap: 10,
          shadowColor: Colors.amber.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 14,
          elevation: 4,
        }}
      >
        {/* Top */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.amber.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.amber.dark }} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.amber.dark, letterSpacing: 0.6 }}>NEW REQUEST</Text>
          </View>
          {minutesAgo !== null ? (
            <Text style={{ fontSize: 10, color: Colors.midGray, fontWeight: '700' }}>
              {minutesAgo === 0 ? 'just now' : `${minutesAgo}m ago`}
            </Text>
          ) : null}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.navy.primary }} numberOfLines={2}>
          {job.ai_diagnosis ?? 'Repair request'}
        </Text>

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 2, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="calendar-outline" size={13} color={Colors.midGray} />
            <Text style={{ fontSize: 12, color: Colors.darkGray, fontWeight: '700' }}>{scheduledLabel}</Text>
          </View>
          {payout > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="wallet-outline" size={13} color={Colors.amber.dark} />
              <Text style={{ fontSize: 12, color: Colors.amber.dark, fontWeight: '800' }}>~{formatCurrency(payout)} payout</Text>
            </View>
          ) : null}
        </View>

        <View
          style={{
            marginTop: 6,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: Colors.midGray, fontSize: 12, fontWeight: '600' }}>
            Tap to accept · decline · propose another time
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.navy.primary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { proDetailsQuery, updateProDetails } = useProfile(profile?.id ?? '');
  const { openRequestsQuery, jobsQuery } = useJob({ proId: profile?.id, openRequests: true });
  const [busy, setBusy] = useState(false);

  // Source-of-truth: pro_availability row.
  const availabilityQuery = useQuery({
    queryKey: ['pro-availability', profile?.id],
    queryFn: () => getAvailability(profile?.id ?? ''),
    enabled: Boolean(profile?.id),
    staleTime: 15 * 1000,
  });

  const isOnline = Boolean(availabilityQuery.data?.is_online);

  // Realtime: any new/updated open request bubbles up immediately.
  useEffect(() => {
    const unsub = subscribeToOpenJobRequests(() => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'open-requests'] });
    });
    return () => unsub();
  }, [queryClient]);

  // Refetch on focus — covers the case where the pro returns to the dashboard.
  useFocusEffect(
    useCallback(() => {
      availabilityQuery.refetch();
      openRequestsQuery.refetch();
      jobsQuery.refetch();
    }, [])
  );

  const toggleOnline = async () => {
    if (!profile?.id || busy) return;
    setBusy(true);
    try {
      if (!isOnline) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location required',
            'We need your location to send you jobs nearby. Enable location permission in Settings and try again.'
          );
          setBusy(false);
          return;
        }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await updateProDetails({
          id: profile.id,
          data: {
            current_location: {
              type: 'Point',
              coordinates: [current.coords.longitude, current.coords.latitude],
            },
          },
        });
        await updateAvailability({
          pro_id: profile.id,
          is_online: true,
          last_ping: new Date().toISOString(),
        });
      } else {
        await updateAvailability({
          pro_id: profile.id,
          is_online: false,
          last_ping: new Date().toISOString(),
        });
      }
      await availabilityQuery.refetch();
      await openRequestsQuery.refetch();
    } catch (err) {
      console.error('toggleOnline failed', err);
      Alert.alert(
        'Could not update status',
        err instanceof Error ? err.message : 'Please check your connection and try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const onRefresh = async () => {
    await Promise.all([
      availabilityQuery.refetch(),
      openRequestsQuery.refetch(),
      jobsQuery.refetch(),
    ]);
  };

  const proLocation = normalizeGeoPoint(proDetailsQuery.data?.current_location);
  const serviceRadiusKm = proDetailsQuery.data?.service_radius_km ?? 10;
  const openRequests = useMemo(() => {
    const requests = openRequestsQuery.data ?? [];
    if (!proLocation) return requests;
    return requests.filter((job) => {
      const jobLocation = normalizeGeoPoint(job.job_location);
      if (!jobLocation) return false;
      return distanceKm(proLocation, jobLocation) <= serviceRadiusKm;
    });
  }, [
    openRequestsQuery.data,
    proLocation?.latitude,
    proLocation?.longitude,
    serviceRadiusKm,
  ]);
  const todayJobs = useMemo(
    () =>
      (jobsQuery.data ?? []).filter((j) => {
        if (!j.matched_at) return false;
        const d = new Date(j.matched_at);
        const t = new Date();
        return d.toDateString() === t.toDateString();
      }),
    [jobsQuery.data]
  );
  const earnedToday = todayJobs.reduce((acc, j) => acc + (j.final_cost ? j.final_cost * 0.75 : 0), 0);
  const completedAllTime = (jobsQuery.data ?? []).filter((j) => j.status === 'completed').length;

  const skillScore = proDetailsQuery.data?.ai_skill_score ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={openRequestsQuery.isRefetching || availabilityQuery.isRefetching} onRefresh={onRefresh} tintColor={Colors.navy.primary} />
        }
      >
        <HeroHeader
          fullName={profile?.full_name ?? 'Professional'}
          avatarUrl={profile?.avatar_url}
          skillScore={skillScore}
          jobsDone={completedAllTime}
          isOnline={isOnline}
          onToggle={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
            toggleOnline();
          }}
          busy={busy}
          onAvatarPress={() => router.push('/(pro)/profile')}
        />

        <View style={{ paddingHorizontal: 20, gap: 18, marginTop: 18 }}>
          {/* Stats grid */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.text.primary, letterSpacing: 0.5, marginLeft: 4, marginBottom: 2 }}>
              TODAY
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard label="Jobs" value={String(todayJobs.length)} icon="briefcase-outline" />
              <StatCard label="Earned" value={formatCurrency(earnedToday)} icon="wallet-outline" accent />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard label="Incoming" value={String(openRequests.length)} icon="notifications-outline" accent />
              <StatCard label="Status" value={isOnline ? 'Online' : 'Offline'} icon="pulse-outline" />
            </View>
          </View>

          {/* Open requests */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.text.primary }}>
                Incoming Job Requests
              </Text>
              {openRequests.length > 0 ? (
                <View style={{ backgroundColor: Colors.amber.primary, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 }}>
                  <Text style={{ color: Colors.navy.primary, fontSize: 11, fontWeight: '800' }}>{openRequests.length}</Text>
                </View>
              ) : null}
            </View>

            {!isOnline ? (
              <View
                style={{
                  backgroundColor: Colors.amber.light,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderWidth: 1,
                  borderColor: Colors.amber.primary + '40',
                }}
              >
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.amber.primary + '30', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="moon" size={20} color={Colors.amber.dark} />
                </View>
                <Text style={{ flex: 1, color: Colors.amber.text, fontSize: 13, fontWeight: '600' }}>
                  You're offline. Toggle above to start receiving live job requests.
                </Text>
              </View>
            ) : openRequests.length === 0 ? (
              <View
                style={{
                  backgroundColor: Colors.white,
                  borderRadius: 16,
                  padding: 28,
                  alignItems: 'center',
                  gap: 10,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderStyle: 'dashed',
                }}
              >
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.navy.primary + '10', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="hourglass-outline" size={24} color={Colors.navy.primary} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.text.primary }}>No incoming requests</Text>
                <Text style={{ fontSize: 12, color: Colors.midGray, textAlign: 'center' }}>
                  We'll notify you the moment a customer books a slot near you.
                </Text>
              </View>
            ) : (
              openRequests.map((job, index) => (
                <OpenRequestCard
                  key={job.id}
                  job={job}
                  index={index}
                  onPress={() => router.push(`/(pro)/request/${job.id}`)}
                />
              ))
            )}
          </View>

          {/* Quick links */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={() => router.push('/(pro)/job/active')}
              style={{ flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.navy.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="briefcase" size={15} color={Colors.navy.primary} />
              </View>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text.primary }}>Active job</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.midGray} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(pro)/earnings')}
              style={{ flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.amber.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="wallet" size={15} color={Colors.amber.dark} />
              </View>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text.primary }}>Earnings</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.midGray} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
