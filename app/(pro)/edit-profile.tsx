import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ProEditProfile() {
  const { colors: Colors } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { proDetailsQuery, updateProfile, updateProDetails } = useProfile(profile?.id ?? '');

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [radius, setRadius] = useState(String(proDetailsQuery.data?.service_radius_km ?? 5));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setFullName(profile?.full_name ?? ''); }, [profile?.full_name]);
  useEffect(() => {
    if (proDetailsQuery.data?.service_radius_km != null) {
      setRadius(String(proDetailsQuery.data.service_radius_km));
    }
  }, [proDetailsQuery.data?.service_radius_km]);

  const handleSave = async () => {
    if (!profile?.id) return;
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    const radiusNum = Number.parseInt(radius, 10);
    if (Number.isNaN(radiusNum) || radiusNum < 1 || radiusNum > 50) {
      setError('Service radius must be between 1 and 50 km.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ id: profile.id, data: { full_name: trimmed } });
      await updateProDetails({ id: profile.id, data: { service_radius_km: radiusNum } });
      Alert.alert('Saved', 'Your Pro profile has been updated.');
      router.back();
    } catch {
      setError('Could not update your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <LinearGradient colors={[Colors.navy.primary, Colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </Pressable>
            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }}>Edit Pro Profile</Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -10, gap: 16 }}>
          <View style={{ backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Input
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              error={error ?? undefined}
            />
            <View style={{ height: 16 }} />
            <Input
              label="Phone number"
              value={profile?.phone_number ?? ''}
              editable={false}
              placeholder=""
            />
            <Text style={{ color: Colors.midGray, fontSize: 12, marginTop: 6 }}>
              To change your phone number, contact pros@zapfix.in.
            </Text>
          </View>

          <View style={{ backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Input
              label="Service radius (km)"
              value={radius}
              onChangeText={setRadius}
              keyboardType="number-pad"
              placeholder="5"
            />
            <Text style={{ color: Colors.midGray, fontSize: 12, marginTop: 6 }}>
              We only send you jobs within this distance from your current location.
            </Text>
          </View>

          <Button onPress={handleSave} loading={saving} disabled={saving}>
            Save changes
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
