import { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

// The in-app onboarding steps, in order. (Phone OTP happens during auth, and
// "Live" is the dashboard once `onboarding_step` reaches 'complete'.)
export const ONBOARDING_STEPS = [
  { key: 'aadhaar', label: 'Aadhaar Verification' },
  { key: 'selfie', label: 'Selfie Match' },
  { key: 'category', label: 'Category Selection' },
  { key: 'assessment', label: 'Skill Assessment' },
  { key: 'background', label: 'Background Verification' },
  { key: 'bank', label: 'Bank Account' },
  { key: 'tools', label: 'Tool Verification' },
  { key: 'trust', label: 'Trust Score' },
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]['key'];
export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length;

export const onboardingStepNumber = (key: OnboardingStepKey) =>
  ONBOARDING_STEPS.findIndex((s) => s.key === key) + 1;

/**
 * The data a step needs to count as genuinely *done*. We deliberately derive
 * this from the saved per-step data rather than trusting `onboarding_step`,
 * because that pointer can read 'complete' while individual steps are still
 * empty (legacy rows, partial saves). "Verified Pro" must require all 8.
 */
export type ProStepInputs = {
  aadhaar_ref?: string | null;
  liveness_verified?: boolean | null;
  ai_skill_score?: number | null;
  background_status?: string | null;
  bank_account_ref?: string | null;
  tools_verified?: boolean | null;
  trust_score?: number | null;
  skillCount?: number;
};

/** Per-step done flags, in the canonical 8-step order. */
export const proStepCompletion = (i: ProStepInputs): Record<OnboardingStepKey, boolean> => ({
  aadhaar: Boolean(i.aadhaar_ref),
  selfie: Boolean(i.liveness_verified),
  category: (i.skillCount ?? 0) > 0,
  assessment: i.ai_skill_score != null,
  background: i.background_status === 'clear',
  bank: Boolean(i.bank_account_ref),
  tools: i.tools_verified != null,
  trust: i.trust_score != null,
});

/** How many of the 8 steps are genuinely complete. */
export const completedStepCount = (i: ProStepInputs): number =>
  Object.values(proStepCompletion(i)).filter(Boolean).length;

/** The first step still missing data, or null when all 8 are done. */
export const firstIncompleteStep = (i: ProStepInputs): OnboardingStepKey | null => {
  const done = proStepCompletion(i);
  return ONBOARDING_STEPS.find((s) => !done[s.key])?.key ?? null;
};

/** The step immediately before `key`, or null if it's the first step. */
export const previousStepKey = (key: OnboardingStepKey): OnboardingStepKey | null => {
  const idx = ONBOARDING_STEPS.findIndex((s) => s.key === key);
  return idx > 0 ? ONBOARDING_STEPS[idx - 1].key : null;
};

/** The step immediately after `key`, or null if it's the last step. */
export const nextStepKey = (key: OnboardingStepKey): OnboardingStepKey | null => {
  const idx = ONBOARDING_STEPS.findIndex((s) => s.key === key);
  return idx >= 0 && idx < ONBOARDING_STEPS.length - 1 ? ONBOARDING_STEPS[idx + 1].key : null;
};

/** Linear progress sequence, with the terminal 'complete' sentinel. */
export type OnboardingProgress = OnboardingStepKey | 'complete';
const STEP_SEQUENCE: OnboardingProgress[] = [...ONBOARDING_STEPS.map((s) => s.key), 'complete'];

export const stepRank = (key?: string | null): number => {
  const i = STEP_SEQUENCE.indexOf((key ?? 'aadhaar') as OnboardingProgress);
  return i === -1 ? 0 : i;
};

/**
 * The onboarding_step to persist after finishing `from`. Never regresses: if the
 * pro is already further along (e.g. editing an earlier step, or revisiting a
 * step after completing everything) their saved progress is kept. Otherwise it
 * advances to the step after `from` (or 'complete' when `from` is the last step).
 */
export const advanceOnboarding = (current: string | null | undefined, from: OnboardingStepKey): OnboardingProgress => {
  const next = (nextStepKey(from) ?? 'complete') as OnboardingProgress;
  return stepRank(current) >= stepRank(next) ? ((current as OnboardingProgress) || next) : next;
};

type ScaffoldProps = {
  stepKey: OnboardingStepKey;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  canGoBack?: boolean;
  /** When editing a single step from the details view, back returns there. */
  isEdit?: boolean;
};

/**
 * "Previous" / back navigation for an onboarding step. During the linear flow we
 * jump straight to the previous step (via replace, so the wizard stays one
 * screen and Previous works even when the pro resumed mid-flow or is on the
 * final submit step reviewing their answers). When editing a single step we just
 * pop back to the details view, and on the first step we leave the flow.
 */
export function useOnboardingBack(stepKey: OnboardingStepKey, isEdit = false) {
  const router = useRouter();
  const prevKey = previousStepKey(stepKey);
  // In the linear flow there's always a destination — the previous step, or
  // Profile from the first step — so the control always shows. In edit mode we
  // just pop back to the details view.
  const canGoBack = isEdit ? router.canGoBack() : true;
  const goBack = () => {
    if (isEdit) {
      router.back();
    } else if (prevKey) {
      router.replace(`/(pro)/onboarding/${prevKey}`);
    } else {
      // First step: leave the flow for Profile directly (replace, not back) so
      // we don't pop into an empty history and so the layout's onboarding gate
      // — which permits Profile — doesn't bounce the pro back to step 1.
      router.replace('/(pro)/profile');
    }
  };
  return { goBack, canGoBack };
}

/**
 * Shared chrome for every onboarding screen: themed gradient header with the
 * back control, "Step N of 8" label, animated progress bar, title/subtitle, a
 * scrolling content area and an optional sticky footer (for the primary CTA).
 */
export function OnboardingScaffold({
  stepKey,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  canGoBack = true,
  isEdit = false,
}: ScaffoldProps) {
  const { colors } = useTheme();
  const stepNo = onboardingStepNumber(stepKey);
  const progress = stepNo / TOTAL_ONBOARDING_STEPS;
  const { goBack, canGoBack: hasBack } = useOnboardingBack(stepKey, isEdit);
  const showBack = canGoBack && hasBack;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <LinearGradient
        colors={[colors.navy.primary, colors.navy.light]}
        style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 26 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {showBack ? (
            <Pressable
              onPress={goBack}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </Pressable>
          ) : null}
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' }}>
            Step {stepNo} of {TOTAL_ONBOARDING_STEPS}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ color: colors.amber.primary, fontSize: 12, fontWeight: '800' }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>

        {eyebrow ? (
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={{ color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 4 }}>{title}</Text>
        {subtitle ? (
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6, lineHeight: 19 }}>
            {subtitle}
          </Text>
        ) : null}

        <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginTop: 16 }}>
          <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: colors.amber.primary, borderRadius: 3 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: footer ? 24 : 40, gap: 14 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      {footer ? (
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 16,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12 }}>
            {showBack ? (
              <Pressable
                onPress={goBack}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingHorizontal: 18,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                }}
              >
                <Ionicons name="chevron-back" size={16} color={colors.text.primary} />
                <Text style={{ color: colors.text.primary, fontWeight: '800', fontSize: 14 }}>Previous</Text>
              </Pressable>
            ) : null}
            <View style={{ flex: 1 }}>{footer}</View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/** A simple surface card used throughout the onboarding screens. */
export function OnboardingCard({ children, style }: { children: ReactNode; style?: object }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
