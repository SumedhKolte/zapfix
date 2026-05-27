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

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

// Fire a phone-level push via Expo's push service. Best-effort: if the user
// has no token, isn't a real device build, or the network drops, we silently
// skip — the in-app notification row is already persisted by the caller.
const sendExpoPush = async (
  expoPushToken: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
) => {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) return;
  try {
    await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        // No `sound` field — the device-side handler treats any string as a
        // custom filename. Android plays the channel's default sound via
        // importance: MAX; on iOS we'll wire a proper sound file via the
        // expo-notifications config plugin when we register one.
        priority: 'high',
        channelId: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });
  } catch (err) {
    console.warn('Expo push send failed (non-fatal)', err);
  }
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

  // Fan out to the recipient's device. We look up the token here rather than
  // expecting the caller to pass it in, so every create_notification call gets
  // push delivery without extra wiring.
  const { data: recipient } = await supabase
    .from('profiles')
    .select('fcm_token')
    .eq('id', userId)
    .maybeSingle();

  if (recipient?.fcm_token) {
    await sendExpoPush(recipient.fcm_token, {
      title,
      body,
      data: { deepLink: deepLink ?? null, jobId: jobId ?? null, type },
    });
  }

  return data;
};
