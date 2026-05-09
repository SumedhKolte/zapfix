import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatDate } from '@/utils/formatDate';

const Theme = {
  navy: '#0F2057',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  blue: '#1B6FE8',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  success: '#1A7A4A',
  successLight: '#E8F5E3',
  warning: '#C07A00',
  warningLight: '#FFF3E0',
  error: '#C23232',
  errorLight: '#FFF0F0',
};

type WarrantyCardProps = {
  appliance: string;
  validUntil: string;
  expired?: boolean;
  onPress?: () => void;
};

export const WarrantyCard = ({ appliance, validUntil, expired, onPress }: WarrantyCardProps) => {
  const daysLeft = Math.ceil(
    (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const isExpiringSoon = !expired && daysLeft <= 30 && daysLeft > 0;
  const isExpired      = expired || daysLeft <= 0;

  const config = isExpired
    ? { color: Theme.error,   bg: Theme.errorLight,   icon: 'shield-outline',    statusText: 'Expired'         }
    : isExpiringSoon
      ? { color: Theme.warning, bg: Theme.warningLight, icon: 'shield-half',       statusText: `${daysLeft}d left` }
      : { color: Theme.navy,    bg: Theme.navy + '0D',  icon: 'shield-checkmark',  statusText: 'Active'          };

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: Theme.creamCard,
        borderRadius: 16, padding: 14, width: 160,
        borderWidth: 1, borderColor: isExpired ? Theme.error + '30'
          : isExpiringSoon ? Theme.amber + '40' : Theme.navy + '25',
        shadowColor: Theme.navy,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: config.bg,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={config.icon as any} size={18} color={config.color} />
        </View>
        <View style={{
          backgroundColor: config.bg, borderRadius: 6,
          paddingHorizontal: 7, paddingVertical: 2,
        }}>
          <Text style={{ fontSize: 10, color: config.color, fontWeight: '700' }}>
            {config.statusText}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark, marginTop: 10 }}>
        {appliance}
      </Text>
      <Text style={{ fontSize: 11, color: Theme.textMid, marginTop: 2 }}>
        {isExpired ? 'Expired' : 'Until'} {formatDate(validUntil)}
      </Text>
    </Pressable>
  );
};