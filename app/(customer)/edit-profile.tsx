import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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

export default function EditProfile() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProfile } = useProfile(profile?.id ?? '');

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile?.full_name]);

  const handleSave = async () => {
    if (!profile?.id) return;

    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setError('Please enter your full name.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile({ id: profile.id, data: { full_name: trimmed } });
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    } catch {
      setError('Could not update your profile. Please try again.');
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
              Edit Profile
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
            <Text style={{ color: Theme.textLight, fontSize: 12, marginTop: 6 }}>
              To change your phone number, contact support.
            </Text>
          </View>

          <Button onPress={handleSave} loading={saving} disabled={saving}>
            Save Changes
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
