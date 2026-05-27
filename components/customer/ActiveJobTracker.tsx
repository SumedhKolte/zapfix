import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';
import type { Enums } from '@/types/database';

type JobStatus = Enums<'job_status'>;

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  white: '#FFFFFF',
  textLight: '#A0A8C5',
};

// Jobs that should still show in the live tracker.
const LIVE_STATUSES: JobStatus[] = [
  'triage',
  'searching',
  'matched',
  'in_transit',
  'arrived',
  'working',
];

const labelFor = (status: JobStatus) => {
  switch (status) {
    case 'triage':
      return 'Analysing your problem';
    case 'searching':
      return 'Finding a nearby Pro';
    case 'matched':
      return 'Pro assigned · scheduled';
    case 'in_transit':
      return 'Pro is on the way';
    case 'arrived':
      return 'Pro has arrived';
    case 'working':
      return 'Service in progress';
    default:
      return 'In progress';
  }
};

const iconFor = (status: JobStatus) => {
  switch (status) {
    case 'in_transit':
      return 'car-sport';
    case 'arrived':
      return 'home';
    case 'working':
      return 'construct';
    case 'matched':
      return 'checkmark-circle';
    case 'searching':
      return 'search';
    default:
      return 'flash';
  }
};

export const ActiveJobTracker = () => {
  const router = useRouter();
  const { profile } = useAuth();
  const { jobsQuery } = useJob({ customerId: profile?.id });

  const activeJob = useMemo(() => {
    const list = jobsQuery.data ?? [];
    // Most recent live booking — sorted newest first by the query.
    return list.find((job) => LIVE_STATUSES.includes(job.status as JobStatus)) ?? null;
  }, [jobsQuery.data]);

  const translateY = useRef(new Animated.Value(80)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: activeJob ? 0 : 80,
      tension: 90,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [activeJob, translateY]);

  useEffect(() => {
    if (!activeJob) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activeJob, shimmer]);

  if (!activeJob) return null;

  const status = activeJob.status as JobStatus;
  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 320],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: Platform.OS === 'ios' ? 96 : 88,
        transform: [{ translateY }],
        zIndex: 50,
        elevation: 50,
      }}
    >
      <Pressable
        onPress={() => router.push(`/(customer)/job/${activeJob.id}`)}
        style={{
          backgroundColor: Theme.navy,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          overflow: 'hidden',
          shadowColor: Theme.navy,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        {/* Shimmer */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 80,
            backgroundColor: 'rgba(245,184,0,0.18)',
            transform: [{ translateX: shimmerTranslate }, { skewX: '-20deg' }],
          }}
        />

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: Theme.amber,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={iconFor(status) as any} size={18} color={Theme.navy} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: Theme.white, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
            {labelFor(status)}
          </Text>
          <Text style={{ color: Theme.textLight, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
            {activeJob.ai_diagnosis ?? 'Tap to view live status'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Theme.amber} />
      </Pressable>
    </Animated.View>
  );
};
