import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { QueryKeys } from '@/constants/queryKeys';
import { getSession, signInWithOtp, signOut, verifyOtp } from '@/services/auth';
import { createProfile, getProfile } from '@/services/profile';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { TablesInsert } from '@/types/database';

export const useAuth = () => {
  const { session, profile, isLoading, setSession, setProfile, signOut: clearAuth } =
    useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const currentSession = await getSession();
        if (isMounted) setSession(currentSession);
      } catch (err) {
        // getSession() already handles the "token expired" branch and returns
        // null; anything reaching here is unexpected. Surface to the console
        // and fall through to an unauthenticated state so the app keeps
        // rendering instead of getting stuck on a splash.
        console.warn('[auth] loadSession failed', err);
        if (isMounted) setSession(null);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // TOKEN_REFRESHED + SIGNED_IN both deliver a fresh session — store it.
      // SIGNED_OUT and USER_DELETED drop the session. We trust whatever the
      // server says here; any failure to refresh raises an AuthStateChange
      // event with nextSession=null instead of throwing.
      if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
        clearAuth();
        return;
      }
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [setSession, clearAuth]);

  const profileQuery = useQuery({
    queryKey: QueryKeys.profile(session?.user.id ?? ''),
    queryFn: async () => getProfile(session?.user.id ?? ''),
    enabled: Boolean(session?.user?.id),
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (profileQuery.data) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data, setProfile]);

  const signInMutation = useMutation({
    mutationFn: (phone: string) => signInWithOtp(phone)
  });

  const verifyMutation = useMutation({
    mutationFn: ({ phone, token }: { phone: string; token: string }) =>
      verifyOtp(phone, token)
  });

  const createProfileMutation = useMutation({
    mutationFn: (payload: TablesInsert<'profiles'>) => createProfile(payload)
  });

  const signOutMutation = useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => clearAuth()
  });

  return {
    session,
    profile,
    isLoading: isLoading || profileQuery.isLoading,
    // Split states so the root can tell "still resolving whether the user is
    // signed in" (block render with a splash) apart from "signed in, profile
    // row still loading/being created" (keep the current screen mounted — e.g.
    // the OTP role-picker sheet — and never bounce to /welcome).
    isSessionLoading: isLoading,
    isProfileLoading: profileQuery.isLoading,
    signInWithOtp: signInMutation.mutateAsync,
    verifyOtp: verifyMutation.mutateAsync,
    createProfile: createProfileMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    profileError: profileQuery.error
  };
};
