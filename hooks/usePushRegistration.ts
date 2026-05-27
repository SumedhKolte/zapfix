import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

import {
  registerForPushNotificationsAsync,
  subscribeToNotificationTaps,
} from '@/lib/notifications';
import { updateFcmToken } from '@/services/profile';

// Registers the device's Expo Push token against the signed-in profile so the
// server (or any client) can call createNotification → push it to the phone.
// Also subscribes to tap events so the user lands on the relevant job when
// they tap a notification from outside the app.
export const usePushRegistration = (userId: string | null | undefined) => {
  const router = useRouter();
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || registeredFor.current === userId) return;

    let cancelled = false;
    let unsubscribeTap: (() => void) | null = null;

    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (cancelled) return;
        if (token) {
          await updateFcmToken(userId, token);
          registeredFor.current = userId;
        }

        unsubscribeTap = await subscribeToNotificationTaps((data) => {
          const deepLink = typeof data?.deepLink === 'string' ? data.deepLink : null;
          if (deepLink) router.push(deepLink as never);
        });
      } catch (err) {
        console.warn('[push] registration failed', err);
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribeTap) unsubscribeTap();
    };
  }, [userId, router]);
};
