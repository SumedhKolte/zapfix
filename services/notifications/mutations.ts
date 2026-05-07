import { supabase } from '@/lib/supabase';

export const markNotificationRead = async (notificationId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const markAllNotificationsRead = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .select('*');

  if (error) {
    throw error;
  }

  return data;
};
