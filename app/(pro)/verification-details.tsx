import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import {
  ONBOARDING_STEPS,
  onboardingStepNumber,
  type OnboardingStepKey,
} from '@/components/pro/OnboardingChrome';

type Field = { label: string; value: string };

const STEP_ICONS: Record<OnboardingStepKey, string> = {
  aadhaar: 'id-card',
  selfie: 'happy',
  category: 'construct',
  assessment: 'hammer',
  background: 'shield-checkmark',
  bank: 'card',
  tools: 'briefcase',
  trust: 'ribbon',
};

/** Masks a stored reference token so we surface that it exists without leaking it. */
const maskRef = (ref?: string | null) => {
  if (!ref) return '—';
  if (ref.length <= 6) return ref;
  return `${ref.slice(0, 4)}••••${ref.slice(-4)}`;
};

export default function VerificationDetails() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { proDetailsQuery } = useProfile(profile?.id ?? '');
  const d = proDetailsQuery.data;

  const skillsQuery = useQuery({
    queryKey: ['pro-skills-detail', profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pro_skills')
        .select('skill_id, catalog_skills:skill_id(skill_name)')
        .eq('pro_id', profile?.id ?? '');
      if (error) throw error;
      return (data ?? [])
        .map((row: any) => String(row.catalog_skills?.skill_name ?? ''))
        .filter(Boolean);
    },
  });

  const skillNames = skillsQuery.data ?? [];

  // Per-step saved data + a "done" flag, in the canonical 8-step order.
  const sections: Record<OnboardingStepKey, { done: boolean; fields: Field[] }> = {
    aadhaar: {
      done: Boolean(d?.aadhaar_ref),
      fields: [
        { label: 'Full name', value: profile?.full_name ?? '—' },
        { label: 'KYC reference', value: maskRef(d?.aadhaar_ref) },
        { label: 'KYC status', value: (d?.kyc_status ?? 'pending').replace(/^\w/, (c) => c.toUpperCase()) },
      ],
    },
    selfie: {
      done: Boolean(d?.liveness_verified),
      fields: [
        { label: 'Liveness', value: d?.liveness_verified ? 'Verified' : 'Not verified' },
        { label: 'Face match', value: d?.selfie_match_score != null ? `${d.selfie_match_score}%` : '—' },
      ],
    },
    category: {
      done: skillNames.length > 0,
      fields: [
        {
          label: 'Selected trades',
          value: skillNames.length > 0 ? skillNames.join(', ') : '—',
        },
      ],
    },
    assessment: {
      done: d?.ai_skill_score != null,
      fields: [{ label: 'Skill score', value: d?.ai_skill_score != null ? `${d.ai_skill_score} / 10` : '—' }],
    },
    background: {
      done: d?.background_status === 'clear',
      fields: [
        {
          label: 'Screening',
          value: d?.background_status ? d.background_status.replace(/^\w/, (c) => c.toUpperCase()) : 'Pending',
        },
      ],
    },
    bank: {
      done: Boolean(d?.bank_account_ref),
      fields: [{ label: 'Payout account', value: maskRef(d?.bank_account_ref) }],
    },
    tools: {
      done: d?.tools_verified != null,
      fields: [
        { label: 'Toolkit', value: d?.tools_verified ? 'Verified' : 'Submitted for review' },
        ...(d?.tools_missing && d.tools_missing.length > 0
          ? [{ label: 'Flagged for review', value: d.tools_missing.join(', ') }]
          : []),
      ],
    },
    trust: {
      done: d?.trust_score != null,
      fields: [{ label: 'Trust score', value: d?.trust_score != null ? `${Math.round(Number(d.trust_score))} / 100` : '—' }],
    },
  };

  const completedCount = Object.values(sections).filter((s) => s.done).length;

  // Header mirrors the verification card on the profile: a complete-but-pending
  // application is "under review", an approved one is the "Verified Pro" badge,
  // a rejected one prompts a re-submit.
  const vStatus = d?.verification_status ?? 'pending';
  const allStepsDone = completedCount === ONBOARDING_STEPS.length;
  const header =
    allStepsDone && vStatus === 'verified'
      ? {
          gradient: [colors.success, colors.navy.primary] as const,
          icon: 'shield-checkmark' as const,
          eyebrow: 'VERIFICATION DETAILS',
          title: 'Verified Pro',
          subtitle: `${completedCount} of ${ONBOARDING_STEPS.length} steps verified`,
        }
      : vStatus === 'rejected'
        ? {
            gradient: [colors.error, colors.navy.primary] as const,
            icon: 'close-circle' as const,
            eyebrow: 'VERIFICATION DETAILS',
            title: 'Verification Failed',
            subtitle: 'Review your details below and re-submit',
          }
        : {
            gradient: [colors.amber.dark, colors.navy.primary] as const,
            icon: 'time' as const,
            eyebrow: 'VERIFICATION DETAILS',
            title: 'Verification Pending',
            subtitle: `${completedCount} of ${ONBOARDING_STEPS.length} steps submitted · under review`,
          };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <LinearGradient
        colors={header.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 26 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {router.canGoBack() ? (
            <Pressable
              onPress={() => router.back()}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </Pressable>
          ) : null}
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>
            {header.eyebrow}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={header.icon} size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.white, fontSize: 22, fontWeight: '800' }}>{header.title}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
              {header.subtitle}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {ONBOARDING_STEPS.map((step) => {
          const section = sections[step.key];
          return (
            <View
              key={step.key}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.amber.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={STEP_ICONS[step.key] as any} size={18} color={colors.amber.dark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 0.5 }}>
                    STEP {onboardingStepNumber(step.key)}
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text.primary }}>{step.label}</Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: (section.done ? colors.success : colors.text.muted) + '18',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Ionicons
                    name={section.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={13}
                    color={section.done ? colors.success : colors.text.muted}
                  />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: section.done ? colors.success : colors.text.muted }}>
                    {section.done ? 'Done' : 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
                {section.fields.map((f) => (
                  <View key={f.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <Text style={{ width: 120, fontSize: 12, color: colors.text.muted, fontWeight: '600' }}>{f.label}</Text>
                    <Text style={{ flex: 1, fontSize: 13, color: colors.text.primary, fontWeight: '600' }}>{f.value}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => router.push(`/(pro)/onboarding/${step.key}?edit=1`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                }}
              >
                <Ionicons name="create-outline" size={15} color={colors.navy.primary} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.navy.primary }}>Edit this step</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
