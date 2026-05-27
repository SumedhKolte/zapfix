import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { uploadKycDocument } from '@/services/uploads';

type UploadState = {
  aadhaarFront: boolean;
  aadhaarBack: boolean;
  selfie: boolean;
};

export default function Identity() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProDetails, updateProfile } = useProfile(profile?.id ?? '');

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [city, setCity] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState(false);
  const [aadhaarBack, setAadhaarBack] = useState(false);
  const [selfie, setSelfie] = useState(false);
  const [uploading, setUploading] = useState<UploadState>({
    aadhaarFront: false,
    aadhaarBack: false,
    selfie: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handlePick = async (
    key: keyof UploadState,
    setter: (v: boolean) => void,
    fileName: string
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (result.canceled || !profile?.id) return;

    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      await uploadKycDocument(profile.id, result.assets[0].uri, fileName);
      setter(true);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload the document. Please check your connection and try again.');
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleContinue = async () => {
    if (!profile?.id) return;
    setSubmitting(true);
    try {
      await updateProfile({ id: profile.id, data: { full_name: fullName } });
      await updateProDetails({
        id: profile.id,
        data: {
          kyc_status: 'pending',
          liveness_verified: selfie,
          onboarding_step: 'skills'
        }
      });
      router.replace('/(pro)/onboarding/skills');
    } catch {
      Alert.alert('Error', 'Could not save your details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const allUploaded = aadhaarFront && aadhaarBack && selfie;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 14, color: Colors.midGray }}>Step 1 of 5</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.navy.primary }}>
          Let's verify your identity
        </Text>
        <Text style={{ color: Colors.midGray }}>Required by law for home service professionals</Text>

        <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Full name" />
        <Input label="City" value={city} onChangeText={setCity} placeholder="Select city" />

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Aadhaar KYC</Text>
          <Text style={{ color: Colors.midGray, marginTop: 6 }}>
            We use Razorpay KYC. Your Aadhaar number is never stored by Zapfix.
          </Text>
          <View style={{ gap: 12, marginTop: 12 }}>
            <Button
              variant="secondary"
              loading={uploading.aadhaarFront}
              onPress={() => handlePick('aadhaarFront', setAadhaarFront, 'aadhaar_front.jpg')}
            >
              {aadhaarFront ? 'Uploaded Aadhaar Front' : 'Upload Aadhaar Front'}
            </Button>
            <Button
              variant="secondary"
              loading={uploading.aadhaarBack}
              onPress={() => handlePick('aadhaarBack', setAadhaarBack, 'aadhaar_back.jpg')}
            >
              {aadhaarBack ? 'Uploaded Aadhaar Back' : 'Upload Aadhaar Back'}
            </Button>
          </View>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Selfie Liveness Check</Text>
          <Text style={{ color: Colors.midGray, marginTop: 6 }}>
            Take a selfie to verify your identity.
          </Text>
          <Button
            variant="secondary"
            loading={uploading.selfie}
            onPress={() => handlePick('selfie', setSelfie, 'selfie.jpg')}
          >
            {selfie ? 'Selfie Captured' : 'Take a Selfie'}
          </Button>
        </Card>

        <Button onPress={handleContinue} disabled={!allUploaded} loading={submitting}>
          Continue
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
