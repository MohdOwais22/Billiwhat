import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv, sanitizeSupabaseUrl, sanitizeSupabaseKey } from '@/lib/supabase/config';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Normalizes phone numbers consistently for comparison:
 * - Strips whitespace, hyphens, parentheses, plus signs, and other non-digit symbols.
 * - Handles leading 0 prefix (e.g. 09876543210 -> 9876543210).
 * - Standardizes 10-digit Indian numbers to 91XXXXXXXXXX format.
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  // If starts with single leading zero (e.g., 09876543210 with length 11), remove leading 0
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // If 10 digits, assume standard Indian mobile and prefix with 91 for uniform standard
  if (digits.length === 10) {
    digits = '91' + digits;
  }

  return digits;
}

/**
 * Robust phone number equality comparator:
 * Compares normalized digits, with fallback to matching the last 10 significant digits
 * for numbers with international dialing codes.
 */
export function arePhoneNumbersEqual(
  phone1: string | null | undefined,
  phone2: string | null | undefined
): boolean {
  if (!phone1 || !phone2) {
    return false;
  }

  const norm1 = normalizePhoneNumber(phone1);
  const norm2 = normalizePhoneNumber(phone2);

  // 1. Exact normalized match (handles 10-digit Indian standard +91)
  if (norm1 && norm2 && norm1 === norm2) {
    return true;
  }

  // 2. Pure digits stripped match
  const d1 = String(phone1).replace(/\D/g, '');
  const d2 = String(phone2).replace(/\D/g, '');
  if (d1 && d2 && d1 === d2) {
    return true;
  }

  // 3. Compare trailing 10 digits for international code resilience
  if (norm1.length >= 10 && norm2.length >= 10 && norm1.slice(-10) === norm2.slice(-10)) {
    return true;
  }

  if (d1.length >= 10 && d2.length >= 10 && d1.slice(-10) === d2.slice(-10)) {
    return true;
  }

  // 4. Suffix match for numbers with country code vs local numbers (at least 8 digits)
  if (d1.length >= 8 && d2.length >= 8 && (d1.endsWith(d2) || d2.endsWith(d1))) {
    return true;
  }

  return false;
}

/**
 * Extracts the user's phone number from the authenticated Supabase user object.
 * Checks the top-level user.phone first, then user_metadata and app_metadata.
 */
export function extractUserPhoneNumber(user: any): string | null {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const candidatePhone =
    user.phone ||
    user.user_metadata?.phone ||
    user.user_metadata?.phone_number ||
    user.app_metadata?.phone ||
    user.phone_number ||
    null;

  if (typeof candidatePhone === 'string' && candidatePhone.trim().length > 0) {
    return candidatePhone.trim();
  }

  return null;
}

/**
 * Reads and cleans the MASTER_PHONE_NUMBER from server environment variables.
 * Never hardcoded; strictly loaded from server process.env.
 * Checks standard variable name as well as common alias variants.
 * Never exposed to client bundles.
 */
export function getMasterPhoneNumber(): string | null {
  const envPhone =
    process.env.MASTER_PHONE_NUMBER ||
    process.env.MASTER_PHONE ||
    process.env.MASTER_ADMIN_PHONE;

  if (!envPhone || typeof envPhone !== 'string') {
    return null;
  }

  const cleaned = envPhone.trim().replace(/^["']+|["']+$/g, '').trim();
  if (!cleaned) {
    return null;
  }

  return cleaned;
}

/**
 * Reads and cleans the MASTER_OTP from server environment variables.
 * Never hardcoded; strictly loaded from server process.env.
 * Checks standard variable name as well as common alias variants.
 * Never exposed to client bundles.
 */
export function getMasterOtp(): string | null {
  const envOtp =
    process.env.MASTER_OTP ||
    process.env.MASTER_ADMIN_OTP ||
    process.env.MASTER_VERIFICATION_CODE;

  if (!envOtp || typeof envOtp !== 'string') {
    return null;
  }

  const cleaned = envOtp.trim().replace(/^["']+|["']+$/g, '').trim();
  if (!cleaned) {
    return null;
  }

  return cleaned;
}

/**
 * Checks if a provided OTP token matches the configured server-side MASTER_OTP.
 */
export function isMasterOtp(candidateOtp: string | null | undefined): boolean {
  if (!candidateOtp || typeof candidateOtp !== 'string') {
    return false;
  }

  const masterOtp = getMasterOtp();
  if (!masterOtp) {
    return false;
  }

  const cleanCandidate = candidateOtp.trim().replace(/\s+/g, '');
  const cleanMaster = masterOtp.trim().replace(/\s+/g, '');

  return cleanCandidate === cleanMaster;
}

/**
 * Checks if a provided phone string matches the configured server-side MASTER_PHONE_NUMBER.
 */
export function isMasterPhone(candidatePhone: string | null | undefined): boolean {
  if (!candidatePhone || typeof candidatePhone !== 'string') {
    return false;
  }

  const masterPhone = getMasterPhoneNumber();
  if (!masterPhone) {
    return false;
  }

  return arePhoneNumbersEqual(candidatePhone, masterPhone);
}

/**
 * Determines whether the given authenticated user is the Master Admin.
 * Runs strictly on the server side by comparing the normalized user's phone with MASTER_PHONE_NUMBER.
 */
export function isMasterAdmin(user: any): boolean {
  if (!user) {
    return false;
  }

  const masterPhone = getMasterPhoneNumber();
  if (!masterPhone) {
    return false;
  }

  const userPhone = extractUserPhoneNumber(user);
  if (!userPhone) {
    return false;
  }

  return arePhoneNumbersEqual(userPhone, masterPhone);
}

/**
 * Helper for API Route handlers to authenticate the request and verify Master Admin authorization.
 * Returns { isAuthorized, user, error, status, supabase, adminSupabase }
 */
export async function verifyMasterAdminRequest(req: NextRequest) {
  const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isAuthorized: false,
      isAuthenticated: false,
      user: null,
      error: 'Authentication service unavailable',
      status: 503,
      supabase: null,
      adminSupabase: null,
    };
  }

  // 1. Try Bearer token from header
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  let token: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll() {},
    },
  });

  let user = null;
  if (token) {
    const { data: tokenAuth } = await supabase.auth.getUser(token);
    user = tokenAuth?.user || null;
  }

  if (!user) {
    const { data: cookieAuth } = await supabase.auth.getUser();
    user = cookieAuth?.user || null;
  }

  if (!user) {
    return {
      isAuthorized: false,
      isAuthenticated: false,
      user: null,
      error: 'Authentication required. Please log in.',
      status: 401,
      supabase,
      adminSupabase: null,
    };
  }

  const isMaster = isMasterAdmin(user);

  if (!isMaster) {
    return {
      isAuthorized: false,
      isAuthenticated: true,
      user,
      error: 'Forbidden: Master Admin privileges required.',
      status: 403,
      supabase,
      adminSupabase: null,
    };
  }

  const adminSupabase = serviceRoleKey
    ? createServerClient(supabaseUrl, serviceRoleKey, {
        cookies: { getAll: () => [], setAll: () => {} },
      })
    : supabase;

  return {
    isAuthorized: true,
    isAuthenticated: true,
    user,
    error: null,
    status: 200,
    supabase,
    adminSupabase,
  };
}

/**
 * Helper for Server Component pages (e.g. app/admin/page.tsx) to verify Master Admin authorization.
 */
export async function verifyMasterAdminServerComponent() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      isAuthorized: false,
      isAuthenticated: false,
      user: null,
      reason: 'Database client not configured',
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthorized: false,
      isAuthenticated: false,
      user: null,
      reason: 'Not authenticated',
    };
  }

  const isMaster = isMasterAdmin(user);

  return {
    isAuthorized: isMaster,
    isAuthenticated: true,
    user,
    reason: isMaster ? undefined : 'User phone does not match MASTER_PHONE_NUMBER',
  };
}
