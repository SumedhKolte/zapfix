import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { InventoryItem } from '@/components/pro/InventoryItem';
import { getCatalogParts } from '@/services/catalog';
import { upsertInventory } from '@/services/inventory';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function InventorySetup() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProDetails } = useProfile(profile?.id ?? '');
  const partsQuery = useQuery({ queryKey: ['catalog-parts'], queryFn: getCatalogParts });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const parts = partsQuery.data ?? [];

  const handleChange = (partId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [partId]: Math.max(0, (prev[partId] ?? 0) + delta)
    }));
  };

  const handleComplete = async () => {
    if (!profile?.id) {
      return;
    }

    setSaving(true);
    try {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([partId, qty]) => ({ pro_id: profile.id, part_id: partId, quantity: qty }));

      await upsertInventory(items);
      await updateProDetails({ id: profile.id, data: { onboarding_step: 'complete' } });
      router.replace('/(pro)/dashboard');
    } catch (err) {
      console.error('Could not save inventory', err);
      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 14, color: Colors.midGray }}>Step 5 of 5</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.navy.primary }}>What parts do you carry?</Text>
        <Text style={{ color: Colors.midGray }}>
          Pros with parts in stock get matched first.
        </Text>

        <View style={{ gap: 8 }}>
          {partsQuery.isLoading ? (
            <Text style={{ color: Colors.midGray }}>Loading starter parts…</Text>
          ) : parts.length === 0 ? (
            <View style={{ backgroundColor: Colors.lightGray, borderRadius: 14, padding: 16 }}>
              <Text style={{ color: Colors.navy.primary, fontWeight: '700' }}>No starter parts found</Text>
              <Text style={{ color: Colors.midGray, marginTop: 4 }}>
                You can complete setup now and add inventory later from the Inventory tab.
              </Text>
            </View>
          ) : parts.map((part) => (
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
          ))}
        </View>

        <Button onPress={handleComplete} loading={saving} disabled={saving}>
          Complete Setup
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
