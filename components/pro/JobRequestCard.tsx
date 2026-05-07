import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CountdownTimer } from './CountdownTimer';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '@/utils/formatCurrency';

type JobRequestCardProps = {
  fault: string;
  distanceKm: number;
  earnings: number;
  hasPart: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onExpire: () => void;
};

export const JobRequestCard = ({
  fault,
  distanceKm,
  earnings,
  hasPart,
  onAccept,
  onDecline,
  onExpire
}: JobRequestCardProps) => {
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.navy.primary }}>New Job Request</Text>
        <CountdownTimer seconds={90} onExpire={onExpire} />
      </View>
      <View style={{ marginTop: 12, gap: 8 }}>
        <Text style={{ fontSize: 14, color: Colors.navy.primary, fontWeight: '600' }}>{fault}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="location" size={14} color={Colors.midGray} />
          <Text style={{ color: Colors.midGray }}>{distanceKm.toFixed(1)} km away</Text>
        </View>
        <Badge
          label={hasPart ? 'Part in stock' : 'Part needed'}
          backgroundColor={hasPart ? `${Colors.success}1A` : Colors.amber.light}
          textColor={hasPart ? Colors.success : Colors.amber.dark}
        />
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.amber.primary }}>
          {formatCurrency(earnings)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Button variant="secondary" onPress={onDecline} style={{ flex: 1 }}>
          Decline
        </Button>
        <Button onPress={onAccept} style={{ flex: 1 }}>
          Accept Job
        </Button>
      </View>
    </Card>
  );
};
