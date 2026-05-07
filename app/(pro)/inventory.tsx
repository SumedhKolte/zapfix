import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { getInventory, updateInventoryItem } from '@/services/inventory';
import { InventoryItem } from '@/components/pro/InventoryItem';

export default function Inventory() {
  const { profile } = useAuth();
  const inventoryQuery = useQuery({
    queryKey: ['inventory', profile?.id ?? ''],
    queryFn: () => getInventory(profile?.id ?? ''),
    enabled: Boolean(profile?.id),
    staleTime: 10 * 1000
  });

  const handleUpdate = async (partId: string, next: number) => {
    if (!profile?.id) {
      return;
    }
    await updateInventoryItem(profile.id, partId, next);
    inventoryQuery.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.navy.primary }}>My Inventory</Text>
        {inventoryQuery.data?.map((item) => (
          <InventoryItem
            key={item.part_id}
            name={item.catalog_parts?.part_name ?? 'Part'}
            quantity={item.quantity ?? 0}
            onIncrement={() => handleUpdate(item.part_id, (item.quantity ?? 0) + 1)}
            onDecrement={() => handleUpdate(item.part_id, Math.max(0, (item.quantity ?? 0) - 1))}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
