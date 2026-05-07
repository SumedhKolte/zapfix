import { supabase } from '@/lib/supabase';

export const getEarnings = async (proId: string) => {
  const { data, error } = await supabase
    .from('earnings')
    .select('*')
    .eq('pro_id', proId)
    .order('paid_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};
