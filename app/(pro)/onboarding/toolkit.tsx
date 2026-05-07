import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { uploadKycDocument } from '@/services/uploads';
import { verifyToolkit } from '@/lib/gemini';
import { parseToolkit } from '@/utils/ai/parseToolkit';

export default function Toolkit() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateProDetails } = useProfile(profile?.id ?? '');
  const [toolkitUri, setToolkitUri] = useState<string | null>(null);
  const [verification, setVerification] = useState<ReturnType<typeof parseToolkit> | null>(null);

  const handleCapture = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled && profile?.id) {
      const uri = result.assets[0].uri;
      const storagePath = await uploadKycDocument(profile.id, uri, 'toolkit.jpg');
      setToolkitUri(uri);
      const response = await verifyToolkit({
        storage_url: storagePath,
        expected_tools: ['Multimeter', 'Vacuum Pump']
      });
      setVerification(parseToolkit(response.data));
    }
  };

  const handleContinue = async () => {
    if (!profile?.id) {
      return;
    }
    await updateProDetails({
      id: profile.id,
      data: {
        tools_verified: verification?.success ? verification.data.overall_verdict : false,
        tools_missing: verification?.success ? verification.data.missing_tools : [],
        onboarding_step: 'inventory'
      }
    });
    router.replace('/(pro)/onboarding/inventory');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 14, color: Colors.midGray }}>Step 4 of 5</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.navy.primary }}>Show us your toolkit</Text>
        <Text style={{ color: Colors.midGray }}>
          A photo of your tools helps customers trust you.
        </Text>

        <Card>
          <Button variant="secondary" onPress={handleCapture}>
            {toolkitUri ? 'Retake Toolkit Photo' : 'Tap to photograph your toolkit'}
          </Button>
          {verification?.success ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              {verification.data.verified_tools.map((tool) => (
                <Text key={tool} style={{ color: Colors.success }}>✓ {tool}</Text>
              ))}
              {verification.data.missing_tools.map((tool) => (
                <Text key={tool} style={{ color: Colors.warning }}>✗ {tool}</Text>
              ))}
            </View>
          ) : null}
        </Card>

        <Button onPress={handleContinue} disabled={!toolkitUri}>
          Continue
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
