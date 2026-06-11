import { useMemo, useState, useRef, useEffect } from 'react';
import { Text, View, Pressable, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';
import { JobHistoryItem } from '@/components/customer/JobHistoryItem';
import { useTheme } from '@/hooks/useTheme';

function EmptyJobState({ tab, onPress }: { tab: string; onPress: () => void }) {
  const { theme: Theme } = useTheme();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60,
      opacity: fadeAnim, transform: [{ scale: scaleAnim }],
    }}>
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: Theme.navy + '12',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <Ionicons
          name={tab === 'active' ? 'briefcase-outline' : 'checkmark-circle-outline'}
          size={36} color={Theme.textDark}
        />
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: Theme.textDark, marginBottom: 8 }}>
        {tab === 'active' ? 'No active jobs' : 'No completed jobs'}
      </Text>
      <Text style={{ fontSize: 14, color: Theme.textMid, textAlign: 'center', maxWidth: 220, lineHeight: 20 }}>
        {tab === 'active'
          ? 'Describe a problem to get matched with a pro'
          : 'Your completed jobs will appear here'}
      </Text>
      {tab === 'active' ? (
        <Pressable
          onPress={onPress}
          style={{
            marginTop: 24, backgroundColor: Theme.amber,
            borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
          }}
        >
          <Text style={{ color: Theme.navy, fontWeight: '800', fontSize: 14 }}>Start a Diagnosis</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export default function Jobs() {
  const { theme: Theme } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { jobsQuery } = useJob({ customerId: profile?.id });
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleTabChange = (newTab: 'active' | 'completed') => {
    setTab(newTab);
    Animated.spring(slideAnim, {
      toValue: newTab === 'active' ? 0 : 1,
      tension: 130,
      friction: 11,
      useNativeDriver: false,
    }).start();
  };

  const filteredJobs = useMemo(() => {
    const jobs = jobsQuery.data ?? [];
    if (tab === 'active') {
      return jobs.filter((job) => job.status !== 'completed' && job.status !== 'cancelled');
    }
    return jobs.filter((job) => job.status === 'completed' || job.status === 'cancelled');
  }, [jobsQuery.data, tab]);

  const tabIndicatorLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '52%'],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>

      {/* Header */}
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: Theme.white }}>My Jobs</Text>
            <View style={{
              backgroundColor: Theme.amber,
              borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
            }}>
              <Text style={{ fontSize: 12, color: Theme.navy, fontWeight: '800' }}>
                {filteredJobs.length} {tab}
              </Text>
            </View>
          </View>

          {/* Tab Switcher — pill style on navy background */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: 14,
            padding: 4,
            position: 'relative',
            height: 46,
          }}>
            <Animated.View style={{
              position: 'absolute',
              left: tabIndicatorLeft,
              top: 4,
              width: '46%',
              height: 38,
              backgroundColor: Theme.amber,
              borderRadius: 11,
            }} />
            {(['active', 'completed'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => handleTabChange(t)}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: tab === t ? Theme.navy : 'rgba(255,255,255,0.6)',
                }}>
                  {t === 'active' ? 'Active' : 'Completed'}
                </Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        {filteredJobs.length === 0 ? (
          <EmptyJobState tab={tab} onPress={() => router.push({ pathname: '/(customer)/diagnose', params: { resetKey: Date.now().toString() } })} />
        ) : (
          <FlashList
            data={filteredJobs}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <JobHistoryItem
                faultName={item.ai_diagnosis ?? 'Job'}
                proName={item.pro_id}
                date={item.created_at ?? ''}
                status={item.status ?? 'triage'}
                onPress={() => router.push(`/(customer)/job/${item.id}`)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}