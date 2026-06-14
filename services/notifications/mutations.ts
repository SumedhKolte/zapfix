import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

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
  // Insert via a SECURITY DEFINER RPC instead of a direct table INSERT. A user
  // notifying ANOTHER user (customer <-> pro) can't satisfy the notifications
  // RLS WITH CHECK from the client and fails with 42501; the RPC does the
  // participant authorization itself and inserts with definer privileges.
  // It also returns the recipient's push token so we can fan out a push
  // without needing read access to the other user's profile row.
  // Cast: the RPC is newer than the committed generated DB types. Regenerate
  // types/database.ts (supabase gen types) to drop this cast.
  const { data, error } = await (supabase.rpc as any)('send_job_notification', {
    p_user_id: userId,
    p_title: title,
    p_body: body,
    p_type: type,
    p_job_id: jobId ?? null,
    p_deep_link: deepLink ?? null,
  });

  if (error) {
    // Don't throw — notifications shouldn't break user flow.
    console.warn('createNotification failed', error);
    return null;
  }

  const result = (data ?? {}) as {
    notification?: Tables<'notifications'>;
    push_token?: string | null;
  };

  // Fan out to the recipient's device. The RPC returns the token so we don't
  // depend on the caller having row-level read access to the recipient.
  if (result.push_token) {
    await sendExpoPush(result.push_token, {
      title,
      body,
      data: { deepLink: deepLink ?? null, jobId: jobId ?? null, type },
    });
  }

  return result.notification ?? null;
};
