import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { OnboardingCard, OnboardingScaffold } from '@/components/pro/OnboardingChrome';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const CHECKS = [
  { icon: 'shield-checkmark', label: 'Criminal record screening' },
  { icon: 'document-text', label: 'Address & identity history' },
  { icon: 'people', label: 'Reference & employment check' },
];

export default function Background() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { updateProDetails } = useProfile(profile?.id ?? '');

  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'running' | 'clear'>('idle');
  const [submitting, setSubmitting] = useState(false);

  const runCheck = async () => {
    if (!consent) {
      Alert.alert('Consent required', 'Please consent to the background check to continue.');
      return;
    }
    setStatus('running');
    // Real provider (e.g. AuthBridge / SpringVerify) plugs in here. We simulate
    // a successful screening so the flow is testable end to end.
    setTimeout(() => setStatus('clear'), 1800);
  };

  const handleContinue = async () => {
    if (!profile?.id || status !== 'clear') return;
    setSubmitting(true);
    try {
      await updateProDetails({
        id: profile.id,
        data: { background_status: 'clear', onboarding_step: 'bank' },
      });
      router.replace('/(pro)/onboarding/bank');
    } catch {
      Alert.alert('Error', 'Could not save your verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingScaffold
      stepKey="background"
      eyebrow="TRUST & SAFETY"
      title="Background verification"
      subtitle="Customers invite you into their homes — a clean background check keeps everyone safe and boosts your trust score."
      footer={
        status === 'clear' ? (
          <Button onPress={handleContinue} loading={submitting} disabled={submitting}>Continue</Button>
        ) : (
          <Button onPress={runCheck} loading={status === 'running'} disabled={!consent || status === 'running'}>
            {status === 'running' ? 'Running checks…' : 'Run background check'}
          </Button>
        )
      }
    >
      <OnboardingCard>
        {CHECKS.map((c, i) => (
          <View key={c.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border, paddingTop: i === 0 ? 0 : 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.navy.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={c.icon as any} size={18} color={colors.amber.dark} />
            </View>
            <Text style={{ flex: 1, color: colors.text.primary, fontWeight: '600', fontSize: 13 }}>{c.label}</Text>
            {status === 'clear' ? (
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            ) : status === 'running' ? (
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.muted} />
            ) : (
              <Ionicons name="time-outline" size={18} color={colors.text.muted} />
            )}
          </View>
        ))}
      </OnboardingCard>

      {status === 'clear' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.success + '18', borderRadius: 12, padding: 12 }}>
          <Ionicons name="shield-checkmark" size={18} color={colors.success} />
          <Text style={{ color: colors.success, fontWeight: '800', flex: 1 }}>Background verified — you're cleared.</Text>
        </View>
      ) : (
        <Pressable onPress={() => setConsent((c) => !c)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 }}>
          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: consent ? colors.amber.primary : colors.border, backgroundColor: consent ? colors.amber.primary : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            {consent ? <Ionicons name="checkmark" size={14} color={colors.navy.primary} /> : null}
          </View>
          <Text style={{ flex: 1, color: colors.text.secondary, fontSize: 12, lineHeight: 18 }}>
            I consent to Zapfix running a background verification using my submitted identity details.
          </Text>
        </Pressable>
      )}
    </OnboardingScaffold>
  );
}
