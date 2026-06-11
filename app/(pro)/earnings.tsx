import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getEarnings } from '@/services/earnings';
import { EarningsSummary } from '@/components/pro/EarningsSummary';
import { formatCurrency } from '@/utils/formatCurrency';

function formatPaidAt(value?: string | null) {
  if (!value) return 'Pending payout';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SummaryTile({ icon, label, value, accent }: any) {
  const { colors: Colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 14,
        gap: 8,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: accent ? Colors.success + '12' : Colors.blue.light,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={16} color={accent ? Colors.success : Colors.blue.primary} />
      </View>
      <Text style={{ color: Colors.midGray, fontSize: 11, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function EarningCard({ jobId, amount, grossAmount, commission, paidAt }: any) {
  const { colors: Colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
        gap: 12,
        shadowColor: Colors.navy.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View
        style={{
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
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.text.primary }} numberOfLines={1}>
              Job #{String(jobId).slice(0, 8)}
            </Text>
            <Text style={{ fontSize: 12, color: Colors.midGray, marginTop: 2 }}>{formatPaidAt(paidAt)}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '900', color: Colors.success }}>+{formatCurrency(amount)}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.midGray, fontSize: 11, fontWeight: '700' }}>Gross</Text>
          <Text style={{ color: Colors.darkGray, fontSize: 13, fontWeight: '800', marginTop: 2 }}>{formatCurrency(grossAmount ?? amount)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.midGray, fontSize: 11, fontWeight: '700' }}>Commission</Text>
          <Text style={{ color: Colors.darkGray, fontSize: 13, fontWeight: '800', marginTop: 2 }}>{formatCurrency(commission ?? 0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.midGray, fontSize: 11, fontWeight: '700' }}>Status</Text>
          <Text style={{ color: Colors.success, fontSize: 13, fontWeight: '800', marginTop: 2 }}>{paidAt ? 'Paid' : 'Queued'}</Text>
        </View>
      </View>
    </View>
  );
}

export default function Earnings() {
  const { colors: Colors } = useTheme();
  const { profile } = useAuth();
  const earningsQuery = useQuery({
    queryKey: ['earnings', profile?.id ?? ''],
    queryFn: () => getEarnings(profile?.id ?? ''),
    enabled: Boolean(profile?.id),
  });

  const total = earningsQuery.data?.reduce((sum, item) => sum + item.net_payout, 0) ?? 0;
  const totalGross = earningsQuery.data?.reduce((sum, item) => sum + item.gross_amount, 0) ?? 0;
  const totalCommission = earningsQuery.data?.reduce((sum, item) => sum + item.commission_amount, 0) ?? 0;
  const jobs = earningsQuery.data?.length ?? 0;
  const average = jobs > 0 ? total / jobs : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={earningsQuery.isRefetching} onRefresh={() => earningsQuery.refetch()} tintColor={Colors.navy.primary} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[Colors.navy.primary, Colors.navy.light, Colors.blue.primary]}
          locations={[0, 0.72, 1]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 34 }}
        >
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Ionicons name="wallet" size={22} color={Colors.amber.primary} />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: '700' }}>
            Available Earnings
          </Text>
          <Text style={{ color: Colors.white, fontSize: 34, fontWeight: '900', marginTop: 4 }}>
            {formatCurrency(total)}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6 }}>
            {jobs} completed {jobs === 1 ? 'job' : 'jobs'}
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, gap: 16, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SummaryTile icon="trending-up" label="Average" value={formatCurrency(average)} accent />
            <SummaryTile icon="receipt-outline" label="Gross" value={formatCurrency(totalGross)} />
            <SummaryTile icon="swap-horizontal" label="Fees" value={formatCurrency(totalCommission)} />
          </View>

          {/* Summary Card */}
          <EarningsSummary total={total} jobs={earningsQuery.data?.length ?? 0} label="All time" />

          {/* Earnings List */}
          {earningsQuery.data && earningsQuery.data.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 }}>
                Recent Earnings
              </Text>
              {earningsQuery.data.map((earning) => (
                <EarningCard
                  key={earning.id}
                  jobId={earning.job_id}
                  amount={earning.net_payout}
                  grossAmount={earning.gross_amount}
                  commission={earning.commission_amount}
                  paidAt={earning.paid_at}
                />
              ))}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: Colors.surface,
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
