import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { phoneSchema } from '@/utils/validators';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white, padding: 24 }}>
      <View style={{ gap: 16 }}>
        <Ionicons name="arrow-back" size={24} color={Colors.navy.primary} onPress={() => router.back()} />
        <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.navy.primary }}>
          What's your number?
        </Text>
        <Text style={{ color: Colors.midGray }}>We'll send a one-time verification code</Text>
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
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: Colors.lightGray
                  }}
                >
                  <Text style={{ color: Colors.darkGray, fontWeight: '600' }}>🇮🇳 +91</Text>
                </View>
              }
              error={formState.errors.phone?.message}
            />
          )}
        />
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={phone.length !== 10 || formState.isSubmitting}
          loading={formState.isSubmitting}
        >
          Send OTP
        </Button>
      </View>
    </SafeAreaView>
  );
}
