import { useRef } from 'react';
import { Text, View, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Enums } from '@/types/database';

const Theme = {
  navy: '#0F2057',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  blue: '#1B6FE8',
  blueLight: '#E8F0FF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  success: '#1A7A4A',
  warning: '#C07A00',
  error: '#C23232',
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  triage:     { label: 'Analysing',  color: Theme.blue,    bg: Theme.blueLight,        icon: 'hardware-chip'      },
  searching:  { label: 'Matching',   color: Theme.amber,   bg: Theme.amberLight,       icon: 'search'             },
  matched:    { label: 'Matched',    color: Theme.navy,    bg: Theme.navy + '12',      icon: 'person'             },
  in_transit: { label: 'On the way', color: Theme.blue,    bg: Theme.blueLight,        icon: 'car'                },
  arrived:    { label: 'Arrived',    color: Theme.warning, bg: '#FFF3E0',              icon: 'location'           },
  working:    { label: 'Fixing',     color: Theme.warning, bg: '#FFF3E0',              icon: 'build'              },
  completed:  { label: 'Done',       color: Theme.success, bg: Theme.success + '15',   icon: 'checkmark-circle'   },
  disputed:   { label: 'Disputed',   color: Theme.error,   bg: Theme.error + '12',     icon: 'alert-circle'       },
  cancelled:  { label: 'Cancelled',  color: Theme.textMid, bg: Theme.border,           icon: 'close-circle'       },
};

type JobHistoryItemProps = {
  faultName: string;
  proName?: string | null;
  date: string;
  status: Enums<'job_status'>;
  onPress?: () => void;
};

export const JobHistoryItem = ({ faultName, proName, date, status, onPress }: JobHistoryItemProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const cfg   = statusConfig[status] ?? statusConfig.triage;

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 10 }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          backgroundColor: Theme.creamCard,
          borderRadius: 16, padding: 14,
          flexDirection: 'row', alignItems: 'center', gap: 12,
          borderWidth: 1, borderColor: Theme.border,
          shadowColor: Theme.navy,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
        }}
      >
        <View style={{
          width: 42, height: 42, borderRadius: 13,
          backgroundColor: cfg.bg,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }} numberOfLines={1}>
            {faultName}
          </Text>
          <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 2 }}>
            {proName ?? 'Pending Pro'} · {formattedDate}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{
            backgroundColor: cfg.bg, borderRadius: 8,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <Text style={{ fontSize: 11, color: cfg.color, fontWeight: '700' }}>{cfg.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Theme.textLight} />
        </View>
      </Pressable>
    </Animated.View>
  );
};