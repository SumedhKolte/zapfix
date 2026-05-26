import { supabase } from '@/lib/supabase';
import type { TablesInsert } from '@/types/database';

export const createProSkills = async (skills: TablesInsert<'pro_skills'>[]) => {
  const proId = skills[0]?.pro_id;
  if (!proId) return [];

  const { error: deleteError } = await supabase
    .from('pro_skills')
    .delete()
    .eq('pro_id', proId);
  if (deleteError) {
    throw deleteError;
  }

  const { data, error } = await supabase.from('pro_skills').insert(skills).select('*');
  if (error) {
    throw error;
  }
  return data;
};
