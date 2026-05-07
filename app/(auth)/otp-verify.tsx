import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, getProDetails, upsertProDetails } from '@/services/profile';

export default function OtpVerify() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, createProfile } = useAuth();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [showRoleSheet, setShowRoleSheet] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
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

    await createProfile({
      id: pendingSessionId,
      role,
      phone_number: `+91${phone}`,
      full_name: 'New User'
    });

    if (role === 'pro') {
      await upsertProDetails({ pro_id: pendingSessionId });
      router.replace('/(pro)/onboarding/identity');
      return;
    }

    router.replace('/(customer)/home');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white, padding: 24 }}>
      <View style={{ gap: 16 }}>
        <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
        <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.navy.primary }}>Enter OTP</Text>
        <Text style={{ color: Colors.midGray }}>Sent to {maskedPhone}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          {otp.map((digit, index) => (
            <TextInput
              key={`otp-${index}`}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(value) => handleChange(value, index)}
              keyboardType="number-pad"
              maxLength={1}
              style={{
                width: 44,
                height: 52,
                borderWidth: 1.5,
                borderColor: Colors.border,
                borderRadius: 12,
                textAlign: 'center',
                fontSize: 18
              }}
            />
          ))}
        </View>
        <Text style={{ color: Colors.midGray }}>
          {timer > 0 ? `Resend in 0:${timer.toString().padStart(2, '0')}` : 'Resend OTP'}
        </Text>
        <Button onPress={handleVerify}>Verify</Button>
      </View>

      <BottomSheet visible={showRoleSheet} onClose={() => setShowRoleSheet(false)}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.navy.primary }}>
          Choose your role
        </Text>
        <Text style={{ color: Colors.midGray, marginTop: 4 }}>
          Tell us how you want to use Zapfix.
        </Text>
        <View style={{ marginTop: 16, gap: 12 }}>
          <Button onPress={() => handleRoleSelect('customer')}>I need a service</Button>
          <Button variant="secondary" onPress={() => handleRoleSelect('pro')}>
            I'm a service professional
          </Button>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
