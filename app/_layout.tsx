import 'react-native-gesture-handler';
import '../global.css';

import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useNetInfo } from '@react-native-community/netinfo';

import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { getProDetails } from '@/services/profile';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { AppSplash } from '@/components/ui/AppSplash';
import { isFullNameMissing } from '@/utils/profile';

SplashScreen.preventAutoHideAsync();

const RootNavigation = () => {
  const router = useRouter();
  const segments = useSegments();
  const { session, profile, isSessionLoading, isProfileLoading } = useAuth();
  const needsName = isFullNameMissing(profile?.full_name);
  const inAuthGroup = segments[0] === '(auth)';

  // Once the user is signed in, register their device for OS-level push
  // notifications so createNotification fan-outs reach the phone, not just the
  // in-app inbox.
  usePushRegistration(profile?.id);

  const proDetailsQuery = useQuery({
    queryKey: ['pro-details', session?.user.id ?? ''],
    queryFn: () => getProDetails(session?.user.id ?? ''),
    enabled: Boolean(session?.user.id && profile?.role === 'pro' && !needsName)
  });

  useEffect(() => {
    // Still resolving whether there's a persisted session — wait it out.
    if (isSessionLoading) {
      return;
    }

    const inCustomerGroup = segments[0] === '(customer)';
    const inProGroup = segments[0] === '(pro)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    if (!profile) {
      // Signed in, but the profile row hasn't loaded yet (returning user on a
      // cold start) or doesn't exist yet (brand-new user mid-onboarding). In
      // both cases the profile query is still in flight — don't redirect, or
      // we bounce the user to /welcome before we know who they are. The OTP
      // screen keeps its role-picker sheet mounted while we wait.
      if (isProfileLoading) {
        return;
      }
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    if (needsName) {
      const inNameScreen = inAuthGroup && (segments as string[])[1] === 'name';
      if (!inNameScreen) {
        router.replace('/(auth)/name');
      }
      return;
    }

    if (profile.role === 'customer') {
      if (!inCustomerGroup) {
        router.replace('/(customer)/home');
      }
      return;
    }

    if (profile.role === 'pro') {
      const onboardingStep = proDetailsQuery.data?.onboarding_step;
      const inOnboarding = inProGroup && (segments as string[])[1] === 'onboarding';
      // Profile is allowed for in-progress pros: it hosts the "Complete
      // Registration" card and the per-step review, so leaving onboarding for
      // Profile must not bounce them straight back to their saved step.
      const onProfile = inProGroup && (segments as string[])[1] === 'profile';
      if (onboardingStep && onboardingStep !== 'complete') {
        // Gate the pro into the registration flow at their saved step — but only
        // when they aren't already inside onboarding or on Profile. Once they're
        // in the flow, leave navigation alone so they can move forward and back
        // between steps without being yanked to the saved step on every
        // transition. We also don't kick a *completed* pro out of onboarding, so
        // they can revisit and edit individual steps from the details view.
        if (!inOnboarding && !onProfile) {
          router.replace(`/(pro)/onboarding/${onboardingStep}`);
        }
      } else if (!inProGroup) {
        router.replace('/(pro)/dashboard');
      }
    }
  }, [
    session,
    profile,
    isSessionLoading,
    isProfileLoading,
    inAuthGroup,
    segments,
    router,
    proDetailsQuery.data?.onboarding_step,
    needsName
  ]);

  // Block render with a splash only while resolving the session, or while a
  // signed-in user's profile is still loading on a protected (non-auth) route.
  // On auth routes we must keep the <Stack> mounted so flows that rely on local
  // screen state (e.g. the OTP role-picker bottom sheet) aren't torn down.
  if (isSessionLoading || (Boolean(session) && !profile && isProfileLoading && !inAuthGroup)) {
    return <AppSplash />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

function ThemedRoot() {
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;
  const { colors, scheme } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <OfflineBanner visible={isOffline} />
            <RootNavigation />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <ThemedRoot />
    </ThemeProvider>
  );
}
