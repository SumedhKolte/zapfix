import { supabase } from '@/lib/supabase';
import type { Json, TablesInsert, TablesUpdate } from '@/types/database';

export type ProOnboardingStep = 'identity' | 'skills' | 'interview' | 'toolkit' | 'inventory' | 'complete';

export type ProDetailsUpdate = TablesUpdate<'pro_details'> & {
  onboarding_step?: ProOnboardingStep | null;
  current_location?: unknown;
  interview_transcript?: Json | null;
};

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

  if (payload.pro_id) {
    const { error: availError } = await supabase
      .from('pro_availability')
      .upsert({ pro_id: payload.pro_id }, { onConflict: 'pro_id' });
    if (availError) {
      console.warn('Failed to initialize pro_availability, continuing anyway', availError);
    }
  }

  return data;
};

export const updateProDetails = async (proId: string, payload: ProDetailsUpdate) => {
  // Handle geometry data specially for PostGIS
  const { onboarding_step, ...restPayload } = payload as ProDetailsUpdate & { onboarding_step?: unknown };
  const processedPayload: Record<string, unknown> = { ...restPayload };
  
  if (payload.current_location && typeof payload.current_location === 'object') {
    // Convert GeoJSON Point to PostGIS format using ST_GeomFromGeoJSON
    const { error } = await supabase.rpc('update_pro_location', {
      p_pro_id: proId,
      p_location_geojson: payload.current_location as Json,
    });
    
    if (error) {
      throw error;
    }
    
    // Remove current_location from processedPayload since we handled it via RPC
    delete processedPayload.current_location;
  }

  // If there are other fields to update besides location
  if (Object.keys(processedPayload).length > 0) {
    const { data, error } = await supabase
      .from('pro_details')
      .update(processedPayload as TablesUpdate<'pro_details'>)
      .eq('pro_id', proId)
      .select('*')
      .single();
    if (error) {
      throw error;
    }
    return data;
  }
  
  // If only location was updated, fetch the updated record
  const { data, error } = await supabase
    .from('pro_details')
    .select('*')
    .eq('pro_id', proId)
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
