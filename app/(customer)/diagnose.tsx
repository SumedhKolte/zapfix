import { useMemo, useState, useRef, useEffect } from 'react';
import { Image, ScrollView, Text, View, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { DiagnosisCard } from '@/components/customer/DiagnosisCard';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { uploadJobMedia } from '@/services/uploads';
import { requestDiagnosis } from '@/services/diagnosis';
import { parseDiagnosis } from '@/utils/ai/parseDiagnosis';
import { useJob } from '@/hooks/useJob';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  blue: '#1B6FE8',
  blueLight: '#E8F0FF',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF',
  error: '#C23232',
  errorLight: '#FFF0F0',
};

function ProcessingAnimation() {
  const pulse  = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ alignItems: 'center', gap: 20, paddingVertical: 60 }}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <View style={{
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: Theme.blue + '15',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="hardware-chip" size={48} color={Theme.blue} />
          </Animated.View>
        </View>
      </Animated.View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.textDark }}>
        Zapfix is analysing...
      </Text>
      <Text style={{ fontSize: 13, color: Theme.textMid }}>Usually takes 5–10 seconds</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map((i) => {
          const dotAnim = useRef(new Animated.Value(0.3)).current;
          useEffect(() => {
            Animated.loop(
              Animated.sequence([
                Animated.delay(i * 200),
                Animated.timing(dotAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(dotAnim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
              ])
            ).start();
          }, []);
          return (
            <Animated.View key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: Theme.blue, opacity: dotAnim,
            }} />
          );
        })}
      </View>
    </View>
  );
}

export default function Diagnose() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { profile } = useAuth();
  const { addressesQuery } = useProfile(profile?.id ?? '');
  const { createJob } = useJob({ customerId: profile?.id });

  const [step, setStep]           = useState<'capture' | 'processing' | 'result'>('capture');
  const [media, setMedia]         = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [diagnosis, setDiagnosis] = useState<ReturnType<typeof parseDiagnosis> | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const stepAnim   = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(stepAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start(() => {
      Animated.timing(stepAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  }, [step]);

  const addressOptions = addressesQuery.data ?? [];

  const tips = useMemo(() => [
    { icon: 'videocam', text: 'Record the sound for 10 seconds' },
    { icon: 'sunny',    text: 'Ensure good lighting' },
    { icon: 'barcode',  text: 'Photograph the model label' },
  ], []);

  const handlePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });
    if (!result.canceled) {
      const picked = result.assets[0];
      setMedia({ uri: picked.uri, type: picked.type === 'video' ? 'video' : 'image' });
    }
  };

  const handleAnalyze = async () => {
    if (!media) return;
    setStep('processing');
    setError(null);
    try {
      const tempJobId    = `temp-${Date.now()}`;
      const storagePath  = await uploadJobMedia(tempJobId, media.uri, 'diagnosis.jpg');
      const response     = await requestDiagnosis({ storage_url: storagePath, category: category ?? undefined });
      const parsed       = parseDiagnosis(response);
      setDiagnosis(parsed);
      setStep('result');
    } catch (err) {
      console.error('Diagnosis failed', err);
      const message = err instanceof Error
        ? err.message
        : 'We could not analyse the media. Please try again.';
      setError(message);
      setStep('capture');
    }
  };

  const handleBook = async () => {
    if (!diagnosis?.success || !profile?.id || !selectedAddress) return;
    const job = await createJob({
      customer_id:       profile.id,
      status:            'searching',
      ai_diagnosis:      diagnosis.data.fault_name,
      ai_confidence:     diagnosis.data.confidence,
      ai_raw_response:   diagnosis.data,
      est_cost_min:      diagnosis.data.est_cost_min,
      est_cost_max:      diagnosis.data.est_cost_max,
      address_id:        selectedAddress,
    });
    router.replace({ pathname: '/(customer)/matching', params: { jobId: job.id } });
  };

  const stepLabels = ['Capture', 'Analyse', 'Book'];
  const stepIndex  = step === 'capture' ? 0 : step === 'processing' ? 1 : 2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <Animated.View style={{ opacity: headerAnim }}>
          <LinearGradient
            colors={[Theme.navy, Theme.navyMid]}
            style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <Pressable
                onPress={() => router.back()}
                style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="arrow-back" size={20} color={Theme.white} />
              </Pressable>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                  AI DIAGNOSIS
                </Text>
                <Text style={{ color: Theme.white, fontSize: 18, fontWeight: '800' }}>
                  {category ? `${category} Check` : 'Identify Problem'}
                </Text>
              </View>
            </View>

            {/* Step indicator */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {stepLabels.map((label, i) => (
                <View key={label} style={{ flex: i < 2 ? 1 : 0, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: i <= stepIndex ? Theme.amber : 'rgba(255,255,255,0.15)',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i < stepIndex
                        ? <Ionicons name="checkmark" size={14} color={Theme.navy} />
                        : <Text style={{ fontSize: 12, fontWeight: '800', color: i === stepIndex ? Theme.navy : 'rgba(255,255,255,0.5)' }}>{i + 1}</Text>
                      }
                    </View>
                    <Text style={{
                      fontSize: 10, fontWeight: '700',
                      color: i <= stepIndex ? Theme.amber : 'rgba(255,255,255,0.4)',
                    }}>{label}</Text>
                  </View>
                  {i < 2 && (
                    <View style={{
                      flex: 1, height: 2, marginHorizontal: 6, marginBottom: 14,
                      backgroundColor: i < stepIndex ? Theme.amber : 'rgba(255,255,255,0.2)',
                      borderRadius: 1,
                    }} />
                  )}
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -16, paddingHorizontal: 20, gap: 16 }}>
          <Animated.View style={{ opacity: stepAnim }}>

            {/* CAPTURE STEP */}
            {step === 'capture' ? (
              <View style={{ gap: 14 }}>
                {error ? (
                  <View style={{
                    backgroundColor: Theme.errorLight, borderRadius: 14, padding: 14,
                    flexDirection: 'row', gap: 10, alignItems: 'center',
                    borderWidth: 1, borderColor: Theme.error + '30',
                  }}>
                    <Ionicons name="alert-circle" size={18} color={Theme.error} />
                    <Text style={{ color: Theme.error, flex: 1, fontSize: 13 }}>{error}</Text>
                  </View>
                ) : null}

                <View style={{
                  backgroundColor: Theme.creamCard, borderRadius: 20, padding: 16,
                  shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
                }}>
                  <Pressable
                    onPress={handlePick}
                    style={{
                      borderWidth: 2, borderStyle: 'dashed', borderColor: Theme.navy + '40',
                      borderRadius: 16, padding: 24,
                      alignItems: 'center', justifyContent: 'center', gap: 14,
                      backgroundColor: Theme.navy + '04', minHeight: 180,
                    }}
                  >
                    {media ? (
                      <>
                        <Image source={{ uri: media.uri }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="cover" />
                        <Text style={{ color: Theme.navy, fontWeight: '600', fontSize: 13 }}>Tap to retake</Text>
                      </>
                    ) : (
                      <>
                        <View style={{
                          width: 64, height: 64, borderRadius: 32,
                          backgroundColor: Theme.navy + '12',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Ionicons name="camera" size={30} color={Theme.navy} />
                        </View>
                        <Text style={{ color: Theme.textDark, fontWeight: '700', fontSize: 15 }}>
                          Select Photo or Video
                        </Text>
                        <Text style={{ color: Theme.textMid, fontSize: 12, textAlign: 'center' }}>
                          Tap to choose from your gallery
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                <View style={{
                  backgroundColor: Theme.creamCard, borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: Theme.border,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.textDark, marginBottom: 10 }}>
                    Tips for best results
                  </Text>
                  {tips.map((tip) => (
                    <View key={tip.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <View style={{
                        width: 28, height: 28, borderRadius: 8,
                        backgroundColor: Theme.navy + '10',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons name={tip.icon as any} size={14} color={Theme.navy} />
                      </View>
                      <Text style={{ color: Theme.textMid, fontSize: 13, flex: 1 }}>{tip.text}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={handleAnalyze}
                  disabled={!media}
                  style={{
                    backgroundColor: media ? Theme.amber : Theme.border,
                    borderRadius: 16, paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Ionicons name="hardware-chip" size={20} color={media ? Theme.navy : Theme.textLight} />
                  <Text style={{ color: media ? Theme.navy : Theme.textLight, fontWeight: '800', fontSize: 15 }}>
                    Analyse with AI
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* PROCESSING STEP */}
            {step === 'processing' ? <ProcessingAnimation /> : null}

            {/* RESULT STEP */}
            {step === 'result' && diagnosis?.success ? (
              <View style={{ gap: 14 }}>
                <DiagnosisCard
                  faultName={diagnosis.data.fault_name}
                  description={diagnosis.data.fault_description}
                  confidence={diagnosis.data.confidence}
                  parts={diagnosis.data.required_parts}
                  costMin={diagnosis.data.est_cost_min}
                  costMax={diagnosis.data.est_cost_max}
                  urgency={diagnosis.data.urgency}
                />

                <View style={{
                  backgroundColor: Theme.creamCard, borderRadius: 20, padding: 16,
                  shadowColor: Theme.navy, shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
                }}>
                  <Text style={{ fontWeight: '700', color: Theme.textDark, marginBottom: 12 }}>
                    Where is this appliance?
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {addressOptions.map((address) => (
                      <Pressable
                        key={address.id}
                        onPress={() => setSelectedAddress(address.id)}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10,
                          borderRadius: 12, borderWidth: 1.5,
                          borderColor: selectedAddress === address.id ? Theme.navy : Theme.border,
                          backgroundColor: selectedAddress === address.id ? Theme.navy + '10' : Theme.cream,
                        }}
                      >
                        <Text style={{
                          color: selectedAddress === address.id ? Theme.navy : Theme.textMid,
                          fontWeight: selectedAddress === address.id ? '700' : '500', fontSize: 13,
                        }}>
                          {address.label ?? 'Address'}
                        </Text>
                      </Pressable>
                    ))}
                    <Pressable style={{
                      paddingHorizontal: 16, paddingVertical: 10,
                      borderRadius: 12, borderWidth: 1.5,
                      borderColor: Theme.border, borderStyle: 'dashed',
                    }}>
                      <Text style={{ color: Theme.textMid, fontWeight: '500', fontSize: 13 }}>+ Add new</Text>
                    </Pressable>
                  </ScrollView>
                </View>

                <Pressable
                  onPress={handleBook}
                  disabled={!selectedAddress}
                  style={{
                    backgroundColor: selectedAddress ? Theme.amber : Theme.border,
                    borderRadius: 16, paddingVertical: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: selectedAddress ? Theme.navy : Theme.textLight,
                    fontWeight: '800', fontSize: 15,
                  }}>
                    Book a Pro — Free to match ✓
                  </Text>
                </Pressable>
              </View>
            ) : null}

          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}