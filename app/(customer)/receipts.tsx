import { useMemo, useRef, useEffect } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTheme } from '@/hooks/useTheme';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  searching:  { label: 'Awaiting Pro',   color: '#1A3580', bg: '#FFF8D6' },
  matched:    { label: 'Confirmed',      color: '#0F2057', bg: '#E8F0FF' },
  in_transit: { label: 'On the way',     color: '#0F2057', bg: '#E8F0FF' },
  arrived:    { label: 'Arrived',        color: '#0F2057', bg: '#E8F0FF' },
  working:    { label: 'In progress',    color: '#0F2057', bg: '#FFF8D6' },
  completed:  { label: 'Completed',      color: '#1A7A4A', bg: '#E8F5EE' },
  cancelled:  { label: 'Cancelled',      color: '#C23232', bg: '#FFF0F0' },
  disputed:   { label: 'Disputed',       color: '#C23232', bg: '#FFF0F0' },
  triage:     { label: 'Triage',         color: '#4A5578', bg: '#E2E6F0' },
};

function ReceiptItem({ job, index, onPress }: any) {
  const { theme: Theme } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 90, friction: 10, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const scheduling = (job.ai_raw_response as any)?.scheduling;
  const scheduledAt = scheduling?.scheduled_at ? new Date(scheduling.scheduled_at) : null;
  const scheduledLabel = scheduledAt
    ? scheduledAt.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : 'Not scheduled';

  const status = job.status ?? 'searching';
  const meta = STATUS_META[status] ?? STATUS_META.searching;
  const isCompleted = status === 'completed';

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: Theme.creamCard, borderRadius: 16, padding: 16, marginBottom: 12,
          borderWidth: 1, borderColor: Theme.border,
          shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: isCompleted ? Theme.successLight : Theme.amberLight,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons
              name={isCompleted ? 'checkmark-done' : 'receipt'}
              size={20}
              color={isCompleted ? Theme.success : Theme.navy}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark }} numberOfLines={1}>
              {job.ai_diagnosis ?? 'Service'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="calendar-outline" size={11} color={Theme.textLight} />
              <Text style={{ fontSize: 11, color: Theme.textMid }}>{scheduledLabel}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={{ backgroundColor: meta.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ color: meta.color, fontSize: 10, fontWeight: '800' }}>{meta.label}</Text>
            </View>
            {job.final_cost ? (
              <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.textDark }}>{formatCurrency(job.final_cost)}</Text>
            ) : job.est_cost_max ? (
              <Text style={{ fontSize: 11, color: Theme.textLight }}>~{formatCurrency(job.est_cost_max)}</Text>
            ) : null}
          </View>
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Theme.border,
        }}>
          <Text style={{ fontSize: 11, color: Theme.textLight }}>
            Receipt #{job.id.slice(-6).toUpperCase()}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.textDark }}>View receipt</Text>
            <Ionicons name="chevron-forward" size={14} color={Theme.textDark} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Receipts() {
  const { theme: Theme } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { jobsQuery } = useJob({ customerId: profile?.id });
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Only jobs that have a booking attached (i.e. went through the slot flow)
  const receipts = useMemo(() => {
    return (jobsQuery.data ?? []).filter((job) => (job.ai_raw_response as any)?.scheduling?.scheduled_at);
  }, [jobsQuery.data]);

  const completedReceipts = receipts.filter((j) => j.status === 'completed');
  const totalSpent = completedReceipts.reduce((acc, j) => acc + (j.final_cost ?? 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient colors={[Theme.navy, Theme.navyMid]} style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={Theme.white} />
            </Pressable>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>BOOKING HISTORY</Text>
              <Text style={{ color: Theme.white, fontSize: 22, fontWeight: '800' }}>Receipts</Text>
            </View>
          </View>
          {receipts.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>TOTAL BOOKINGS</Text>
                <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '800', marginTop: 2 }}>{receipts.length}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>COMPLETED</Text>
                <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '800', marginTop: 2 }}>{completedReceipts.length}</Text>
              </View>
              {totalSpent > 0 ? (
                <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>TOTAL SPENT</Text>
                  <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '800', marginTop: 2 }}>{formatCurrency(totalSpent)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </LinearGradient>
      </Animated.View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {jobsQuery.isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Text style={{ color: Theme.textMid }}>Loading receipts…</Text>
          </View>
        ) : receipts.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Theme.navy + '0F', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="receipt-outline" size={32} color={Theme.textDark} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: Theme.textDark }}>No receipts yet</Text>
            <Text style={{ fontSize: 13, color: Theme.textMid, textAlign: 'center', maxWidth: 240 }}>
              Once you book a Pro through the Diagnose flow, your receipts will live here.
            </Text>
            <View style={{ marginTop: 12, width: '80%' }}>
              <Button onPress={() => router.replace({ pathname: '/(customer)/diagnose', params: { resetKey: Date.now().toString() } })}>Start a diagnosis</Button>
            </View>
          </View>
        ) : (
          receipts.map((job, i) => (
            <ReceiptItem
              key={job.id}
              job={job}
              index={i}
              onPress={() => router.push({ pathname: '/(customer)/receipt/[id]', params: { id: job.id } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
