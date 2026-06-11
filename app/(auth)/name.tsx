import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { getProDetails, updateProfile } from '@/services/profile';
import { useAuthStore } from '@/stores/authStore';
import { isFullNameMissing } from '@/utils/profile';
import { QueryKeys } from '@/constants/queryKeys';
import { friendlyAuthError } from '@/utils/authErrors';
import { useTheme } from '@/hooks/useTheme';

const logoSource = require('../../assets/icon.png');

export default function NameCapture() {
  const { theme: Theme } = useTheme();
  const router = useRouter();
  const { session, profile } = useAuth();
  const { setProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(() => {
    if (!profile?.full_name || isFullNameMissing(profile.full_name)) {
      return '';
    }
    return profile.full_name;
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/welcome');
    }
  }, [profile, router, session]);

  const isValid = useMemo(() => fullName.trim().length >= 3, [fullName]);

  const handleContinue = async () => {
    if (!session?.user.id) {
      return;
    }

    const trimmed = fullName.trim();
    if (!trimmed) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateProfile(session.user.id, { full_name: trimmed });
      setProfile(updated);
      queryClient.setQueryData(QueryKeys.profile(updated.id), updated);

      if (updated.role === 'pro') {
        try {
          const proDetails = await getProDetails(updated.id);
          if (proDetails?.onboarding_step && proDetails.onboarding_step !== 'complete') {
            router.replace(`/(pro)/onboarding/${proDetails.onboarding_step}`);
            return;
          }
        } catch (error) {
          // fall back to dashboard when pro details are unavailable
        }
        router.replace('/(pro)/dashboard');
        return;
      }

      router.replace('/(customer)/home');
    } catch (err) {
      const { title, message } = friendlyAuthError(err);
      Alert.alert(title, message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[Theme.navy, Theme.navyMid]}
          style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Image source={logoSource} style={{ width: 28, height: 28 }} resizeMode="contain" />
            </View>
            <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '700' }}>Tell us your name</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.65)', marginTop: 12, fontSize: 13 }}>
            This helps us personalize your experience and receipts.
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
          <View
            style={{
              backgroundColor: Theme.creamCard,
              borderRadius: 18,
              padding: 18,
              borderWidth: 1,
              borderColor: Theme.border,
              shadowColor: Theme.navy,
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.textDark, marginBottom: 6 }}>
              Full name
            </Text>
            <Text style={{ fontSize: 12, color: Theme.textMid, marginBottom: 12 }}>
              Use the name you want service professionals to see.
            </Text>
            <Input
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Priya Sharma"
              autoCapitalize="words"
              leftElement={
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: Theme.amberLight,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Ionicons name="person" size={16} color={Theme.textDark} />
                </View>
              }
            />
            <View
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: 'rgba(245,184,0,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(245,184,0,0.4)'
              }}
            >
              <Text style={{ fontSize: 12, color: Theme.textDark }}>
                You can update this anytime from your profile settings.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ padding: 20, backgroundColor: Theme.cream }}>
        <Button
          onPress={handleContinue}
          disabled={!isValid || isSaving}
          loading={isSaving}
          rightIcon={<Ionicons name="arrow-forward" size={18} color={Theme.navy} />}
        >
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}
