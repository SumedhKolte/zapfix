import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useOnboardingBack } from '@/components/pro/OnboardingChrome';

type Signal = { label: string; points: number; max: number; done: boolean };

export default function Trust() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  // Back steps to the previous step (Tools) so the pro can review every step
  // before submitting; in edit mode it returns to the details view.
  const { goBack, canGoBack } = useOnboardingBack('trust', isEdit);
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { proDetailsQuery, updateProDetails } = useProfile(profile?.id ?? '');
  const d = proDetailsQuery.data;

  const [submitting, setSubmitting] = useState(false);
  const [persisted, setPersisted] = useState(false);
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  const { signals, total } = useMemo(() => {
    const skill = d?.ai_skill_score ? Number(d.ai_skill_score) : 0;
    const sigs: Signal[] = [
      { label: 'Aadhaar verified', points: d?.aadhaar_ref ? 20 : 0, max: 20, done: Boolean(d?.aadhaar_ref) },
      { label: 'Selfie match', points: d?.liveness_verified ? 15 : 0, max: 15, done: Boolean(d?.liveness_verified) },
      { label: 'Skill assessment', points: Math.round(skill * 2.5), max: 25, done: skill > 0 },
      { label: 'Background clear', points: d?.background_status === 'clear' ? 20 : 0, max: 20, done: d?.background_status === 'clear' },
      { label: 'Bank account added', points: d?.bank_account_ref ? 10 : 0, max: 10, done: Boolean(d?.bank_account_ref) },
      { label: 'Toolkit verified', points: d?.tools_verified ? 10 : 0, max: 10, done: Boolean(d?.tools_verified) },
    ];
    const sum = Math.min(100, sigs.reduce((acc, s) => acc + s.points, 0));
    return { signals: sigs, total: sum };
  }, [d?.aadhaar_ref, d?.liveness_verified, d?.ai_skill_score, d?.background_status, d?.bank_account_ref, d?.tools_verified]);

  // Persist the computed trust score once details have loaded.
  useEffect(() => {
    if (!profile?.id || proDetailsQuery.isLoading || persisted) return;
    setPersisted(true);
    updateProDetails({ id: profile.id, data: { trust_score: total } }).catch((err) =>
      console.warn('Could not persist trust score', err)
    );
  }, [profile?.id, proDetailsQuery.isLoading, persisted, total]);

  // Animate the score counting up.
  useEffect(() => {
    if (proDetailsQuery.isLoading) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    anim.setValue(0);
    Animated.timing(anim, { toValue: total, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [total, proDetailsQuery.isLoading]);

  const tier =
    total >= 85 ? { label: 'Elite Pro', color: colors.success } :
    total >= 65 ? { label: 'Trusted Pro', color: colors.amber.dark } :
    { label: 'Building Trust', color: colors.blue.primary };

  const goLive = async () => {
    if (!profile?.id) return;
    setSubmitting(true);
    try {
      // All 8 steps done — mark the application submitted. It now sits in review
      // ('Verification Pending') until the platform approves it; never downgrade
      // an already-verified pro who's just editing this step.
      const currentV = d?.verification_status;
      await updateProDetails({
        id: profile.id,
        data: {
          trust_score: total,
          onboarding_step: 'complete',
          ...(currentV === 'verified' ? {} : { verification_status: 'pending' as const }),
        },
      });
      // Editing from the details view returns there; finishing the flow goes live.
      if (isEdit) router.back();
      else router.replace('/(pro)/dashboard');
    } catch {
      Alert.alert('Error', 'Could not finish onboarding. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <LinearGradient colors={[colors.navy.primary, colors.navy.light]} style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, alignItems: 'center' }}>
        {canGoBack ? (
          <Pressable
            onPress={goBack}
            style={{ position: 'absolute', top: 16, left: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </Pressable>
        ) : null}
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 12 }}>STEP 8 OF 8 · TRUST SCORE</Text>
        <View
          style={{
            width: 150, height: 150, borderRadius: 75, marginTop: 18,
            borderWidth: 6, borderColor: colors.amber.primary,
            alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <Text style={{ color: colors.white, fontSize: 48, fontWeight: '800' }}>{display}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' }}>/ 100</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 }}>
          <Ionicons name="ribbon" size={16} color={colors.amber.primary} />
          <Text style={{ color: colors.white, fontWeight: '800' }}>{tier.label}</Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 12, textAlign: 'center', maxWidth: 300 }}>
          Your trust score grows as you complete jobs and earn great reviews. Higher scores unlock premium, higher-paying jobs.
        </Text>
      </LinearGradient>

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 18, gap: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text.primary, marginLeft: 4 }}>HOW IT'S CALCULATED</Text>
        {signals.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: s.done ? colors.success + '22' : colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={s.done ? 'checkmark' : 'remove'} size={16} color={s.done ? colors.success : colors.text.muted} />
            </View>
            <Text style={{ flex: 1, color: colors.text.primary, fontWeight: '600', fontSize: 13 }}>{s.label}</Text>
            <Text style={{ color: s.done ? colors.text.primary : colors.text.muted, fontWeight: '800', fontSize: 13 }}>
              +{s.points}<Text style={{ color: colors.text.muted, fontWeight: '600' }}> / {s.max}</Text>
            </Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button onPress={goLive} loading={submitting} disabled={submitting || proDetailsQuery.isLoading}>
          {isEdit ? 'Save & return' : 'Submit for verification'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
