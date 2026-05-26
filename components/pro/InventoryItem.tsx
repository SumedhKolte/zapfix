import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
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
    <View
      style={{
        backgroundColor: Colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isLowStock ? Colors.warning + '55' : Colors.border,
        padding: 14,
        gap: 12,
        shadowColor: Colors.navy.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isLowStock ? Colors.amber.light : Colors.blue.light, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="hardware-chip-outline" size={18} color={isLowStock ? Colors.warning : Colors.blue.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.navy.primary }} numberOfLines={2}>{name}</Text>
            <Text style={{ fontSize: 12, color: Colors.midGray, marginTop: 3 }} numberOfLines={1}>
              {[category, partNumber].filter(Boolean).join(' · ') || 'Inventory part'}
            </Text>
          </View>
        </View>
        <View style={{ backgroundColor: isLowStock ? Colors.amber.light : Colors.success + '12', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, color: isLowStock ? Colors.warning : Colors.success, fontWeight: '900' }}>
            {isLowStock ? 'LOW' : 'READY'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View>
          <Text style={{ color: Colors.midGray, fontSize: 11, fontWeight: '700' }}>Avg. price</Text>
          <Text style={{ color: Colors.darkGray, fontSize: 13, fontWeight: '800', marginTop: 2 }}>
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
              backgroundColor: Colors.white,
              borderWidth: 1,
              borderColor: Colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: quantity === 0 ? 0.45 : 1,
            }}
          >
            <Ionicons name="remove" size={18} color={Colors.navy.primary} />
          </Pressable>
          <View style={{ minWidth: 38, height: 36, borderRadius: 12, backgroundColor: Colors.navy.primary + '10', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: Colors.navy.primary }}>{quantity}</Text>
          </View>
          <Pressable
            onPress={onIncrement}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: Colors.amber.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={18} color={Colors.navy.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
