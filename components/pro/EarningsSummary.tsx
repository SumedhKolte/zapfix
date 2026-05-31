import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ProTheme } from '@/constants/proTheme';
import { ProCard } from './ProCard';
import { formatCurrency } from '@/utils/formatCurrency';

type EarningsSummaryProps = {
  total: number;
  jobs: number;
  label: string;
};

export const EarningsSummary = ({ total, jobs, label }: EarningsSummaryProps) => {
  return (
    <ProCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: ProTheme.colors.text.muted, fontWeight: '700' }}>{label}</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: ProTheme.colors.navy, marginTop: 4 }}>
            {formatCurrency(total)}
          </Text>
          <Text style={{ fontSize: 12, color: ProTheme.colors.text.secondary, marginTop: 4 }}>{jobs} jobs paid</Text>
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: ProTheme.colors.success + '12', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cash-outline" size={22} color={ProTheme.colors.success} />
        </View>
      </View>
    </ProCard>
  );
};
