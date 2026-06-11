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

type ScaffoldProps = {
  stepKey: OnboardingStepKey;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  canGoBack?: boolean;
};

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
}: ScaffoldProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const stepNo = onboardingStepNumber(stepKey);
  const progress = stepNo / TOTAL_ONBOARDING_STEPS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <LinearGradient
        colors={[colors.navy.primary, colors.navy.light]}
        style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 26 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {canGoBack && router.canGoBack() ? (
            <Pressable
              onPress={() => router.back()}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </Pressable>
          ) : null}
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' }}>
            Step {stepNo} of {TOTAL_ONBOARDING_STEPS}
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
          {footer}
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
