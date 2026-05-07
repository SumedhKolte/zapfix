import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import type { Enums } from '@/types/database';

type JobHistoryItemProps = {
  faultName: string;
  proName?: string | null;
  date: string;
  status: Enums<'job_status'>;
  onPress?: () => void;
};

export const JobHistoryItem = ({ faultName, proName, date, status, onPress }: JobHistoryItemProps) => {
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.amber.light,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="flash" size={18} color={Colors.amber.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.navy.primary }}>{faultName}</Text>
          <Text style={{ fontSize: 12, color: Colors.midGray }}>{proName ?? 'Pending Pro'} · {date}</Text>
        </View>
        <StatusPill status={status} />
      </View>
    </Card>
  );
};
