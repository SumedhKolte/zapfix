import { supabase } from '@/lib/supabase';

export const triggerMatching = async (jobId: string) => {
  const { data, error } = await supabase.functions.invoke('match-pro', {
    body: { job_id: jobId }
  });

  if (error) {
    throw error;
  }

  return data;
};
