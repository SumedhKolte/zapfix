import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { useJob } from '@/hooks/useJob';
import { formatCurrency } from '@/utils/formatCurrency';

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
  white: '#FFFFFF',
  success: '#1A7A4A',
  successLight: '#E8F5EE',
  error: '#C23232',
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  searching:   { label: 'Awaiting Pro',     color: '#1A3580', bg: '#FFF8D6', icon: 'time' },
  matched:     { label: 'Pro Confirmed',    color: '#0F2057', bg: '#E8F0FF', icon: 'checkmark-circle' },
  in_transit:  { label: 'Pro on the way',   color: '#0F2057', bg: '#E8F0FF', icon: 'car' },
  arrived:     { label: 'Pro arrived',      color: '#0F2057', bg: '#E8F0FF', icon: 'location' },
  working:     { label: 'In progress',      color: '#0F2057', bg: '#FFF8D6', icon: 'build' },
  completed:   { label: 'Completed',        color: '#1A7A4A', bg: '#E8F5EE', icon: 'checkmark-done' },
  cancelled:   { label: 'Cancelled',        color: '#C23232', bg: '#FFF0F0', icon: 'close-circle' },
  disputed:    { label: 'Disputed',         color: '#C23232', bg: '#FFF0F0', icon: 'alert-circle' },
  triage:      { label: 'Triage',           color: '#4A5578', bg: '#E2E6F0', icon: 'hourglass' },
};

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Theme.border }}>
      <Text style={{ color: Theme.textMid, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: Theme.textDark, fontSize: 13, fontWeight: '700', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

export default function ReceiptDetail() {
  const router = useRouter();
  const { id, justBooked } = useLocalSearchParams<{ id: string; justBooked?: string }>();
  const { jobQuery } = useJob({ jobId: id });
  const job = jobQuery.data;

  const isJustBooked = justBooked === '1';

  const checkScale = useRef(new Animated.Value(isJustBooked ? 0 : 1)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isJustBooked) {
      Animated.sequence([
        Animated.spring(checkScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isJustBooked]);

  if (jobQuery.isLoading || !job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Theme.textMid }}>Loading receipt…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scheduling = (job.ai_raw_response as any)?.scheduling;
  const scheduledAt = scheduling?.scheduled_at ? new Date(scheduling.scheduled_at) : null;
  const scheduledLabel = scheduledAt
    ? scheduledAt.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : '—';

  const status = job.status ?? 'searching';
  const meta = STATUS_META[status] ?? STATUS_META.searching;

  const headline = isJustBooked
    ? 'Booking confirmed'
    : status === 'completed'
      ? 'Service receipt'
      : status === 'cancelled'
        ? 'Booking cancelled'
        : 'Booking details';

  const subline = isJustBooked
    ? "We're notifying nearby pros. You'll get a push as soon as one accepts your slot."
    : status === 'completed'
      ? 'Tap below to view the full job timeline or rate your Pro.'
      : status === 'cancelled'
        ? 'This booking is no longer active.'
        : 'Your booking is being tracked. Open job tracking for live status.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Theme.navy, Theme.navyMid]} style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 56, alignItems: 'center' }}>
          {/* Back row for non-just-booked views */}
          {!isJustBooked ? (
            <View style={{ flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center', marginBottom: 12 }}>
              <Pressable
                onPress={() => router.back()}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back" size={20} color={Theme.white} />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center', paddingRight: 38 }}>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>RECEIPT</Text>
              </View>
            </View>
          ) : null}

          {/* Brand mark */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Image source={require('../../../assets/icon.png')} style={{ width: 32, height: 32, borderRadius: 8 }} resizeMode="cover" />
            <Text style={{ color: Theme.white, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>Zapfix</Text>
          </View>

          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <View style={{
              width: isJustBooked ? 96 : 72,
              height: isJustBooked ? 96 : 72,
              borderRadius: isJustBooked ? 48 : 36,
              backgroundColor: status === 'cancelled' ? Theme.error : status === 'completed' ? Theme.success : Theme.amber,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: Theme.amber,
              shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 14,
            }}>
              <Ionicons
                name={(status === 'cancelled' ? 'close' : status === 'completed' ? 'checkmark-done' : 'checkmark') as any}
                size={isJustBooked ? 52 : 36}
                color={Theme.white}
              />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fade, alignItems: 'center', marginTop: 18 }}>
            <Text style={{ color: Theme.white, fontSize: 24, fontWeight: '800' }}>{headline}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 6, textAlign: 'center', maxWidth: 280 }}>
              {subline}
            </Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View style={{ opacity: fade, paddingHorizontal: 20, marginTop: -28 }}>
          {/* Receipt card */}
          <View style={{ backgroundColor: Theme.creamCard, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: Theme.border, shadowColor: Theme.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: Theme.navy + '12', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="receipt" size={15} color={Theme.navy} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark }}>Booking receipt</Text>
              <View style={{ marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Theme.amberLight, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: Theme.navy }}>#{job.id.slice(-6).toUpperCase()}</Text>
              </View>
            </View>

            <ReceiptRow label="Service" value={job.ai_diagnosis ?? 'Home repair'} />
            <ReceiptRow label="Scheduled" value={scheduledLabel} />
            {scheduling?.note ? <ReceiptRow label="Note" value={scheduling.note} /> : null}
            <ReceiptRow
              label={job.final_cost ? 'Final cost' : 'Estimated cost'}
              value={
                job.final_cost
                  ? formatCurrency(job.final_cost)
                  : job.est_cost_min && job.est_cost_max
                    ? `${formatCurrency(job.est_cost_min)} – ${formatCurrency(job.est_cost_max)}`
                    : 'Calculated after diagnosis'
              }
            />
            <ReceiptRow label="Payment" value={job.final_cost ? 'Paid' : 'Pay after job completion'} />
            {job.created_at ? (
              <ReceiptRow
                label="Booked on"
                value={new Date(job.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              />
            ) : null}
            {job.completed_at ? (
              <ReceiptRow
                label="Completed on"
                value={new Date(job.completed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              />
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
              <Text style={{ color: Theme.textMid, fontSize: 13 }}>Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: meta.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                <Text style={{ color: meta.color, fontSize: 12, fontWeight: '800' }}>{meta.label}</Text>
              </View>
            </View>
          </View>

          {/* What's next — only shown for in-progress states */}
          {isJustBooked || ['searching', 'matched', 'in_transit', 'arrived'].includes(status) ? (
            <View style={{ marginTop: 16, backgroundColor: Theme.creamCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Theme.border }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.textDark, marginBottom: 12 }}>What happens next</Text>
              {[
                { icon: 'search', text: 'A nearby pro reviews your booking' },
                { icon: 'time', text: 'Pro accepts your slot — or proposes a different time' },
                { icon: 'car', text: 'Pro travels to you on the scheduled day' },
                { icon: 'shield-checkmark', text: 'Pay only after the job is complete' },
              ].map((step, i) => (
                <View key={step.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: Theme.navy + '0F', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={step.icon as any} size={14} color={Theme.navy} />
                  </View>
                  <Text style={{ flex: 1, color: Theme.textMid, fontSize: 13 }}>{step.text}</Text>
                  <Text style={{ color: Theme.textLight, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={{ gap: 10, marginTop: 18 }}>
            {['searching', 'matched', 'in_transit', 'arrived', 'working'].includes(status) ? (
              <Button onPress={() => router.replace(`/(customer)/job/${job.id}`)}>
                Track this booking
              </Button>
            ) : null}
            {status === 'completed' ? (
              <Button onPress={() => router.replace(`/(customer)/job/${job.id}`)}>
                View job details
              </Button>
            ) : null}
            <Button variant="secondary" onPress={() => router.replace(isJustBooked ? '/(customer)/home' : '/(customer)/receipts')}>
              {isJustBooked ? 'Back to home' : 'Back to receipts'}
            </Button>
          </View>

          <Text style={{ color: Theme.textLight, fontSize: 11, textAlign: 'center', marginTop: 18 }}>
            Booked via Zapfix · Receipt saved to your profile
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
