import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getEarnings } from '@/services/earnings';
import { EarningsSummary } from '@/components/pro/EarningsSummary';
import { formatCurrency } from '@/utils/formatCurrency';

function EarningCard({ jobId, amount }: any) {
  return (
    <View
      style={{
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: Colors.amber.light,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="wallet-outline" size={18} color={Colors.amber.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text.primary }}>Job #{jobId}</Text>
          <Text style={{ fontSize: 11, color: Colors.midGray, marginTop: 2 }}>Completed</Text>
        </View>
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.success }}>+{formatCurrency(amount)}</Text>
    </View>
  );
}

export default function Earnings() {
  const { profile } = useAuth();
  const earningsQuery = useQuery({
    queryKey: ['earnings', profile?.id ?? ''],
    queryFn: () => getEarnings(profile?.id ?? ''),
    enabled: Boolean(profile?.id),
  });

  const total = earningsQuery.data?.reduce((sum, item) => sum + item.net_payout, 0) ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.navy.primary, Colors.navy.light]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>
            Your Earnings
          </Text>
          <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
            {formatCurrency(total)}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6 }}>
            {earningsQuery.data?.length ?? 0} completed jobs
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, gap: 16, paddingTop: 20 }}>
          {/* Summary Card */}
          <EarningsSummary total={total} jobs={earningsQuery.data?.length ?? 0} label="All time" />

          {/* Earnings List */}
          {earningsQuery.data && earningsQuery.data.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 }}>
                Recent Earnings
              </Text>
              {earningsQuery.data.map((earning) => (
                <EarningCard key={earning.id} jobId={earning.job_id} amount={earning.net_payout} />
              ))}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: Colors.border,
                paddingVertical: 40,
                paddingHorizontal: 24,
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: Colors.lightGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="wallet-outline" size={24} color={Colors.midGray} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text.primary, textAlign: 'center' }}>
                No Earnings Yet
              </Text>
              <Text style={{ fontSize: 12, color: Colors.midGray, textAlign: 'center' }}>
                Complete jobs to earn money
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
