import { supabase } from '@/lib/supabase';
import type { TablesInsert } from '@/types/database';

export const updateAvailability = async (payload: TablesInsert<'pro_availability'>) => {
  const { data, error } = await supabase
    .from('pro_availability')
    .upsert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};
