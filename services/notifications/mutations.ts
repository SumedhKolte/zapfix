import { supabase } from '@/lib/supabase';
import type { Enums, TablesInsert } from '@/types/database';

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

type CreateNotificationArgs = {
  userId: string;
  type?: Enums<'notification_type'>;
  title: string;
  body: string;
  jobId?: string | null;
  deepLink?: string | null;
};

export const createNotification = async ({
  userId,
  type = 'job_update',
  title,
  body,
  jobId,
  deepLink,
}: CreateNotificationArgs) => {
  const payload: TablesInsert<'notifications'> = {
    user_id: userId,
    type,
    title,
    body,
    job_id: jobId ?? null,
    deep_link: deepLink ?? null,
    is_read: false,
  };
  const { data, error } = await supabase
    .from('notifications')
    .insert(payload)
    .select('*')
    .single();
  if (error) {
    // Don't throw — notifications shouldn't break user flow.
    console.warn('createNotification failed', error);
    return null;
  }
  return data;
};
