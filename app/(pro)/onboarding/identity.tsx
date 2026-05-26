import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
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

export default function Identity() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProDetails, updateProfile } = useProfile(profile?.id ?? '');

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [aadhaarFrontPath, setAadhaarFrontPath] = useState<string | null>(null);
  const [aadhaarBackPath, setAadhaarBackPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const uploadImage = async (
    source: 'camera' | 'library',
    label: string,
    fileName: string,
    onDone: (uri: string, storagePath: string) => void
  ) => {
    if (!profile?.id) return;

    setUploading(label);
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission needed', source === 'camera'
          ? 'Camera permission is needed to take your selfie.'
          : 'Photo permission is needed to upload your document.');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsEditing: true });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const storagePath = await uploadKycDocument(profile.id, uri, fileName);
        onDone(uri, storagePath);
      }
    } catch (err) {
      console.error('KYC upload failed', err);
      Alert.alert('Upload failed', 'Please try again with a clear photo.');
    } finally {
      setUploading(null);
    }
  };

  const handleContinue = async () => {
    if (!profile?.id) {
      return;
    }

    const trimmedName = fullName.trim();
    if (trimmedName.length < 3) {
      Alert.alert('Enter your full name', 'Use the same name shown on your ID.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ id: profile.id, data: { full_name: trimmedName } });
      await updateProDetails({
        id: profile.id,
        data: {
          aadhaar_ref: [aadhaarFrontPath, aadhaarBackPath].filter(Boolean).join('|') || null,
          kyc_status: 'pending',
          liveness_verified: Boolean(selfie),
          onboarding_step: 'skills'
        }
      });

      router.replace('/(pro)/onboarding/skills');
    } catch (err) {
      console.error('Could not save identity step', err);
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
          <Text style={{ fontSize: 14, color: Colors.midGray }}>Step 1 of 5</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.navy.primary }}>
          Let's verify your identity
        </Text>
        <Text style={{ color: Colors.midGray }}>Required by law for home service professionals</Text>

        <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Full name" />

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Aadhaar KYC</Text>
          <Text style={{ color: Colors.midGray, marginTop: 6 }}>
            We use Razorpay KYC. Your Aadhaar number is never stored by Zapfix.
          </Text>
          <View style={{ gap: 12, marginTop: 12 }}>
            <Button
              variant="secondary"
              loading={uploading === 'aadhaar-front'}
              disabled={Boolean(uploading)}
              onPress={() => uploadImage('library', 'aadhaar-front', 'aadhaar_front.jpg', (uri, path) => {
                setAadhaarFront(uri);
                setAadhaarFrontPath(path);
              })}
            >
              {aadhaarFront ? 'Aadhaar front uploaded' : 'Upload Aadhaar front'}
            </Button>
            {aadhaarFront ? <Image source={{ uri: aadhaarFront }} style={{ height: 120, borderRadius: 12 }} resizeMode="cover" /> : null}
            <Button
              variant="secondary"
              loading={uploading === 'aadhaar-back'}
              disabled={Boolean(uploading)}
              onPress={() => uploadImage('library', 'aadhaar-back', 'aadhaar_back.jpg', (uri, path) => {
                setAadhaarBack(uri);
                setAadhaarBackPath(path);
              })}
            >
              {aadhaarBack ? 'Aadhaar back uploaded' : 'Upload Aadhaar back'}
            </Button>
            {aadhaarBack ? <Image source={{ uri: aadhaarBack }} style={{ height: 120, borderRadius: 12 }} resizeMode="cover" /> : null}
          </View>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Selfie Liveness Check</Text>
          <Text style={{ color: Colors.midGray, marginTop: 6 }}>
            Take a selfie to verify your identity.
          </Text>
          <Button
            variant="secondary"
            loading={uploading === 'selfie'}
            disabled={Boolean(uploading)}
            onPress={() => uploadImage('camera', 'selfie', 'selfie.jpg', (uri) => setSelfie(uri))}
          >
            {selfie ? 'Selfie Captured' : 'Take a Selfie'}
          </Button>
          {selfie ? <Image source={{ uri: selfie }} style={{ height: 160, borderRadius: 12, marginTop: 12 }} resizeMode="cover" /> : null}
        </Card>

        <Button onPress={handleContinue} loading={saving} disabled={saving || !aadhaarFront || !aadhaarBack || !selfie}>
          Continue
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
