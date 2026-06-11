// Standalone "add parts" utility reached from the Inventory tab's + button.
// (No longer part of the onboarding chain — it does not change onboarding_step.)
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { InventoryItem } from '@/components/pro/InventoryItem';
import { getCatalogParts } from '@/services/catalog';
import { upsertInventory } from '@/services/inventory';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

export default function AddInventory() {
  const router = useRouter();
  const { colors: Colors } = useTheme();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const partsQuery = useQuery({ queryKey: ['catalog-parts'], queryFn: getCatalogParts });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const parts = partsQuery.data ?? [];

  const handleChange = (partId: string, delta: number) =>
    setQuantities((prev) => ({ ...prev, [partId]: Math.max(0, (prev[partId] ?? 0) + delta) }));

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([partId, qty]) => ({ pro_id: profile.id, part_id: partId, quantity: qty }));
      await upsertInventory(items);
      await queryClient.invalidateQueries({ queryKey: ['inventory', profile.id] });
      router.back();
    } catch (err) {
      console.error('Could not save inventory', err);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={20} color={Colors.white} />
          </Pressable>
          <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }}>Add parts</Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>
          Pros with parts in stock get matched first.
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
        {partsQuery.isLoading ? (
          <Text style={{ color: Colors.midGray }}>Loading parts…</Text>
        ) : parts.length === 0 ? (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>No parts found</Text>
            <Text style={{ color: Colors.midGray, marginTop: 4 }}>The parts catalog is empty right now.</Text>
          </View>
        ) : (
          parts.map((part) => (
            <InventoryItem
              key={part.id}
              name={part.part_name}
              category={part.category}
              partNumber={part.part_number}
              averagePrice={part.avg_price_inr}
              quantity={quantities[part.id] ?? 0}
              onIncrement={() => handleChange(part.id, 1)}
              onDecrement={() => handleChange(part.id, -1)}
            />
          ))
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <Button onPress={handleSave} loading={saving} disabled={saving}>Save to inventory</Button>
      </View>
    </SafeAreaView>
  );
}
