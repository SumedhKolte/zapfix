import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/types/database';

export const createProfile = async (payload: TablesInsert<'profiles'>) => {
  const { data, error } = await supabase.from('profiles').insert(payload).select('*').single();
  if (error) {
    throw error;
  }
  return data;
};

export const updateProfile = async (id: string, payload: TablesUpdate<'profiles'>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const upsertProDetails = async (payload: TablesInsert<'pro_details'>) => {
  const { data, error } = await supabase
    .from('pro_details')
    .upsert(payload)
    .select('*')
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const updateProDetails = async (proId: string, payload: TablesUpdate<'pro_details'>) => {
  const { data, error } = await supabase
    .from('pro_details')
    .update(payload)
    .eq('pro_id', proId)
    .select('*')
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const updateFcmToken = async (id: string, fcmToken: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ fcm_token: fcmToken })
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    throw error;
  }
  return data;
};
