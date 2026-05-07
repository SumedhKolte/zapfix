import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Colors } from '@/constants/colors';
import { useJob } from '@/hooks/useJob';
import { ProAssignedCard } from '@/components/customer/ProAssignedCard';
import { JobStatusBar } from '@/components/customer/JobStatusBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatCurrency } from '@/utils/formatCurrency';

export default function JobTracking() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobQuery } = useJob({ jobId: id });

  const job = jobQuery.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>Job Tracking</Text>
          <Ionicons name="share" size={20} color={Colors.navy.primary} />
        </View>

        {job ? (
          <ProAssignedCard
            name="Assigned Pro"
            rating={4.8}
            skill="Certified Technician"
            distanceKm={2.3}
            score={9.1}
            jobsCompleted={47}
            hasPart
          />
        ) : null}

        {job?.status ? <JobStatusBar status={job.status} /> : null}

        <Card>
          <MapView
            style={{ width: '100%', height: 180, borderRadius: 12 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: 28.6139,
              longitude: 77.209,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
            }}
          >
            <Marker coordinate={{ latitude: 28.6139, longitude: 77.209 }} />
          </MapView>
        </Card>

        <Card>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.navy.primary }}>Job Details</Text>
          <Text style={{ color: Colors.darkGray, marginTop: 6 }}>{job?.ai_diagnosis}</Text>
          <Text style={{ color: Colors.midGray, marginTop: 4 }}>Estimated cost</Text>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>
            {formatCurrency(job?.est_cost_min ?? 0)} - {formatCurrency(job?.est_cost_max ?? 0)}
          </Text>
        </Card>

        {job?.status ? <StatusPill status={job.status} /> : null}

        {job?.status === 'matched' || job?.status === 'in_transit' ? (
          <Button variant="danger">Cancel Job</Button>
        ) : null}

        {job?.status === 'working' ? <Button>Contact Pro</Button> : null}

        {job?.status === 'completed' ? (
          <Button onPress={() => router.push('/(customer)/job/complete')}>Rate Your Pro</Button>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
