import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Card } from '../ui/Card';
import { formatDate } from '@/utils/formatDate';

type WarrantyCardProps = {
  appliance: string;
  validUntil: string;
  expired?: boolean;
};

export const WarrantyCard = ({ appliance, validUntil, expired }: WarrantyCardProps) => {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name="shield-checkmark" size={24} color={expired ? Colors.midGray : Colors.success} />
        <View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.navy.primary }}>{appliance}</Text>
          <Text style={{ fontSize: 12, color: expired ? Colors.midGray : Colors.darkGray }}>
            Protected until {formatDate(validUntil)}
          </Text>
        </View>
      </View>
    </Card>
  );
};
