import { create } from 'zustand';

import type { Tables } from '@/types/database';

type JobState = {
  activeJob: Tables<'jobs'> | null;
  setActiveJob: (job: Tables<'jobs'> | null) => void;
  clearActiveJob: () => void;
};

export const useJobStore = create<JobState>((set) => ({
  activeJob: null,
  setActiveJob: (job) => set({ activeJob: job }),
  clearActiveJob: () => set({ activeJob: null })
}));
