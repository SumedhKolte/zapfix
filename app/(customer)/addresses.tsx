import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { geocodeAddress, toGeoJSONPoint } from '@/utils/geo';
import type { Tables } from '@/types/database';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  error: '#C23232',
};

type AddressRow = Tables<'customer_addresses'>;

export default function Addresses() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { addressesQuery } = useProfile(profile?.id ?? '');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [addressText, setAddressText] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);

  const resetForm = () => {
    setEditingId(null);
    setLabel('');
    setAddressText('');
    setMakeDefault(false);
    setError(null);
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!profile?.id) return;
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', profile.id)
      .neq('id', addressId);

    await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', addressId);
  };

  const handleEdit = (address: AddressRow) => {
    setEditingId(address.id);
    setLabel(address.label ?? '');
    setAddressText(address.address_text ?? '');
    setMakeDefault(Boolean(address.is_default));
    setError(null);
  };

  const handleDelete = (address: AddressRow) => {
    Alert.alert('Delete address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!profile?.id) return;
          await supabase.from('customer_addresses').delete().eq('id', address.id);
          await queryClient.invalidateQueries({ queryKey: ['addresses', profile.id] });
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    const trimmed = addressText.trim();
    if (trimmed.length < 6) {
      setError('Please enter a complete address.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const coords = await geocodeAddress({
        label: label.trim(),
        address_text: trimmed,
      });
      const location = toGeoJSONPoint(coords);

      if (editingId) {
        const { data, error: updateError } = await supabase
          .from('customer_addresses')
          .update({
            label: label.trim().length ? label.trim() : null,
            address_text: trimmed,
            is_default: makeDefault,
            location,
          })
          .eq('id', editingId)
          .select('*')
          .single();

        if (updateError) throw updateError;
        if (makeDefault && data?.id) {
          await setDefaultAddress(data.id);
        }
      } else {
        const { data, error: insertError } = await supabase
          .from('customer_addresses')
          .insert({
            customer_id: profile.id,
            label: label.trim().length ? label.trim() : null,
            address_text: trimmed,
            is_default: makeDefault,
            location,
          })
          .select('*')
          .single();

        if (insertError) throw insertError;
        if (makeDefault && data?.id) {
          await setDefaultAddress(data.id);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['addresses', profile.id] });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMakeDefault = async (address: AddressRow) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      await setDefaultAddress(address.id);
      await queryClient.invalidateQueries({ queryKey: ['addresses', profile.id] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color={Theme.white} />
            </Pressable>
            <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '800' }}>
              Saved Addresses
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -10, gap: 16 }}>
          <View
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: Theme.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>
              {editingId ? 'Edit Address' : 'Add New Address'}
            </Text>

            <View style={{ height: 12 }} />

            <Input
              label="Label"
              value={label}
              onChangeText={setLabel}
              placeholder="Home, Office"
            />

            <View style={{ height: 12 }} />

            <Input
              label="Address"
              value={addressText}
              onChangeText={setAddressText}
              placeholder="House number, street, city"
              multiline
            />

            {error ? (
              <Text style={{ color: Theme.error, fontSize: 12, marginTop: 8 }}>{error}</Text>
            ) : null}

            <Pressable
              onPress={() => setMakeDefault((prev) => !prev)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 14,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  borderWidth: 1.5,
                  borderColor: makeDefault ? Theme.navy : Theme.border,
                  backgroundColor: makeDefault ? Theme.navy : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {makeDefault ? (
                  <Ionicons name="checkmark" size={12} color={Theme.white} />
                ) : null}
              </View>
              <Text style={{ color: Theme.textMid, fontSize: 12 }}>
                Set as default address
              </Text>
            </Pressable>

            <View style={{ height: 16 }} />

            <Button onPress={handleSave} loading={saving} disabled={saving}>
              {editingId ? 'Update Address' : 'Save Address'}
            </Button>

            {editingId ? (
              <View style={{ height: 12 }} />
            ) : null}

            {editingId ? (
              <Button variant="secondary" onPress={resetForm} disabled={saving}>
                Cancel Editing
              </Button>
            ) : null}
          </View>

          <View style={{ gap: 12 }}>
            {addresses.map((address) => (
              <View
                key={address.id}
                style={{
                  backgroundColor: Theme.creamCard,
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: address.is_default ? Theme.amber : Theme.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>
                      {address.label ?? 'Address'}
                    </Text>
                    <Text style={{ color: Theme.textMid, fontSize: 12, marginTop: 4 }}>
                      {address.address_text}
                    </Text>
                  </View>
                  {address.is_default ? (
                    <View
                      style={{
                        backgroundColor: Theme.amber,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Text style={{ color: Theme.navy, fontSize: 11, fontWeight: '700' }}>
                        Default
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <Pressable
                    onPress={() => handleEdit(address)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: Theme.navy + '10',
                    }}
                  >
                    <Text style={{ color: Theme.navy, fontSize: 12, fontWeight: '700' }}>
                      Edit
                    </Text>
                  </Pressable>

                  {!address.is_default ? (
                    <Pressable
                      onPress={() => handleMakeDefault(address)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: Theme.amber + '20',
                      }}
                    >
                      <Text style={{ color: Theme.navy, fontSize: 12, fontWeight: '700' }}>
                        Make Default
                      </Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={() => handleDelete(address)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: Theme.error + '12',
                      marginLeft: 'auto',
                    }}
                  >
                    <Text style={{ color: Theme.error, fontSize: 12, fontWeight: '700' }}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {addresses.length === 0 ? (
              <View
                style={{
                  backgroundColor: Theme.creamCard,
                  borderRadius: 18,
                  padding: 20,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: Theme.border,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="location-outline" size={32} color={Theme.textLight} />
                <Text style={{ color: Theme.textMid, fontWeight: '600', marginTop: 10 }}>
                  No saved addresses yet
                </Text>
                <Text style={{ color: Theme.textLight, fontSize: 12, marginTop: 4 }}>
                  Add a location to book services faster.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
