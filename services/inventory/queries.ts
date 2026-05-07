import { supabase } from '@/lib/supabase';

export const getInventory = async (proId: string) => {
  const { data, error } = await supabase
    .from('pro_inventory')
    .select('*, catalog_parts(*)')
    .eq('pro_id', proId);

  if (error) {
    throw error;
  }

  return data;
};
