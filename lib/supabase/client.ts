import { createBrowserClient } from '@supabase/ssr';
import { sanitizeSupabaseUrl, sanitizeSupabaseKey } from './config';

export function createClient() {
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseClient() {
  return createClient();
}

export const isSupabaseConfigured = Boolean(
  sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

