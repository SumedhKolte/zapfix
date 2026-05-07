import { supabase } from '@/lib/supabase';
import type { TablesInsert } from '@/types/database';

export const upsertInventory = async (items: TablesInsert<'pro_inventory'>[]) => {
  const { data, error } = await supabase.from('pro_inventory').upsert(items).select('*');
  if (error) {
    throw error;
  }
  return data;
};

export const updateInventoryItem = async (
  proId: string,
  partId: string,
  quantity: number
) => {
  const { data, error } = await supabase
    .from('pro_inventory')
    .upsert({ pro_id: proId, part_id: partId, quantity })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};
