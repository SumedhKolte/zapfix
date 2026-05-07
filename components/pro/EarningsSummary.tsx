import { Text, View } from 'react-native';

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
      <Text style={{ fontSize: 12, color: Colors.midGray }}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.navy.primary }}>
        {formatCurrency(total)}
      </Text>
      <Text style={{ fontSize: 12, color: Colors.darkGray }}>{jobs} jobs</Text>
    </Card>
  );
};
