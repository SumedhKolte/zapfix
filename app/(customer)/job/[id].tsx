import { useRef, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { useJob } from '@/hooks/useJob';
import { ProAssignedCard } from '@/components/customer/ProAssignedCard';
import { JobStatusBar } from '@/components/customer/JobStatusBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatCurrency } from '@/utils/formatCurrency';

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

function ActionButton({ label, icon, onPress, variant = 'primary' }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';
  const isDanger  = variant === 'danger';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          backgroundColor: isDanger ? Theme.error + '10' : isPrimary ? Theme.amber : Theme.creamCard,
          borderRadius: 16, paddingVertical: 15,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          borderWidth: 1.5,
          borderColor: isDanger ? Theme.error + '30' : isPrimary ? Theme.amber : Theme.border,
        }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isDanger ? Theme.error : isPrimary ? Theme.navy : Theme.textMid}
        />
        <Text style={{
          fontWeight: '800', fontSize: 15,
          color: isDanger ? Theme.error : isPrimary ? Theme.navy : Theme.textMid,
        }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function JobTracking() {
  const router = useRouter();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const { jobQuery } = useJob({ jobId: id });
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  const job = jobQuery.data;

  const statusLabels: Record<string, string> = {
    triage:     'Analysing your problem',
    searching:  'Finding the best Pro for you',
    matched:    'Pro has been assigned',
    in_transit: 'Pro is on the way',
    arrived:    'Pro has arrived',
    working:    'Repair in progress',
    completed:  'Job completed',
    disputed:   'Issue raised',
    cancelled:  'Job cancelled',
  };

  const statusLabel = job?.status ? (statusLabels[job.status] ?? job.status) : 'Loading...';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>

      {/* Header */}
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color={Theme.white} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                JOB TRACKING
              </Text>
              <Text style={{ color: Theme.white, fontSize: 17, fontWeight: '800' }} numberOfLines={1}>
                {job?.ai_diagnosis ?? 'Loading...'}
              </Text>
            </View>
            {job?.status ? <StatusPill status={job.status} /> : null}
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 16, gap: 14 }}
      >
        {/* Status message banner */}
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
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark, marginBottom: 14 }}>
                Job Progress
              </Text>
              <JobStatusBar status={job.status} />
            </View>
          </Section>
        ) : null}

        {/* Map */}
        <Section>
          <MapView
            style={{ width: '100%', height: 180 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: 28.6139,
              longitude: 77.209,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={{ latitude: 28.6139, longitude: 77.209 }} />
          </MapView>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            padding: 13, borderTopWidth: 1, borderTopColor: Theme.border,
          }}>
            <Ionicons name="location" size={16} color={Theme.blue} />
            <Text style={{ fontSize: 13, color: Theme.textMid }}>
              Live tracking available once Pro is en route
            </Text>
          </View>
        </Section>

        {/* Job Details */}
        <Section>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark, marginBottom: 12 }}>
              Job Details
            </Text>
            {[
              { label: 'Problem',  value: job?.ai_diagnosis ?? '—'          },
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

        {/* Action Buttons */}
        <View style={{ gap: 10 }}>
          {job?.status === 'working' ? (
            <ActionButton
              label="Contact Pro"
              icon="call-outline"
              onPress={() => Alert.alert('Contact Pro', 'Call feature coming soon.')}
            />
          ) : null}

          {job?.status === 'completed' ? (
            <ActionButton
              label="Rate Your Pro"
              icon="star-outline"
              onPress={() => router.push('/(customer)/job/complete')}
            />
          ) : null}

          {(job?.status === 'matched' || job?.status === 'in_transit') ? (
            <ActionButton
              label="Cancel Job"
              icon="close-circle-outline"
              variant="danger"
              onPress={() =>
                Alert.alert('Cancel Job', 'Are you sure you want to cancel this job?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes, Cancel', style: 'destructive', onPress: () => router.replace('/(customer)/home') },
                ])
              }
            />
          ) : null}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
