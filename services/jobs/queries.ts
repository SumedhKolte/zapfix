import { supabase } from '@/lib/supabase';

export const getJobById = async (jobId: string) => {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  if (error) {
    throw error;
  }
  return data;
};

export const getJobsForCustomer = async (customerId: string) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

export const getJobsForPro = async (proId: string) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('pro_id', proId)
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};
