import { Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { Enums } from '@/types/database';

type StatusPillProps = {
  status: Enums<'job_status'>;
};

const statusMap: Record<
  Enums<'job_status'>,
  { label: string; color: string; pulsing?: boolean }
> = {
  triage: { label: 'Analysing', color: Colors.midGray },
  searching: { label: 'Finding Pro', color: Colors.amber.primary, pulsing: true },
  matched: { label: 'Pro Assigned', color: Colors.blue.primary },
  in_transit: { label: 'On the Way', color: Colors.blue.primary },
  arrived: { label: 'Pro Arrived', color: Colors.blue.primary },
  working: { label: 'In Progress', color: Colors.amber.primary, pulsing: true },
  completed: { label: 'Completed', color: Colors.success },
  disputed: { label: 'Disputed', color: Colors.error },
  cancelled: { label: 'Cancelled', color: Colors.midGray }
};

export const StatusPill = ({ status }: StatusPillProps) => {
  const meta = statusMap[status];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: `${meta.color}1A`
      }}
    >
      {meta.pulsing ? (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: meta.color,
            marginRight: 6
          }}
        />
      ) : null}
      <Text style={{ color: meta.color, fontSize: 12, fontWeight: '600' }}>{meta.label}</Text>
    </View>
  );
};
