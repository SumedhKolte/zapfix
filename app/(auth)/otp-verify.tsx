import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, getProDetails, upsertProDetails } from '@/services/profile';
import { useAuthStore } from '@/stores/authStore';
import { isFullNameMissing } from '@/utils/profile';

const Theme = {
  navy: '#0F2057',
  navyMid: '#1A3580',
  amber: '#F5B800',
  amberLight: '#FFF8D6',
  cream: '#F7F5F0',
  creamCard: '#FFFFFF',
  textDark: '#0A0F1E',
  textMid: '#4A5578',
  textLight: '#8E97B5',
  border: '#E2E6F0',
  white: '#FFFFFF'
};

const logoSource = require('../../assets/icon.png');

export default function OtpVerify() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, createProfile, signInWithOtp } = useAuth();
  const { setProfile } = useAuthStore();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [showRoleSheet, setShowRoleSheet] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);

  const maskedPhone = useMemo(() => {
    if (!phone) {
      return '';
    }
    const last4 = phone.slice(-4);
    return `+91******${last4}`;
  }, [phone]);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = sanitized;
    setOtp(next);
    if (sanitized && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    if (!sanitized && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length !== 6 || !phone) {
      return;
    }

    const session = await verifyOtp({ phone: `+91${phone}`, token });
    if (!session?.user?.id) {
      return;
    }

    const userId = session.user.id;
    setPendingSessionId(userId);

    try {
      const existingProfile = await getProfile(userId);
      setProfile(existingProfile);
      if (isFullNameMissing(existingProfile.full_name)) {
        router.replace('/(auth)/name');
        return;
      }
      if (existingProfile.role === 'customer') {
        router.replace('/(customer)/home');
        return;
      }

      if (existingProfile.role === 'pro') {
        const proDetails = await getProDetails(userId);
        if (proDetails.onboarding_step && proDetails.onboarding_step !== 'complete') {
          router.replace(`/(pro)/onboarding/${proDetails.onboarding_step}`);
          return;
        }
        router.replace('/(pro)/dashboard');
        return;
      }
    } catch (error) {
      setShowRoleSheet(true);
    }
  };

  const handleRoleSelect = async (role: 'customer' | 'pro') => {
    if (!pendingSessionId || !phone) {
      return;
    }

    setShowRoleSheet(false);

    const createdProfile = await createProfile({
      id: pendingSessionId,
      role,
      phone_number: `+91${phone}`,
      full_name: 'New User'
    });
    setProfile(createdProfile);

    if (role === 'pro') {
      await upsertProDetails({ pro_id: pendingSessionId });
    }

    router.replace('/(auth)/name');
  };

  const handleResend = async () => {
    if (!phone || timer > 0) {
      return;
    }
    setTimer(30);
    await signInWithOtp(`+91${phone}`);
  };

  const RoleOption = ({
    title,
    description,
    icon,
    onPress,
    accent
  }: {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
    accent?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        backgroundColor: Theme.creamCard,
        borderWidth: 1,
        borderColor: accent ? Theme.amber : Theme.border
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          backgroundColor: accent ? Theme.amberLight : 'rgba(15,32,87,0.08)',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Ionicons name={icon as any} size={20} color={Theme.navy} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>{title}</Text>
        <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 2 }}>{description}</Text>
      </View>
      <Ionicons name="arrow-forward" size={18} color={Theme.textLight} />
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={[Theme.navy, Theme.navyMid]}
            style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
          >
            <Ionicons name="arrow-back" size={22} color={Theme.white} onPress={() => router.back()} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Image source={logoSource} style={{ width: 28, height: 28 }} resizeMode="contain" />
              </View>
              <View>
                <Text style={{ color: Theme.white, fontSize: 20, fontWeight: '700' }}>Verify OTP</Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
                  Sent to {maskedPhone}
                </Text>
              </View>
            </View>
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
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark }}>Enter the 6-digit code</Text>
              <Text style={{ fontSize: 12, color: Theme.textMid, marginTop: 6 }}>
                It usually arrives within a few seconds.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 8 }}>
                {otp.map((digit, index) => {
                  const isFocused = focusedIndex === index;
                  const hasValue = Boolean(digit);
                  return (
                    <TextInput
                      key={`otp-${index}`}
                      ref={(ref) => {
                        inputs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(value) => handleChange(value, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      style={{
                        width: 46,
                        height: 54,
                        borderWidth: 1.5,
                        borderColor: isFocused ? Theme.amber : hasValue ? Theme.navy : Theme.border,
                        borderRadius: 14,
                        textAlign: 'center',
                        fontSize: 18,
                        fontWeight: '700',
                        color: Theme.textDark,
                        backgroundColor: isFocused ? 'rgba(245,184,0,0.15)' : Theme.creamCard
                      }}
                    />
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <Text style={{ color: Theme.textLight, fontSize: 12 }}>
                  {timer > 0 ? `Resend in 0:${timer.toString().padStart(2, '0')}` : 'Did not receive the code?'}
                </Text>
                <Pressable onPress={handleResend} disabled={timer > 0}>
                  <Text style={{ color: timer > 0 ? Theme.textLight : Theme.navy, fontWeight: '700', fontSize: 12 }}>
                    Resend
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
        <View style={{ padding: 20 }}>
          <Button onPress={handleVerify} disabled={otp.join('').length !== 6}>
            Verify & continue
          </Button>
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={showRoleSheet} onClose={() => setShowRoleSheet(false)}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.textDark }}>Choose your role</Text>
        <Text style={{ color: Theme.textMid, marginTop: 4, fontSize: 12 }}>
          Tell us how you want to use Zapfix.
        </Text>
        <View style={{ marginTop: 16, gap: 12 }}>
          <RoleOption
            title="I need a service"
            description="Book repairs, track jobs, and manage warranties."
            icon="home"
            accent
            onPress={() => handleRoleSelect('customer')}
          />
          <RoleOption
            title="I am a service professional"
            description="Accept requests, manage inventory, and earn."
            icon="briefcase"
            onPress={() => handleRoleSelect('pro')}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
