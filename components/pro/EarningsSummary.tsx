import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Card } from '../ui/Card';
import { formatCurrency } from '@/utils/formatCurrency';

type EarningsSummaryProps = {
  total: number;
  jobs: number;
  label: string;
};

export const EarningsSummary = ({ total, jobs, label }: EarningsSummaryProps) => {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: Colors.midGray, fontWeight: '700' }}>{label}</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.navy.primary, marginTop: 4 }}>
            {formatCurrency(total)}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.darkGray, marginTop: 4 }}>{jobs} jobs paid</Text>
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.success + '12', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="cash-outline" size={22} color={Colors.success} />
        </View>
      </View>
    </Card>
  );
};
