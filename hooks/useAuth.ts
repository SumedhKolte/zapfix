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
      const currentSession = await getSession();
      if (isMounted) {
        setSession(currentSession);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [setSession]);

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
    signInWithOtp: signInMutation.mutateAsync,
    verifyOtp: verifyMutation.mutateAsync,
    createProfile: createProfileMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    profileError: profileQuery.error
  };
};
