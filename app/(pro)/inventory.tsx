import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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

  const totalItems = inventoryQuery.data?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.navy.primary, Colors.navy.light]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>
            Parts Management
          </Text>
          <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
            My Inventory
          </Text>
          <View
            style={{
              marginTop: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: Colors.amber.primary + '20',
              borderRadius: 10,
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="cube-outline" size={14} color={Colors.amber.primary} />
            <Text style={{ color: Colors.amber.primary, fontSize: 12, fontWeight: '600' }}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 24, gap: 12, paddingTop: 20 }}>
          {inventoryQuery.data && inventoryQuery.data.length > 0 ? (
            inventoryQuery.data.map((item) => (
              <InventoryItem
                key={item.part_id}
                name={item.catalog_parts?.part_name ?? 'Part'}
                quantity={item.quantity ?? 0}
                onIncrement={() => handleUpdate(item.part_id, (item.quantity ?? 0) + 1)}
                onDecrement={() => handleUpdate(item.part_id, Math.max(0, (item.quantity ?? 0) - 1))}
              />
            ))
          ) : (
            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: Colors.border,
                paddingVertical: 40,
                paddingHorizontal: 24,
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: Colors.lightGray,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="cube-outline" size={24} color={Colors.midGray} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text.primary, textAlign: 'center' }}>
                No Items Yet
              </Text>
              <Text style={{ fontSize: 12, color: Colors.midGray, textAlign: 'center' }}>
                Add parts to your inventory
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
