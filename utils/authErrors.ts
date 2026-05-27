import { AuthApiError, AuthError } from '@supabase/supabase-js';

// Maps the various Supabase auth failures we see in OTP/phone flows into
// short user-readable strings. Catching is the screen's job — this just
// gives a friendly explanation to drop into Alert.alert().
export const friendlyAuthError = (err: unknown): { title: string; message: string } => {
  if (err instanceof AuthApiError || err instanceof AuthError) {
    const raw = err.message.toLowerCase();

    if (raw.includes('token has expired') || raw.includes('otp has expired') || raw.includes('expired')) {
      return {
        title: 'Code expired',
        message: 'The OTP expired. Tap "Resend" to get a new one.',
      };
    }
    if (raw.includes('invalid') && (raw.includes('otp') || raw.includes('token'))) {
      return {
        title: 'Wrong code',
        message: 'That OTP didn\'t match. Double-check the digits and try again.',
      };
    }
    if (raw.includes('rate') || raw.includes('too many')) {
      return {
        title: 'Too many attempts',
        message: 'You\'ve requested codes too often. Wait a minute and try again.',
      };
    }
    if (raw.includes('phone')) {
      return {
        title: 'Phone issue',
        message: err.message,
      };
    }
    return { title: 'Sign-in failed', message: err.message };
  }

  if (err instanceof Error) {
    const msg = err.message;
    if (/network|fetch failed|offline/i.test(msg)) {
      return {
        title: 'No connection',
        message: 'Check your internet and try again.',
      };
    }
    return { title: 'Something went wrong', message: msg };
  }

  return { title: 'Something went wrong', message: 'Please try again in a moment.' };
};
