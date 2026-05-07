import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getEarnings } from '@/services/earnings';
import { EarningsSummary } from '@/components/pro/EarningsSummary';
import { formatCurrency } from '@/utils/formatCurrency';

export default function Earnings() {
  const { profile } = useAuth();
  const earningsQuery = useQuery({
    queryKey: ['earnings', profile?.id ?? ''],
    queryFn: () => getEarnings(profile?.id ?? ''),
    enabled: Boolean(profile?.id)
  });

  const total = earningsQuery.data?.reduce((sum, item) => sum + item.net_payout, 0) ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.navy.primary }}>Earnings</Text>
        <EarningsSummary total={total} jobs={earningsQuery.data?.length ?? 0} label="All time" />

        <View style={{ gap: 8 }}>
          {earningsQuery.data?.map((earning) => (
            <View key={earning.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Job {earning.job_id}</Text>
              <Text style={{ color: Colors.midGray }}>{formatCurrency(earning.net_payout)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
