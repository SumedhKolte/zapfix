import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

let handlerConfigured = false;

const configureForegroundHandler = async () => {
  if (handlerConfigured) return;
  const Notifications = await import('expo-notifications');
  // Show banners + play sound even when the app is open. Without this, push
  // arrives silently while the app is in the foreground.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  handlerConfigured = true;
};

export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'web' || isExpoGo) {
    return null;
  }

  const Notifications = await import('expo-notifications');
  await configureForegroundHandler();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    // No `sound` key — the new expo-notifications treats every sound string
    // as a custom filename and warns when it can't find one. The channel
    // already plays the system default sound because importance is MAX.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Job updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F5B800',
    });
  }

  // projectId is required by Expo SDK 49+. Read from expo-config so it works
  // in dev (Expo Go), preview, and production builds without code changes.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenResponse.data;
  } catch (err) {
    // FCM not configured (no google-services.json) is the common dev-build
    // failure mode on Android. We log once at info level and fall back to
    // in-app-only notifications — the app keeps working.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Firebase') || message.includes('FirebaseApp')) {
      console.info(
        '[push] FCM not configured. In-app notifications only. ' +
        'See https://docs.expo.dev/push-notifications/fcm-credentials/'
      );
      return null;
    }
    throw err;
  }
};

// Subscribe to taps on incoming notifications so we can deep-link the user
// straight to the relevant job. Returns an unsubscribe fn.
export const subscribeToNotificationTaps = async (
  handler: (data: Record<string, unknown>) => void
): Promise<(() => void) | null> => {
  if (Platform.OS === 'web' || isExpoGo) return null;
  const Notifications = await import('expo-notifications');
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data ?? {};
    handler(data as Record<string, unknown>);
  });
  return () => sub.remove();
};
