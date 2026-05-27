import { AuthApiError, AuthError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

// Returns the current session, or null if there isn't one (or it can't be
// recovered). We swallow the "Token has expired or is invalid" error path —
// that happens when the persisted refresh token is no longer accepted by the
// server (revoked, project rotated keys, or user signed out elsewhere). In
// that case we clear the local session so the next render shows the login
// screen instead of crashing into an Uncaught promise.
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (err) {
    if (isInvalidTokenError(err)) {
      await supabase.auth.signOut().catch(() => undefined);
      return null;
    }
    throw err;
  }
};

const isInvalidTokenError = (err: unknown) => {
  if (err instanceof AuthApiError) {
    const status = (err as AuthApiError & { status?: number }).status ?? 0;
    if (status === 401) return true;
  }
  if (err instanceof AuthError) {
    const message = err.message.toLowerCase();
    return (
      message.includes('token has expired') ||
      message.includes('invalid refresh token') ||
      message.includes('refresh token not found') ||
      message.includes('invalid jwt')
    );
  }
  return false;
};
