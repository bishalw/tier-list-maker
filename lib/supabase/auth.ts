import type { Session } from '@supabase/supabase-js';
import { assertSupabaseConfigured, getBrowserSupabaseClient } from './client';

export async function ensureAnonymousSession(): Promise<Session | null> {
  assertSupabaseConfigured();

  const supabase = getBrowserSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (session) {
    return session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  return data.session;
}

export function subscribeToAuthState(callback: (session: Session | null) => void) {
  const supabase = getBrowserSupabaseClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => {
    subscription.unsubscribe();
  };
}
