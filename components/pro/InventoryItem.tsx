import { Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Button } from '../ui/Button';

type InventoryItemProps = {
  name: string;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

export const InventoryItem = ({ name, quantity, onIncrement, onDecrement }: InventoryItemProps) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border
      }}
    >
      <View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.navy.primary }}>{name}</Text>
        {quantity <= 1 ? (
          <Text style={{ fontSize: 12, color: Colors.warning }}>Low stock</Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Button variant="secondary" size="sm" onPress={onDecrement}>
          -
        </Button>
        <Text style={{ fontSize: 14, fontWeight: '600' }}>{quantity}</Text>
        <Button size="sm" onPress={onIncrement}>
          +
        </Button>
      </View>
    </View>
  );
};
