import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read public Supabase configuration from environment (supports both non-prefixed and legacy prefixed)
const env = (import.meta as any).env || {};
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  typeof supabaseUrl === 'string' && 
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('supabase.co')
);

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

export type ConnectionStatus = 'connected' | 'not_configured' | 'connecting' | 'error';
