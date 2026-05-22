import { useRef, useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { useJob } from '@/hooks/useJob';
import { useAuth } from '@/hooks/useAuth';
import { ProAssignedCard } from '@/components/customer/ProAssignedCard';
import { JobStatusBar } from '@/components/customer/JobStatusBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { createNotification } from '@/services/notifications';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  blue: '#1B6FE8',
  blueLight: '#E8F0FF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  error: '#C23232',
  errorLight: '#FFF0F0',
  success: '#1A7A4A',
};

function Section({ children, style }: any) {
  return (
    <View style={{
      backgroundColor: Theme.creamCard, borderRadius: 20,
      borderWidth: 1, borderColor: Theme.border,
      overflow: 'hidden',
      shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
      ...style,
    }}>
      {children}
    </View>
  );
}

export default function JobTracking() {
  const router = useRouter();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { jobQuery, acceptCounterOffer, declineCounterOffer, cancelJob } = useJob({ jobId: id });
  const headerAnim = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState<'accept' | 'decline' | 'cancel' | null>(null);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  const job = jobQuery.data;
  const scheduling = (job?.ai_raw_response as any)?.scheduling;
  const scheduledAt = scheduling?.scheduled_at ? new Date(scheduling.scheduled_at) : null;
  const scheduledLabel = scheduledAt
    ? scheduledAt.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : null;

  const counter = (job?.ai_raw_response as any)?.counter_offer;
  const hasOpenCounter = counter && !counter.accepted_at && !counter.declined_at;
  const counterAt = counter?.proposed_at ? new Date(counter.proposed_at) : null;

  const statusLabels: Record<string, string> = {
    triage:     'Analysing your problem',
    searching:  hasOpenCounter ? 'Pro proposed a different time' : 'Awaiting a Pro to accept your slot',
    matched:    'Pro confirmed your booking',
    in_transit: 'Pro is on the way',
    arrived:    'Pro has arrived',
    working:    'Repair in progress',
    completed:  'Job completed',
    disputed:   'Issue raised',
    cancelled:  'Job cancelled',
  };

  const statusLabel = job?.status ? (statusLabels[job.status] ?? job.status) : 'Loading...';

  const handleAcceptCounter = async () => {
    if (!id) return;
    setBusy('accept');
    try {
      await acceptCounterOffer({ jobId: id });
      if (counter?.pro_id) {
        await createNotification({
          userId: counter.pro_id,
          title: 'Customer accepted your time',
          body: `${profile?.full_name ?? 'Your customer'} accepted the new slot. Get ready.`,
          jobId: id,
          deepLink: `/(pro)/dashboard`,
        });
      }
      Alert.alert('Confirmed', 'Your booking is set for the new time.');
    } catch (err) {
      console.error(err);
      Alert.alert('Could not accept', 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleDeclineCounter = async () => {
    if (!id) return;
    setBusy('decline');
    try {
      await declineCounterOffer({ jobId: id });
      if (counter?.pro_id) {
        await createNotification({
          userId: counter.pro_id,
          title: 'Customer declined the new time',
          body: 'They want to stick with their original slot — we\'ll search for another Pro.',
          jobId: id,
        });
      }
      Alert.alert('Declined', 'We\'ll find another Pro for your original slot.');
    } catch (err) {
      console.error(err);
      Alert.alert('Could not decline', 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleCancelJob = async () => {
    if (!id) return;
    setBusy('cancel');
    try {
      await cancelJob({ jobId: id });
      Alert.alert('Cancelled', 'Your booking has been cancelled.', [
        { text: 'OK', onPress: () => router.replace('/(customer)/home') }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Could not cancel', 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={Theme.white} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>JOB TRACKING</Text>
              <Text style={{ color: Theme.white, fontSize: 17, fontWeight: '800' }} numberOfLines={1}>
                {job?.ai_diagnosis ?? 'Loading...'}
              </Text>
            </View>
            {job?.status ? <StatusPill status={job.status} /> : null}
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 16, gap: 14 }}>

        {/* Counter-offer banner — high priority */}
        {hasOpenCounter && counterAt ? (
          <View style={{ backgroundColor: Theme.amber, borderRadius: 20, padding: 18, gap: 12, shadowColor: Theme.amber, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="time" size={20} color={Theme.navy} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.navy, letterSpacing: 0.5 }}>PRO PROPOSED A DIFFERENT TIME</Text>
            </View>
            {scheduledAt ? (
              <View>
                <Text style={{ fontSize: 11, color: Theme.navy, fontWeight: '700', opacity: 0.7 }}>YOUR ORIGINAL SLOT</Text>
                <Text style={{ fontSize: 14, color: Theme.navy, textDecorationLine: 'line-through', opacity: 0.6 }}>
                  {scheduledAt.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
            ) : null}
            <View>
              <Text style={{ fontSize: 11, color: Theme.navy, fontWeight: '700' }}>PRO PROPOSES</Text>
              <Text style={{ fontSize: 19, color: Theme.navy, fontWeight: '800' }}>
                {counterAt.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
            {counter.message ? (
              <View style={{ backgroundColor: 'rgba(15,32,87,0.08)', borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 13, color: Theme.navy, fontStyle: 'italic' }}>"{counter.message}"</Text>
              </View>
            ) : null}
            <View style={{ gap: 8 }}>
              <Button onPress={handleAcceptCounter} loading={busy === 'accept'} disabled={busy !== null}>
                Accept new time
              </Button>
              <Button variant="secondary" onPress={handleDeclineCounter} loading={busy === 'decline'} disabled={busy !== null}>
                Keep my original time
              </Button>
            </View>
          </View>
        ) : null}

        {/* Status banner */}
        {job?.status && job.status !== 'cancelled' && job.status !== 'completed' ? (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: Theme.amberLight, borderRadius: 14, padding: 13,
            borderWidth: 1, borderColor: Theme.amber + '40',
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.amber }} />
            <Text style={{ flex: 1, fontSize: 13, color: Theme.textDark, fontWeight: '600' }}>
              {statusLabel}
            </Text>
          </View>
        ) : null}

        {/* Scheduled time banner */}
        {scheduledLabel && !hasOpenCounter ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Theme.creamCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Theme.border }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.navy + '10', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar" size={16} color={Theme.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: Theme.textLight, fontWeight: '700' }}>SCHEDULED</Text>
              <Text style={{ fontSize: 14, color: Theme.textDark, fontWeight: '700' }}>{scheduledLabel}</Text>
            </View>
          </View>
        ) : null}

        {/* Pro Card */}
        {job && (job.status === 'matched' || job.status === 'in_transit' || job.status === 'arrived' || job.status === 'working' || job.status === 'completed') ? (
          <ProAssignedCard
            name="Assigned Pro"
            rating={4.8}
            skill="Certified Technician"
            distanceKm={2.3}
            score={9.1}
            jobsCompleted={47}
            hasPart
            onContact={
              job.status === 'in_transit' || job.status === 'arrived' || job.status === 'working'
                ? () => Alert.alert('Contact Pro', 'Call feature coming soon. The pro will reach out if needed.')
                : undefined
            }
          />
        ) : null}

        {/* Status Progress Bar */}
        {job?.status && !['triage', 'searching', 'cancelled'].includes(job.status) ? (
          <Section>
            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark, marginBottom: 14 }}>Job Progress</Text>
              <JobStatusBar status={job.status} />
            </View>
          </Section>
        ) : null}

        {/* Map */}
        {job?.status && ['in_transit', 'arrived', 'working'].includes(job.status) ? (
          <Section>
            <MapView
              style={{ width: '100%', height: 180 }}
              provider={PROVIDER_GOOGLE}
              initialRegion={{ latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            >
              <Marker coordinate={{ latitude: 28.6139, longitude: 77.209 }} />
            </MapView>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13, borderTopWidth: 1, borderTopColor: Theme.border }}>
              <Ionicons name="location" size={16} color={Theme.blue} />
              <Text style={{ fontSize: 13, color: Theme.textMid }}>
                Live tracking — Pro is en route
              </Text>
            </View>
          </Section>
        ) : null}

        {/* Job Details */}
        <Section>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark, marginBottom: 12 }}>Job Details</Text>
            {[
              { label: 'Problem',  value: job?.ai_diagnosis ?? '—' },
              { label: 'Est. Cost', value: job?.est_cost_min && job?.est_cost_max
                  ? `${formatCurrency(job.est_cost_min)} – ${formatCurrency(job.est_cost_max)}`
                  : '—' },
              { label: 'Confidence', value: job?.ai_confidence ? `${Math.round(job.ai_confidence * 100)}%` : '—' },
            ].map((row, i) => (
              <View key={row.label} style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 9,
                borderTopWidth: i > 0 ? 1 : 0, borderTopColor: Theme.border,
              }}>
                <Text style={{ fontSize: 13, color: Theme.textLight }}>{row.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textDark }}>{row.value}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Action Buttons — using chunky Button */}
        <View style={{ gap: 10, marginTop: 4 }}>
          {job?.status === 'working' ? (
            <Button
              variant="primary"
              onPress={() => Alert.alert('Contact Pro', 'Call feature coming soon.')}
              leftIcon={<Ionicons name="call-outline" size={18} color={Theme.navy} />}
            >
              Contact Pro
            </Button>
          ) : null}

          {job?.status === 'completed' ? (
            <Button
              onPress={() => router.push('/(customer)/job/complete')}
              leftIcon={<Ionicons name="star-outline" size={18} color={Theme.navy} />}
            >
              Rate Your Pro
            </Button>
          ) : null}

          {(job?.status === 'matched' || job?.status === 'in_transit' || (job?.status === 'searching' && !hasOpenCounter)) ? (
            <Button
              variant="danger"
              onPress={() =>
                Alert.alert('Cancel Job', 'Are you sure you want to cancel this job?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes, Cancel', style: 'destructive', onPress: handleCancelJob },
                ])
              }
              loading={busy === 'cancel'}
              disabled={busy !== null}
              leftIcon={<Ionicons name="close-circle-outline" size={18} color={Theme.white} />}
            >
              Cancel Job
            </Button>
          ) : null}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
