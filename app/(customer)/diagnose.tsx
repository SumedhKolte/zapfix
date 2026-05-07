import { useMemo, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DiagnosisCard } from '@/components/customer/DiagnosisCard';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { uploadJobMedia } from '@/services/uploads';
import { requestDiagnosis } from '@/services/diagnosis';
import { parseDiagnosis } from '@/utils/ai/parseDiagnosis';
import { useJob } from '@/hooks/useJob';

export default function Diagnose() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { profile } = useAuth();
  const { addressesQuery } = useProfile(profile?.id ?? '');
  const { createJob } = useJob({ customerId: profile?.id });

  const [step, setStep] = useState<'capture' | 'processing' | 'result'>('capture');
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [diagnosis, setDiagnosis] = useState<ReturnType<typeof parseDiagnosis> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const addressOptions = addressesQuery.data ?? [];

  const tips = useMemo(() => {
    return [
      'Record the sound for 10 seconds',
      'Show the outdoor unit if accessible',
      'Photograph the model label'
    ];
  }, []);

  const handlePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1
    });

    if (!result.canceled) {
      const picked = result.assets[0];
      setMedia({ uri: picked.uri, type: picked.type === 'video' ? 'video' : 'image' });
    }
  };

  const handleAnalyze = async () => {
    if (!media) {
      return;
    }
    setStep('processing');
    setError(null);
    try {
      const tempJobId = `temp-${Date.now()}`;
      const storagePath = await uploadJobMedia(tempJobId, media.uri, 'diagnosis.jpg');
      const response = await requestDiagnosis({
        storage_url: storagePath,
        category: category ?? undefined
      });
      const parsed = parseDiagnosis(response);
      setDiagnosis(parsed);
      setStep('result');
    } catch (err) {
      setError('We could not analyse the media. Please try again.');
      setStep('capture');
    }
  };

  const handleBook = async () => {
    if (!diagnosis?.success || !profile?.id || !selectedAddress) {
      return;
    }

    const job = await createJob({
      customer_id: profile.id,
      status: 'searching',
      ai_diagnosis: diagnosis.data.fault_name,
      ai_confidence: diagnosis.data.confidence,
      ai_raw_response: diagnosis.data,
      est_cost_min: diagnosis.data.est_cost_min,
      est_cost_max: diagnosis.data.est_cost_max,
      address_id: selectedAddress
    });

    router.replace({ pathname: '/(customer)/matching', params: { jobId: job.id } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.navy.primary }}>AI Diagnosis</Text>
          {category ? <Badge label={category} backgroundColor={Colors.amber.light} textColor={Colors.amber.dark} /> : null}
        </View>

        {step === 'capture' ? (
          <View style={{ gap: 16 }}>
            {error ? (
              <Card>
                <Text style={{ color: Colors.error }}>{error}</Text>
              </Card>
            ) : null}
            <Card>
              <View
                style={{
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: Colors.amber.primary,
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12
                }}
              >
                {media ? (
                  <Image source={{ uri: media.uri }} style={{ width: '100%', height: 200, borderRadius: 12 }} />
                ) : (
                  <Ionicons name="camera" size={40} color={Colors.amber.primary} />
                )}
                <Button variant="secondary" onPress={handlePick}>
                  {media ? 'Retake' : 'Select Photo/Video'}
                </Button>
              </View>
            </Card>

            <Card>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.navy.primary }}>
                For best results:
              </Text>
              <View style={{ marginTop: 8, gap: 6 }}>
                {tips.map((tip) => (
                  <Text key={tip} style={{ color: Colors.darkGray, fontSize: 12 }}>
                    • {tip}
                  </Text>
                ))}
              </View>
            </Card>

            <Button onPress={handleAnalyze} disabled={!media}>
              Analyse with AI
            </Button>
          </View>
        ) : null}

        {step === 'processing' ? (
          <View style={{ alignItems: 'center', gap: 16, paddingTop: 40 }}>
            <View>
              <Ionicons name="hardware-chip-outline" size={80} color={Colors.blue.primary} />
            </View>
            <Text style={{ fontSize: 18, color: Colors.navy.primary }}>
              Zapfix is analysing your problem...
            </Text>
            <Text style={{ fontSize: 12, color: Colors.midGray }}>Usually takes 5-10 seconds</Text>
          </View>
        ) : null}

        {step === 'result' && diagnosis?.success ? (
          <View style={{ gap: 16 }}>
            <DiagnosisCard
              faultName={diagnosis.data.fault_name}
              description={diagnosis.data.fault_description}
              confidence={diagnosis.data.confidence}
              parts={diagnosis.data.required_parts}
              costMin={diagnosis.data.est_cost_min}
              costMax={diagnosis.data.est_cost_max}
              urgency={diagnosis.data.urgency}
            />

            <Card>
              <Text style={{ fontWeight: '700', color: Colors.navy.primary }}>Where is this appliance?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
                {addressOptions.map((address) => (
                  <Button
                    key={address.id}
                    variant={selectedAddress === address.id ? 'primary' : 'secondary'}
                    onPress={() => setSelectedAddress(address.id)}
                  >
                    {address.label ?? 'Address'}
                  </Button>
                ))}
                <Button variant="secondary">Add new address</Button>
              </ScrollView>
            </Card>

            <Button onPress={handleBook}>Book a Pro — it's free to match</Button>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
