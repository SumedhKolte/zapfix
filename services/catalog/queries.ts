import { supabase } from '@/lib/supabase';

export const getCatalogSkills = async () => {
  const { data, error } = await supabase
    .from('catalog_skills')
    .select('*')
    .eq('is_active', true)
    .order('trade', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

export const getCatalogParts = async () => {
  const { data, error } = await supabase
    .from('catalog_parts')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};
