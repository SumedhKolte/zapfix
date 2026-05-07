import { supabase } from '@/lib/supabase';

export const signInWithOtp = async (phone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone
  });
  if (error) {
    throw error;
  }
  return data;
};

export const verifyOtp = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  });
  if (error) {
    throw error;
  }
  return data.session;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};
