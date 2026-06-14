import Constants from 'expo-constants';

const appEnv = String(Constants.expoConfig?.extra?.appEnv ?? 'development').toLowerCase();
const configuredCashfreeEnv = String(process.env.EXPO_PUBLIC_CASHFREE_ENV ?? 'sandbox').toLowerCase();

const resolvedCashfreeEnv: 'sandbox' | 'production' =
  __DEV__ && appEnv !== 'production'
    ? 'sandbox'
    : configuredCashfreeEnv === 'production'
      ? 'production'
      : 'sandbox';

export const Config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '',
  cashfreeAppId: process.env.EXPO_PUBLIC_CASHFREE_APP_ID ?? '',
  // Local/dev-client runs must stay on sandbox even if .env still points at production.
  cashfreeEnv: resolvedCashfreeEnv,
};
