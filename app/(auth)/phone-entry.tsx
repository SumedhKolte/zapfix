import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Input } from '@/components/ui/Input';
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
  border: '#E2E6F0',
  white: '#FFFFFF'
};

const logoSource = require('../../assets/icon.png');

const schema = z.object({
  phone: phoneSchema
});

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
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
                <Text style={{ color: Theme.white, fontSize: 20, fontWeight: '700' }}>Enter your phone</Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
                  We will send a one-time verification code.
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
              <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.textDark, marginBottom: 6 }}>
                Mobile number
              </Text>
              <Text style={{ fontSize: 12, color: Theme.textMid, marginBottom: 12 }}>
                Use the same number you want to receive service updates on.
              </Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { value, onChange } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    placeholder="10-digit mobile number"
                    leftElement={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            backgroundColor: Theme.amberLight,
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Ionicons name="call" size={16} color={Theme.navy} />
                        </View>
                        <Text style={{ fontWeight: '700', color: Theme.textDark }}>+91</Text>
                      </View>
                    }
                    error={formState.errors.phone?.message}
                  />
                )}
              />
            </View>
          </View>
        </ScrollView>
        <View style={{ padding: 20 }}>
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
