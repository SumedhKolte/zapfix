import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useJob } from '@/hooks/useJob';
import { JobHistoryItem } from '@/components/customer/JobHistoryItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function Jobs() {
  const router = useRouter();
  const { profile } = useAuth();
  const { jobsQuery } = useJob({ customerId: profile?.id });
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const filteredJobs = useMemo(() => {
    const jobs = jobsQuery.data ?? [];
    if (tab === 'active') {
      return jobs.filter((job) => job.status !== 'completed' && job.status !== 'cancelled');
    }
    return jobs.filter((job) => job.status === 'completed' || job.status === 'cancelled');
  }, [jobsQuery.data, tab]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <View style={{ padding: 24, gap: 12, flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.navy.primary }}>My Jobs</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button variant={tab === 'active' ? 'primary' : 'secondary'} onPress={() => setTab('active')}>
            Active
          </Button>
          <Button variant={tab === 'completed' ? 'primary' : 'secondary'} onPress={() => setTab('completed')}>
            Completed
          </Button>
        </View>

        {filteredJobs.length === 0 ? (
          <EmptyState
            title="No jobs yet"
            description="Describe a problem to get started."
            ctaLabel="Start a diagnosis"
            onCtaPress={() => router.push('/(customer)/diagnose')}
          />
        ) : (
          <FlashList
            data={filteredJobs}
            estimatedItemSize={84}
            keyExtractor={(item) => item.id}
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
