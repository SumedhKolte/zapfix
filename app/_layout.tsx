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
import { getProDetails } from '@/services/profile';
import { Colors } from '@/constants/colors';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

SplashScreen.preventAutoHideAsync();

const RootNavigation = () => {
  const router = useRouter();
  const segments = useSegments();
  const { session, profile, isLoading } = useAuth();

  const proDetailsQuery = useQuery({
    queryKey: ['pro-details', session?.user.id ?? ''],
    queryFn: () => getProDetails(session?.user.id ?? ''),
    enabled: Boolean(session?.user.id && profile?.role === 'pro')
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inCustomerGroup = segments[0] === '(customer)';
    const inProGroup = segments[0] === '(pro)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
      SplashScreen.hideAsync();
      return;
    }

    if (!profile) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
      SplashScreen.hideAsync();
      return;
    }

    if (profile.role === 'customer') {
      if (!inCustomerGroup) {
        router.replace('/(customer)/home');
      }
      SplashScreen.hideAsync();
      return;
    }

    if (profile.role === 'pro') {
      const onboardingStep = proDetailsQuery.data?.onboarding_step;
      if (onboardingStep && onboardingStep !== 'complete') {
        router.replace(`/(pro)/onboarding/${onboardingStep}`);
      } else if (!inProGroup) {
        router.replace('/(pro)/dashboard');
      }
      SplashScreen.hideAsync();
    }
  }, [
    session,
    profile,
    isLoading,
    segments,
    router,
    proDetailsQuery.data?.onboarding_step
  ]);

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <StatusBar style="dark" />
            <OfflineBanner visible={isOffline} />
            <RootNavigation />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
