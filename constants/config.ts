export const Config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '',
  cashfreeAppId: process.env.EXPO_PUBLIC_CASHFREE_APP_ID ?? '',
  // 'sandbox' for test, 'production' for live
  cashfreeEnv: (process.env.EXPO_PUBLIC_CASHFREE_ENV ?? 'sandbox') as 'sandbox' | 'production',
};
