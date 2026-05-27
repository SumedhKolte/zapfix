import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { phoneSchema } from '@/utils/validators';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

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

const schema = z.object({ phone: phoneSchema });

type FormValues = {
  phone: string;
};

export default function PhoneEntry() {
  const router = useRouter();
  const { signInWithOtp } = useAuth();
  const { control, handleSubmit, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' }
  });

  const phone = watch('phone');

  const onSubmit = async (values: FormValues) => {
    await signInWithOtp(`+91${values.phone}`);
    router.push({ pathname: '/(auth)/otp-verify', params: { phone: values.phone } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.cream }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* ── Navy header ── */}
          <LinearGradient
            colors={[Theme.navy, Theme.navyMid]}
            style={{
              paddingTop: 16,
              paddingBottom: 52,
              paddingHorizontal: 24,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', position: 'relative' }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="arrow-back" size={20} color={Theme.white} />
              </TouchableOpacity>

              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 8,
                  height: 72,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Image
                  source={logoSource}
                  style={{ width: 56, height: 56, borderRadius: 14 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text
              style={{
                color: Theme.white,
                fontSize: 28,
                fontWeight: '800',
                textAlign: 'left',
                marginTop: 70
              }}
            >
              Enter your phone number
            </Text>

            <Text
              style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: 14,
                textAlign: 'left',
                marginTop: 11,
                lineHeight: 20
              }}
            >
              We will send a one-time verification code to secure your account.
            </Text>
          </LinearGradient>

          {/* ── White card ── */}
          <View style={{ paddingHorizontal: 20, marginTop: -24 }}>
            <View
              style={{
                backgroundColor: Theme.creamCard,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: Theme.border,
                shadowColor: Theme.navy,
                shadowOpacity: 0.1,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: Theme.textDark,
                  letterSpacing: 0.2,
                  lineHeight: 26,
                  marginBottom: 4
                }}
              >
                Mobile number
              </Text>
              <Text style={{ fontSize: 13, color: Theme.textMid, marginBottom: 16, lineHeight: 18 }}>
                Use the same number you want to receive service updates on.
              </Text>

              <Controller
                control={control}
                name="phone"
                render={({ field: { value, onChange }, fieldState }) => (
                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        borderRadius: 14,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: fieldState.error ? '#EF4444' : Theme.border
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: Theme.amberLight,
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          gap: 8
                        }}
                      >
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: Theme.white,
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Ionicons name="call" size={14} color={Theme.amber} />
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.textDark }}>+91</Text>
                        <Ionicons name="chevron-down" size={13} color={Theme.textMid} />
                      </View>

                      <View style={{ width: 1, backgroundColor: Theme.border }} />

                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        keyboardType="number-pad"
                        placeholder="10-digit mobile number"
                        placeholderTextColor="#A0A8BF"
                        maxLength={10}
                        style={{
                          flex: 1,
                          backgroundColor: Theme.white,
                          paddingHorizontal: 14,
                          fontSize: 15,
                          color: Theme.textDark,
                          height: 52
                        }}
                      />
                    </View>

                    {fieldState.error ? (
                      <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>
                        {fieldState.error.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />
            </View>
          </View>

          <View style={{ flex: 1 }} />
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 }}>
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={phone.length !== 10 || formState.isSubmitting}
            loading={formState.isSubmitting}
            rightIcon={<Ionicons name="arrow-forward" size={18} color={Theme.navy} />}
          >
            Send OTP
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
