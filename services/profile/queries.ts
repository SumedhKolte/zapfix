import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';
import type { ProOnboardingStep } from './mutations';

export type ProDetails = Tables<'pro_details'> & {
  onboarding_step?: ProOnboardingStep | null;
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data as Tables<'profiles'>;
};

export const getProDetails = async (proId: string) => {
  const { data, error } = await supabase
    .from('pro_details')
    .select('*')
    .eq('pro_id', proId)
    .single();

  if (error) {
    throw error;
  }

  return data as ProDetails;
};

export const getCustomerAddresses = async (customerId: string) => {
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

export const getAppliances = async (customerId: string) => {
  const { data, error } = await supabase
    .from('appliances')
    .select('*')
    .eq('customer_id', customerId)
    .order('next_service_due', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};
