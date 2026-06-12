import { useRef, useEffect, useState } from 'react';
import { Image, ScrollView, Text, View, Pressable, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useQuery } from '@tanstack/react-query';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
  TOTAL_ONBOARDING_STEPS,
  completedStepCount,
  firstIncompleteStep,
  type ProStepInputs,
} from '@/components/pro/OnboardingChrome';

function AnimatedRow({ children, delay = 0 }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, tension: 90, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateX }] }}>{children}</Animated.View>;
}

function SettingsRow({ icon, label, sublabel, onPress, chevron = true, danger = false }: any) {
  const { colors: Colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 18, paddingVertical: 14,
          backgroundColor: danger ? Colors.error + '14' : Colors.surface,
          borderBottomWidth: 1, borderBottomColor: Colors.border,
          gap: 14,
        }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? Colors.error + '20' : Colors.amber.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={18} color={danger ? Colors.error : Colors.amber.dark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: danger ? Colors.error : Colors.text.primary }}>{label}</Text>
          {sublabel ? <Text style={{ fontSize: 12, color: Colors.midGray, marginTop: 1 }}>{sublabel}</Text> : null}
        </View>
        {chevron ? <Ionicons name="chevron-forward" size={16} color={danger ? Colors.error + '80' : Colors.midGray} /> : null}
      </Pressable>
    </Animated.View>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { colors: Colors } = useTheme();
  return (
    <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.text.secondary, letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 }}>
      {title.toUpperCase()}
    </Text>
  );
}

function Card({ children, style }: any) {
  const { colors: Colors } = useTheme();
  return (
    <View style={{ backgroundColor: Colors.surface, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...style }}>
      {children}
    </View>
  );
}

function ProfileMetric({ label, value, icon, tone = 'navy' }: any) {
  const { colors: Colors } = useTheme();
  const color = tone === 'success' ? Colors.success : tone === 'amber' ? Colors.amber.dark : Colors.text.primary;
  const bg = tone === 'success' ? Colors.success + '12' : tone === 'amber' ? Colors.amber.light : Colors.amber.primary + '14';
  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 8 }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={{ color: Colors.midGray, fontSize: 11, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: Colors.text.primary, fontSize: 15, fontWeight: '900' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

type VerificationState = 'incomplete' | 'pending' | 'verified' | 'rejected';

/**
 * Single entry point into the 8-step pro registration / verification flow.
 *
 * The card reflects where the pro is across two independent axes — how much of
 * the 8-step form they've filled (`onboarding_step`) and the platform's review
 * decision (`verification_status`):
 *
 *   • incomplete — still filling the 8 steps → "Complete Registration", resumes
 *     wherever they left off.
 *   • pending    — all 8 steps submitted, awaiting review → "Verification
 *     Pending", taps through to the submitted details.
 *   • verified   — approved → "Verified Pro" badge, opens the details view.
 *   • rejected   — turned down → "Verification Failed", taps to re-run all 8
 *     steps (which resets progress and puts it back in review).
 */
function RegisterProCard({
  inputs,
  verificationStatus,
  proId,
}: {
  inputs: ProStepInputs;
  verificationStatus?: string | null;
  proId?: string;
}) {
  const { colors: Colors } = useTheme();
  const router = useRouter();
  const { updateProDetails } = useProfile(proId ?? '');

  // Drive everything off the *actual* per-step data — not the onboarding_step
  // pointer, which can read 'complete' while steps are still empty. "Verified
  // Pro" therefore shows only when all 8 steps are genuinely done AND approved.
  const completedSteps = completedStepCount(inputs);
  const allStepsDone = completedSteps === TOTAL_ONBOARDING_STEPS;
  const vStatus = verificationStatus ?? 'pending';
  const state: VerificationState = !allStepsDone
    ? 'incomplete'
    : vStatus === 'verified'
      ? 'verified'
      : vStatus === 'rejected'
        ? 'rejected'
        : 'pending';

  const resumeStep = firstIncompleteStep(inputs) ?? 'aadhaar';
  const currentNo = Math.min(completedSteps + 1, TOTAL_ONBOARDING_STEPS);
  const started = completedSteps > 0;
  const progress = completedSteps / TOTAL_ONBOARDING_STEPS;

  const config = {
    incomplete: {
      gradient: [Colors.navy.primary, Colors.navy.light] as const,
      icon: 'shield-checkmark-outline' as const,
      title: 'Complete Registration',
      subtitle: started
        ? `Resume — step ${currentNo} of ${TOTAL_ONBOARDING_STEPS}`
        : `Complete ${TOTAL_ONBOARDING_STEPS} quick steps to start receiving jobs`,
      badge: null as string | null,
    },
    pending: {
      gradient: [Colors.amber.dark, Colors.amber.primary] as const,
      icon: 'time-outline' as const,
      title: 'Verification Pending',
      subtitle: `All ${TOTAL_ONBOARDING_STEPS} steps submitted · under review · tap to view details`,
      badge: 'IN REVIEW',
    },
    verified: {
      gradient: [Colors.success, Colors.success] as const,
      icon: 'shield-checkmark' as const,
      title: 'Verified Pro',
      subtitle: `All ${TOTAL_ONBOARDING_STEPS} steps verified · tap to view your details`,
      badge: 'VERIFIED',
    },
    rejected: {
      gradient: [Colors.error, Colors.error] as const,
      icon: 'close-circle-outline' as const,
      title: 'Verification Failed',
      subtitle: `Your application needs changes · tap to re-do all ${TOTAL_ONBOARDING_STEPS} steps`,
      badge: 'REJECTED',
    },
  }[state];

  // Rejected pros restart from step 1: reset progress + put the application back
  // in review, then drop them at the first step. Existing answers are preserved
  // so they only re-confirm what changed.
  const restartFromRejection = async () => {
    if (proId) {
      try {
        await updateProDetails({
          id: proId,
          data: { onboarding_step: 'aadhaar', verification_status: 'pending' },
        });
      } catch {
        Alert.alert('Error', 'Could not restart your registration. Please try again.');
        return;
      }
    }
    router.push('/(pro)/onboarding/aadhaar');
  };

  const scale = useRef(new Animated.Value(1)).current;
  const onPress = () => {
    if (state === 'incomplete') router.push(`/(pro)/onboarding/${resumeStep}`);
    else if (state === 'rejected') restartFromRejection();
    else router.push('/(pro)/verification-details');
  };

  return (
    <Animated.View style={{ transform: [{ scale }], marginHorizontal: 20 }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      >
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 18, padding: 18, gap: 14 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={config.icon} size={22} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '800' }}>{config.title}</Text>
                {config.badge ? (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ color: Colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>{config.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 2 }}>{config.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
          </View>

          {state === 'incomplete' ? (
            <View style={{ gap: 6 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
                <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: Colors.amber.primary, borderRadius: 3 }} />
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>
                {completedSteps} of {TOTAL_ONBOARDING_STEPS} steps done
              </Text>
            </View>
          ) : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function ProProfile() {
  const { colors: Colors } = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { proDetailsQuery } = useProfile(profile?.id ?? '');
  const [signingOut, setSigningOut] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch {
            setSigningOut(false);
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  const kycStatus = proDetailsQuery.data?.kyc_status ?? 'pending';
  const trustScore = proDetailsQuery.data?.trust_score;

  // The category step is the only one whose completion lives outside
  // pro_details (in pro_skills), so we count it here to gate "Verified Pro".
  const skillCountQuery = useQuery({
    queryKey: ['pro-skill-count', profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('pro_skills')
        .select('skill_id', { count: 'exact', head: true })
        .eq('pro_id', profile?.id ?? '');
      if (error) throw error;
      return count ?? 0;
    },
  });

  const d = proDetailsQuery.data;
  const stepInputs: ProStepInputs = {
    aadhaar_ref: d?.aadhaar_ref,
    liveness_verified: d?.liveness_verified,
    ai_skill_score: d?.ai_skill_score,
    background_status: d?.background_status,
    bank_account_ref: d?.bank_account_ref,
    tools_verified: d?.tools_verified,
    trust_score: d?.trust_score,
    skillCount: skillCountQuery.data ?? 0,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View style={{ opacity: headerAnim }}>
          <LinearGradient colors={[Colors.navy.primary, Colors.navy.light, Colors.blue.primary]} locations={[0, 0.74, 1]} style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 54 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>PROFESSIONAL ACCOUNT</Text>
            <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 3 }}>Profile</Text>
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: -28, paddingHorizontal: 20 }}>
          <AnimatedRow delay={60}>
            <Card style={{ marginBottom: 0 }}>
              <View style={{ padding: 18, gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.navy.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.amber.primary, overflow: 'hidden' }}>
                    {profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={{ color: Colors.amber.primary, fontSize: 22, fontWeight: '800' }}>{initials}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.text.primary }}>{profile?.full_name ?? 'Professional'}</Text>
                    <Text style={{ color: Colors.text.secondary, fontSize: 13, marginTop: 2 }}>{profile?.phone_number ?? '+91 XXXXX XXXXX'}</Text>
                    {proDetailsQuery.data?.service_radius_km ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: Colors.amber.primary + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' }}>
                        <Ionicons name="navigate" size={11} color={Colors.amber.dark} />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.amber.dark }}>{proDetailsQuery.data.service_radius_km} km radius</Text>
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.navy.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.amber.primary + '80' }}
                    onPress={() => router.push('/(pro)/edit-profile')}
                  >
                    <Ionicons name="pencil" size={14} color={Colors.white} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <ProfileMetric label="Trust" value={trustScore != null ? `${Math.round(Number(trustScore))}` : '—'} icon="ribbon" tone="amber" />
                  <ProfileMetric label="Skill" value={`${proDetailsQuery.data?.ai_skill_score ?? 0}/10`} icon="star" tone="amber" />
                  <ProfileMetric
                    label="KYC"
                    value={kycStatus === 'verified' ? 'Verified' : kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
                    icon="shield-checkmark"
                    tone={kycStatus === 'verified' ? 'success' : 'amber'}
                  />
                </View>
              </View>
            </Card>
          </AnimatedRow>
        </View>

        <AnimatedRow delay={120}>
          <SectionHeader title="Verification" />
          <RegisterProCard
            inputs={stepInputs}
            verificationStatus={proDetailsQuery.data?.verification_status}
            proId={profile?.id}
          />
        </AnimatedRow>

        <AnimatedRow delay={180}>
          <SectionHeader title="Account" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow icon="notifications" label="Notifications" sublabel="Job alerts · Reminders" onPress={() => router.push('/(pro)/notifications')} />
            <SettingsRow icon="shield-checkmark" label="Login & Security" sublabel="Phone · Bank account" onPress={() => router.push('/(pro)/login-security')} />
          </Card>
        </AnimatedRow>

        <AnimatedRow delay={210}>
          <SectionHeader title="Preferences" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow icon="contrast" label="Appearance" sublabel="Light · Dark · System" onPress={() => router.push('/(pro)/appearance')} />
            <SettingsRow icon="language" label="Language" sublabel="English" onPress={() => router.push('/(pro)/language')} />
          </Card>
        </AnimatedRow>

        <AnimatedRow delay={240}>
          <SectionHeader title="Support" />
          <Card style={{ marginHorizontal: 20 }}>
            <SettingsRow icon="chatbubble-ellipses" label="Feedback" sublabel="Share your thoughts" onPress={() => Alert.alert('Feedback', 'Email us at pros@zapfix.in — we read every message.')} />
            <SettingsRow icon="help-circle" label="Help & Support" sublabel="FAQs · Contact us" onPress={() => Alert.alert('Help & Support', 'Pro support is available Mon–Sat, 9am–8pm IST.\n\nEmail: pros@zapfix.in')} />
            <SettingsRow icon="document-text" label="Legal" sublabel="Service agreement · Privacy" onPress={() => router.push('/(pro)/legal')} />
            <SettingsRow icon="information-circle" label="About Zapfix" sublabel="Version 1.0.0" onPress={() => Alert.alert('Zapfix', "Version 1.0.0\n\nIndia's smartest home repair platform powered by AI.\n\n© 2025 Zapfix Technologies")} />
          </Card>
        </AnimatedRow>

        <AnimatedRow delay={300}>
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Button variant="danger" onPress={handleSignOut} loading={signingOut} disabled={signingOut} leftIcon={<Ionicons name="log-out-outline" size={20} color={Colors.white} />}>
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </View>
        </AnimatedRow>
      </ScrollView>
    </SafeAreaView>
  );
}
