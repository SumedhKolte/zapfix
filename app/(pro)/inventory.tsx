import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { getInventory, updateInventoryItem } from '@/services/inventory';
import { InventoryItem } from '@/components/pro/InventoryItem';

function InventoryMetric({ icon, label, value, tone = 'navy' }: any) {
  const color = tone === 'warning' ? Colors.warning : tone === 'success' ? Colors.success : Colors.navy.primary;
  const bg = tone === 'warning' ? Colors.amber.light : tone === 'success' ? Colors.success + '12' : Colors.navy.primary + '10';
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 8 }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={{ color: Colors.midGray, fontSize: 11, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '900' }}>{value}</Text>
    </View>
  );
}

export default function Inventory() {
  const router = useRouter();
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
  const lowStock = inventoryQuery.data?.filter((item) => (item.quantity ?? 0) <= 1).length ?? 0;
  const categories = new Set((inventoryQuery.data ?? []).map((item) => item.catalog_parts?.category).filter(Boolean)).size;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={inventoryQuery.isRefetching} onRefresh={() => inventoryQuery.refetch()} tintColor={Colors.navy.primary} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[Colors.navy.primary, Colors.navy.light, Colors.blue.primary]}
          locations={[0, 0.74, 1]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 34 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' }}>
                Parts Management
              </Text>
              <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
                My Inventory
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(pro)/onboarding/inventory')}
              style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add" size={22} color={Colors.white} />
            </Pressable>
          </View>
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

        <View style={{ paddingHorizontal: 20, gap: 14, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <InventoryMetric icon="cube" label="Items" value={totalItems} tone="success" />
            <InventoryMetric icon="alert-circle" label="Low Stock" value={lowStock} tone="warning" />
            <InventoryMetric icon="apps" label="Categories" value={categories} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ color: Colors.text.primary, fontSize: 15, fontWeight: '800' }}>Parts List</Text>
            <Text style={{ color: Colors.midGray, fontSize: 12, fontWeight: '700' }}>{inventoryQuery.data?.length ?? 0} SKUs</Text>
          </View>

          {inventoryQuery.data && inventoryQuery.data.length > 0 ? (
            inventoryQuery.data.map((item) => (
              <InventoryItem
                key={item.part_id}
                name={item.catalog_parts?.part_name ?? 'Part'}
                category={item.catalog_parts?.category}
                partNumber={item.catalog_parts?.part_number}
                averagePrice={item.catalog_parts?.avg_price_inr}
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
