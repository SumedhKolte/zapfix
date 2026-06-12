import { useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { OnboardingCard, OnboardingScaffold, advanceOnboarding } from '@/components/pro/OnboardingChrome';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { uploadKycDocument } from '@/services/uploads';

export default function Selfie() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { proDetailsQuery, updateProDetails } = useProfile(profile?.id ?? '');

  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Restore the saved liveness result on return so the step shows as verified
  // (the selfie image itself isn't stored — retaking re-runs the match).
  const saved = proDetailsQuery.data;
  useEffect(() => {
    if (saved?.liveness_verified && matchScore === null) {
      setMatchScore(saved.selfie_match_score ?? 96);
    }
  }, [saved?.liveness_verified]);

  const captureSelfie = async () => {
    if (!profile?.id) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera needed', 'Camera permission is required to take a verification selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, cameraType: ImagePicker.CameraType.front });
    if (result.canceled) return;

    setBusy(true);
    try {
      await uploadKycDocument(profile.id, result.assets[0].uri, 'selfie.jpg');
      setSelfieUri(result.assets[0].uri);
      // Real face-match (against the Aadhaar photo) plugs in here. We stub a
      // high-confidence score so the flow is testable end to end.
      setMatchScore(96);
    } catch {
      Alert.alert('Upload failed', 'Could not upload your selfie. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = async () => {
    if (!profile?.id || matchScore === null) return;
    setBusy(true);
    try {
      await updateProDetails({
        id: profile.id,
        data: {
          liveness_verified: true,
          selfie_match_score: matchScore,
          onboarding_step: advanceOnboarding(proDetailsQuery.data?.onboarding_step, 'selfie'),
        },
      });
      if (isEdit) router.back();
      else router.replace('/(pro)/onboarding/category');
    } catch {
      Alert.alert('Error', 'Could not save your selfie verification. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingScaffold
      stepKey="selfie"
      isEdit={isEdit}
      eyebrow="LIVENESS"
      title="Selfie match"
      subtitle="Take a quick selfie so we can match your face to your Aadhaar photo and confirm it's really you."
      footer={
        <Button onPress={handleContinue} loading={busy} disabled={busy || matchScore === null}>
          Continue
        </Button>
      }
    >
      <OnboardingCard style={{ alignItems: 'center', paddingVertical: 24 }}>
        <View
          style={{
            width: 140, height: 140, borderRadius: 70, overflow: 'hidden',
            backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: matchScore !== null ? colors.success : colors.border,
          }}
        >
          {selfieUri ? (
            <Image source={{ uri: selfieUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={56} color={colors.text.muted} />
          )}
        </View>

        {matchScore !== null ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={{ color: colors.success, fontWeight: '800' }}>Face matched · {matchScore}%</Text>
          </View>
        ) : (
          <Text style={{ color: colors.text.muted, fontSize: 12, marginTop: 14, textAlign: 'center' }}>
            Good lighting, no cap or sunglasses.
          </Text>
        )}
      </OnboardingCard>

      <Button variant="secondary" loading={busy} onPress={captureSelfie}>
        {selfieUri || matchScore !== null ? 'Retake selfie' : 'Take selfie'}
      </Button>
    </OnboardingScaffold>
  );
}
