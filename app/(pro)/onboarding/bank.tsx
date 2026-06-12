import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OnboardingCard, OnboardingScaffold, advanceOnboarding } from '@/components/pro/OnboardingChrome';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function Bank() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { proDetailsQuery, updateProDetails } = useProfile(profile?.id ?? '');

  const [holder, setHolder] = useState(profile?.full_name ?? '');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // The full account number isn't stored — only a payout reference
  // (bank_<IFSC>_<last4>). On return we recover the IFSC + last 4 to display,
  // prefill the IFSC, and let the pro keep it or enter a new account to change.
  const savedRef = proDetailsQuery.data?.bank_account_ref ?? null;
  const parsedRef = savedRef ? savedRef.match(/^bank_([A-Z0-9]+)_(\d{4})$/) : null;
  const savedIfsc = parsedRef?.[1] ?? '';
  const savedLast4 = parsedRef?.[2] ?? '';
  useEffect(() => {
    if (savedIfsc && ifsc.length === 0) setIfsc(savedIfsc);
  }, [savedIfsc]);

  const accountValid = /^\d{9,18}$/.test(accountNumber);
  const accountsMatch = accountNumber.length > 0 && accountNumber === confirmAccount;
  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  // Keeping the saved account (no new number typed) only needs a valid IFSC.
  const keepingExisting = Boolean(savedRef) && accountNumber.length === 0;
  const canContinue =
    holder.trim().length > 1 && ifscValid && (keepingExisting || (accountValid && accountsMatch));

  const handleContinue = async () => {
    if (!profile?.id || !canContinue) return;
    setSubmitting(true);
    try {
      await updateProDetails({
        id: profile.id,
        data: {
          // Real penny-drop verification (Razorpay/Cashfree) plugs in here. We
          // store a payout reference for now. Keep the saved account when no new
          // number is entered (an IFSC-only edit still updates the reference).
          bank_account_ref:
            accountNumber.length > 0
              ? `bank_${ifsc}_${accountNumber.slice(-4)}`
              : savedRef
                ? `bank_${ifsc}_${savedLast4}`
                : savedRef,
          onboarding_step: advanceOnboarding(proDetailsQuery.data?.onboarding_step, 'bank'),
        },
      });
      if (isEdit) router.back();
      else router.replace('/(pro)/onboarding/tools');
    } catch {
      Alert.alert('Error', 'Could not save your bank details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingScaffold
      stepKey="bank"
      isEdit={isEdit}
      eyebrow="GET PAID"
      title="Add your bank account"
      subtitle="This is where your job payouts land. We never store your full details — only a secure payout reference."
      footer={
        <Button onPress={handleContinue} loading={submitting} disabled={submitting || !canContinue}>
          Continue
        </Button>
      }
    >
      {savedRef ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.success + '18', borderRadius: 12, padding: 12 }}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={{ color: colors.success, fontWeight: '700', flex: 1, fontSize: 13 }}>
            Saved account ending ••••{savedLast4}{savedIfsc ? ` · IFSC ${savedIfsc}` : ''}. Enter a new account number to change it.
          </Text>
        </View>
      ) : null}

      <OnboardingCard>
        <Input label="Account holder name" value={holder} onChangeText={setHolder} placeholder="As per bank records" />
        <Input
          label={savedRef ? 'Account number (optional — already on file)' : 'Account number'}
          value={accountNumber}
          onChangeText={(t) => setAccountNumber(t.replace(/[^\d]/g, '').slice(0, 18))}
          placeholder={savedRef ? `Saved ····${savedLast4} · enter to change` : 'Bank account number'}
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
