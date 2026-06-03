import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ProTheme } from '@/constants/proTheme';
import { ProCard } from './ProCard';
import { formatCurrency } from '@/utils/formatCurrency';

type InventoryItemProps = {
  name: string;
  category?: string | null;
  partNumber?: string | null;
  averagePrice?: number | null;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

export const InventoryItem = ({ name, category, partNumber, averagePrice, quantity, onIncrement, onDecrement }: InventoryItemProps) => {
  const isLowStock = quantity <= 1;

  return (
    <ProCard
      padding={14}
      borderColor={isLowStock ? ProTheme.colors.warning + '55' : ProTheme.colors.border}
      style={{ gap: 12 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isLowStock ? ProTheme.colors.amberLight : ProTheme.colors.blueLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="hardware-chip-outline" size={18} color={isLowStock ? ProTheme.colors.warning : ProTheme.colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: ProTheme.colors.navy }} numberOfLines={2}>{name}</Text>
            <Text style={{ fontSize: 12, color: ProTheme.colors.text.muted, marginTop: 3 }} numberOfLines={1}>
              {[category, partNumber].filter(Boolean).join(' · ') || 'Inventory part'}
            </Text>
          </View>
        </View>
        <View style={{ backgroundColor: isLowStock ? ProTheme.colors.amberLight : ProTheme.colors.success + '12', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, color: isLowStock ? ProTheme.colors.warning : ProTheme.colors.success, fontWeight: '900' }}>
            {isLowStock ? 'LOW' : 'READY'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View>
          <Text style={{ color: ProTheme.colors.text.muted, fontSize: 11, fontWeight: '700' }}>Avg. price</Text>
          <Text style={{ color: ProTheme.colors.text.secondary, fontSize: 13, fontWeight: '800', marginTop: 2 }}>
            {averagePrice ? formatCurrency(averagePrice) : 'Not set'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={onDecrement}
            disabled={quantity === 0}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: ProTheme.colors.card,
              borderWidth: 1,
              borderColor: ProTheme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: quantity === 0 ? 0.45 : 1,
            }}
          >
            <Ionicons name="remove" size={18} color={ProTheme.colors.navy} />
          </Pressable>
          <View style={{ minWidth: 38, height: 36, borderRadius: 12, backgroundColor: ProTheme.colors.navy + '10', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: ProTheme.colors.navy }}>{quantity}</Text>
          </View>
          <Pressable
            onPress={onIncrement}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: ProTheme.colors.amber,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={18} color={ProTheme.colors.navy} />
          </Pressable>
        </View>
      </View>
    </ProCard>
  );
};
