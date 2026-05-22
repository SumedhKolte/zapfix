import { supabase } from '@/lib/supabase';

export const getAvailability = async (proId: string) => {
  const { data, error } = await supabase
    .from('pro_availability')
    .select('*')
    .eq('pro_id', proId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};
