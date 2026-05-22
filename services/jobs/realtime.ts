import { supabase } from '@/lib/supabase';

export const subscribeToJob = (jobId: string, onChange: (payload: unknown) => void) => {
  const channel = supabase
    .channel(`job-${jobId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
      (payload) => onChange(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToProLocation = (
  proId: string,
  onChange: (payload: unknown) => void
) => {
  const channel = supabase
    .channel(`pro-location-${proId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pro_availability', filter: `pro_id=eq.${proId}` },
      (payload) => onChange(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToNewJobRequest = (
  proId: string,
  onChange: (payload: unknown) => void
) => {
  const channel = supabase
    .channel(`job-request-${proId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'matching_log', filter: `pro_id=eq.${proId}` },
      (payload) => onChange(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Listens for any new or updated job that's currently looking for a pro.
export const subscribeToOpenJobRequests = (onChange: (payload: unknown) => void) => {
  const channel = supabase
    .channel('open-job-requests')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'jobs', filter: 'status=eq.searching' },
      (payload) => onChange(payload)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'jobs', filter: 'status=eq.searching' },
      (payload) => onChange(payload)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
