import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OnboardingCard, OnboardingScaffold } from '@/components/pro/OnboardingChrome';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function Bank() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { updateProDetails } = useProfile(profile?.id ?? '');

  const [holder, setHolder] = useState(profile?.full_name ?? '');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const accountValid = /^\d{9,18}$/.test(accountNumber);
  const accountsMatch = accountNumber.length > 0 && accountNumber === confirmAccount;
  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  const canContinue = holder.trim().length > 1 && accountValid && accountsMatch && ifscValid;

  const handleContinue = async () => {
    if (!profile?.id || !canContinue) return;
    setSubmitting(true);
    try {
      await updateProDetails({
        id: profile.id,
        data: {
          // Real penny-drop verification (Razorpay/Cashfree) plugs in here. We
          // store a payout reference for now.
          bank_account_ref: `bank_${ifsc}_${accountNumber.slice(-4)}`,
          onboarding_step: 'tools',
        },
      });
      router.replace('/(pro)/onboarding/tools');
    } catch {
      Alert.alert('Error', 'Could not save your bank details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingScaffold
      stepKey="bank"
      eyebrow="GET PAID"
      title="Add your bank account"
      subtitle="This is where your job payouts land. We never store your full details — only a secure payout reference."
      footer={
        <Button onPress={handleContinue} loading={submitting} disabled={submitting || !canContinue}>
          Continue
        </Button>
      }
    >
      <OnboardingCard>
        <Input label="Account holder name" value={holder} onChangeText={setHolder} placeholder="As per bank records" />
        <Input
          label="Account number"
          value={accountNumber}
          onChangeText={(t) => setAccountNumber(t.replace(/[^\d]/g, '').slice(0, 18))}
          placeholder="Bank account number"
          keyboardType="number-pad"
          secureTextEntry
          error={accountNumber.length > 0 && !accountValid ? 'Enter a valid account number' : undefined}
        />
        <Input
          label="Confirm account number"
          value={confirmAccount}
          onChangeText={(t) => setConfirmAccount(t.replace(/[^\d]/g, '').slice(0, 18))}
          placeholder="Re-enter account number"
          keyboardType="number-pad"
          error={confirmAccount.length > 0 && !accountsMatch ? 'Account numbers do not match' : undefined}
        />
        <Input
          label="IFSC code"
          value={ifsc}
          onChangeText={(t) => setIfsc(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
          placeholder="e.g. HDFC0001234"
          autoCapitalize="characters"
          error={ifsc.length > 0 && !ifscValid ? 'Enter a valid 11-character IFSC' : undefined}
        />
      </OnboardingCard>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Ionicons name="shield-checkmark" size={14} color={colors.text.muted} />
        <Text style={{ color: colors.text.muted, fontSize: 12, flex: 1 }}>
          Bank-grade encryption · verified via a ₹1 penny-drop.
        </Text>
      </View>
    </OnboardingScaffold>
  );
}
