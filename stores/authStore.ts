import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

import type { Tables } from '@/types/database';

type AuthState = {
  session: Session | null;
  profile: Tables<'profiles'> | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Tables<'profiles'> | null) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) =>
    set((state) => ({
      session,
      profile: session ? state.profile : null,
      isLoading: false
    })),
  setProfile: (profile) => set({ profile }),
  signOut: () => set({ session: null, profile: null })
}));
