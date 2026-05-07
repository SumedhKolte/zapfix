import { supabase } from '@/lib/supabase';
import type { TablesInsert } from '@/types/database';

export const createProSkills = async (skills: TablesInsert<'pro_skills'>[]) => {
  const { data, error } = await supabase.from('pro_skills').upsert(skills).select('*');
  if (error) {
    throw error;
  }
  return data;
};
