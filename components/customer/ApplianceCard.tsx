import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Card } from '../ui/Card';
import { formatDate } from '@/utils/formatDate';

export type ApplianceCardProps = {
  type: string;
  brand?: string | null;
  model?: string | null;
  healthScore: number;
  lastServicedAt?: string | null;
  nextServiceDue?: string | null;
};

export const ApplianceCard = ({
  type,
  brand,
  model,
  healthScore,
  lastServicedAt,
  nextServiceDue
}: ApplianceCardProps) => {
  const healthColor = healthScore > 70 ? Colors.success : healthScore > 40 ? Colors.amber.primary : Colors.error;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Ionicons name="cube" size={22} color={Colors.amber.primary} />
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.navy.primary }}>{type}</Text>
            <Text style={{ fontSize: 12, color: Colors.midGray }}>{brand} {model}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: healthColor }}>{healthScore}%</Text>
      </View>
      <View style={{ marginTop: 8, gap: 4 }}>
        {lastServicedAt ? (
          <Text style={{ color: Colors.darkGray, fontSize: 12 }}>Last serviced: {formatDate(lastServicedAt)}</Text>
        ) : null}
        {nextServiceDue ? (
          <Text style={{ color: Colors.darkGray, fontSize: 12 }}>Next due: {formatDate(nextServiceDue)}</Text>
        ) : null}
      </View>
    </Card>
  );
};
