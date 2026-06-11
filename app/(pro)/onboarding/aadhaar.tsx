import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OnboardingCard, OnboardingScaffold } from '@/components/pro/OnboardingChrome';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { uploadKycDocument } from '@/services/uploads';

export default function Aadhaar() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { updateProDetails, updateProfile } = useProfile(profile?.id ?? '');

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const [uploading, setUploading] = useState<{ front: boolean; back: boolean }>({ front: false, back: false });
  const [submitting, setSubmitting] = useState(false);

  const aadhaarValid = /^\d{12}$/.test(aadhaarNumber.replace(/\s/g, ''));
  const canContinue = fullName.trim().length > 1 && aadhaarValid && front && back;

  const pick = async (key: 'front' | 'back', fileName: string, setter: (v: boolean) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });
    if (result.canceled || !profile?.id) return;
    setUploading((p) => ({ ...p, [key]: true }));
    try {
      await uploadKycDocument(profile.id, result.assets[0].uri, fileName);
      setter(true);
    } catch {
      Alert.alert('Upload failed', 'Could not upload the document. Check your connection and try again.');
    } finally {
      setUploading((p) => ({ ...p, [key]: false }));
    }
  };

  const handleContinue = async () => {
    if (!profile?.id || !canContinue) return;
    setSubmitting(true);
    try {
      await updateProfile({ id: profile.id, data: { full_name: fullName.trim() } });
      await updateProDetails({
        id: profile.id,
        data: {
          // Real KYC verification (Razorpay) plugs in here. For now we store a
          // reference and leave the status as 'pending' for manual review.
          aadhaar_ref: `kyc_${profile.id.slice(0, 8)}_${Date.now()}`,
          kyc_status: 'pending',
          onboarding_step: 'selfie',
        },
      });
      router.replace('/(pro)/onboarding/selfie');
    } catch {
      Alert.alert('Error', 'Could not save your details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingScaffold
      stepKey="aadhaar"
      eyebrow="IDENTITY"
      title="Verify your Aadhaar"
      subtitle="Required by law for home-service professionals. Your Aadhaar number is never stored by Zapfix — only a secure KYC reference."
      footer={
        <Button onPress={handleContinue} loading={submitting} disabled={submitting || !canContinue}>
          Continue
        </Button>
      }
    >
      <Input label="Full name (as per Aadhaar)" value={fullName} onChangeText={setFullName} placeholder="Full name" />

      <Input
        label="Aadhaar number"
        value={aadhaarNumber}
        onChangeText={(t) => setAadhaarNumber(t.replace(/[^\d]/g, '').slice(0, 12))}
        placeholder="12-digit Aadhaar number"
        keyboardType="number-pad"
        error={aadhaarNumber.length > 0 && !aadhaarValid ? 'Enter a valid 12-digit number' : undefined}
      />

      <OnboardingCard>
        <Text style={{ fontWeight: '800', color: colors.text.primary }}>Upload Aadhaar card</Text>
        <Text style={{ color: colors.text.muted, fontSize: 12 }}>Clear photos of both sides.</Text>
        <View style={{ gap: 10, marginTop: 4 }}>
          <Button variant="secondary" loading={uploading.front} onPress={() => pick('front', 'aadhaar_front.jpg', setFront)}>
            {front ? '✓ Aadhaar front uploaded' : 'Upload front'}
          </Button>
          <Button variant="secondary" loading={uploading.back} onPress={() => pick('back', 'aadhaar_back.jpg', setBack)}>
            {back ? '✓ Aadhaar back uploaded' : 'Upload back'}
          </Button>
        </View>
      </OnboardingCard>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Ionicons name="lock-closed" size={14} color={colors.text.muted} />
        <Text style={{ color: colors.text.muted, fontSize: 12, flex: 1 }}>
          Encrypted and used only for verification.
        </Text>
      </View>
    </OnboardingScaffold>
  );
}
