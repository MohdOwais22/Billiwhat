/**
 * Supabase Configuration and URL Sanitizer
 *
 * Protects against common environment variable mistakes:
 * 1. Accidental copying of the REST URL (e.g. `https://xxx.supabase.co/rest/v1` instead of `https://xxx.supabase.co`)
 * 2. Trailing slashes (e.g. `https://xxx.supabase.co/`)
 * 3. Accidental quotes (`"https://xxx.supabase.co"`)
 */

export function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip surrounding quotes
  url = url.replace(/^["']|["']$/g, '');
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Strip accidental PostgREST or Auth path suffixes
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/auth\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

export function sanitizeSupabaseKey(rawKey?: string): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^["']|["']$/g, '');
}

export function getSupabaseEnv() {
  const url = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRoleKey = sanitizeSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured: Boolean(url && anonKey),
  };
}
