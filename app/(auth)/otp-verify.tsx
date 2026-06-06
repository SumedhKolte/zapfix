import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, getProDetails, upsertProDetails } from '@/services/profile';
import { useAuthStore } from '@/stores/authStore';
import { isFullNameMissing } from '@/utils/profile';
import { friendlyAuthError } from '@/utils/authErrors';

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
  const { verifyOtp, createProfile, signInWithOtp, session } = useAuth();
  const { setProfile } = useAuthStore();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [showRoleSheet, setShowRoleSheet] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const resetOtp = () => {
    setOtp(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
  };

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
    if (!phone || verifying) {
      return;
    }

    setVerifying(true);

    // An OTP token is single-use: once verifyOtp succeeds the token is consumed
    // server-side and a session exists. If a previous tap already verified but
    // a later step (profile lookup / role pick) failed, re-sending the same
    // token would be rejected as "expired". So reuse the live session and just
    // resume resolving the destination instead of verifying again.
    let activeSession = session;
    if (!activeSession?.user?.id) {
      if (token.length !== 6) {
        setVerifying(false);
        return;
      }
      try {
        activeSession = await verifyOtp({ phone: `+91${phone}`, token });
      } catch (err) {
        const { title, message } = friendlyAuthError(err);
        Alert.alert(title, message);
        resetOtp();
        setVerifying(false);
        return;
      }
    }

    const userId = activeSession?.user?.id;
    if (!userId) {
      // verifyOtp resolved without a usable session — surface it instead of
      // silently dropping the tap (which looked like "nothing happened").
      Alert.alert(
        'Verification incomplete',
        'We could not start your session. Please request a new code and try again.'
      );
      resetOtp();
      setVerifying(false);
      return;
    }
    setPendingSessionId(userId);

    try {
      const existingProfile = await getProfile(userId);
      if (!existingProfile) {
        // Brand-new auth user with no profile row yet — ask for role.
        setShowRoleSheet(true);
        return;
      }
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
        try {
          const proDetails = await getProDetails(userId);
          if (proDetails?.onboarding_step && proDetails.onboarding_step !== 'complete') {
            router.replace(`/(pro)/onboarding/${proDetails.onboarding_step}`);
            return;
          }
        } catch {
          // Fall through to dashboard when pro details lookup fails.
        }
        router.replace('/(pro)/dashboard');
        return;
      }

      // Profile exists but has an unrecognised role — fall back to role picker.
      setShowRoleSheet(true);
    } catch (err) {
      // Profile lookup failed — likely RLS or transient network. Let the user
      // pick a role so we can try to create the profile and keep moving.
      console.warn('[auth] profile lookup after OTP failed', err);
      setShowRoleSheet(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleRoleSelect = async (role: 'customer' | 'pro') => {
    if (!pendingSessionId || !phone) {
      return;
    }

    setShowRoleSheet(false);

    try {
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
    } catch (err) {
      // Re-open the sheet so the user isn't stranded after a failure.
      const { title, message } = friendlyAuthError(err);
      Alert.alert(title, message);
      setShowRoleSheet(true);
    }
  };

  const handleResend = async () => {
    if (!phone || timer > 0 || resending) {
      return;
    }
    setResending(true);
    try {
      await signInWithOtp(`+91${phone}`);
      setTimer(30);
    } catch (err) {
      const { title, message } = friendlyAuthError(err);
      Alert.alert(title, message);
    } finally {
      setResending(false);
    }
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
                <Pressable onPress={handleResend} disabled={timer > 0 || resending}>
                  <Text style={{ color: timer > 0 || resending ? Theme.textLight : Theme.navy, fontWeight: '700', fontSize: 12 }}>
                    {resending ? 'Sending...' : 'Resend'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
        <View style={{ padding: 20 }}>
          <Button
            onPress={handleVerify}
            disabled={(otp.join('').length !== 6 && !session?.user?.id) || verifying}
            loading={verifying}
          >
            Verify & continue
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showRoleSheet}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowRoleSheet(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(10,15,30,0.45)', justifyContent: 'flex-end' }}
          onPress={() => setShowRoleSheet(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: Theme.cream,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 32
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: Theme.border,
                marginBottom: 16
              }}
            />
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
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
