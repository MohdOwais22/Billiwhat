import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/supabase/config';
import {
  normalizePhoneNumber,
  isMasterPhone,
} from '@/lib/auth/masterAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = body?.phone || body?.phoneNumber;

    if (!rawPhone || typeof rawPhone !== 'string') {
      return NextResponse.json(
        { error: 'Valid phone number is required.' },
        { status: 400 }
      );
    }

    // =========================================================================
    // STEP 1: NORMALIZE PHONE NUMBER
    // =========================================================================
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const standardPhone = normalizedPhone ? `+${normalizedPhone}` : rawPhone.trim();

    // =========================================================================
    // STEP 2: SERVER-SIDE MASTER PHONE CHECK (EXECUTED FIRST)
    // =========================================================================
    // Check whether the entered phone number is the configured master phone
    // BEFORE performing any normal OTP-provider validation or provider availability check.
    const isMaster =
      isMasterPhone(rawPhone) ||
      isMasterPhone(normalizedPhone) ||
      isMasterPhone(standardPhone);

    if (isMaster) {
      // MASTER BRANCH:
      // - Do NOT perform provider validation.
      // - Do NOT check whether the phone's provider is supported.
      // - Do NOT call WhatsApp/SMS OTP provider.
      // - Do NOT attempt to send an OTP through the external provider.
      // - Do NOT return "Unsupported phone provider".
      // - Return success to show the existing OTP verification UI.
      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your phone',
        requiresOtp: true,
      });
    }

    // =========================================================================
    // STEP 3: NORMAL USER BRANCH (EXECUTED ONLY IF NOT MASTER)
    // =========================================================================
    // Perform existing provider validation and external OTP provider dispatch
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Authentication service is unavailable. Please check configuration.' },
        { status: 503 }
      );
    }
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    const { error: waError } = await supabase.auth.signInWithOtp({
      phone: standardPhone,
      options: {
        channel: 'whatsapp',
      },
    });

    if (waError) {
      // Fallback to standard SMS channel
      const { error: smsError } = await supabase.auth.signInWithOtp({
        phone: standardPhone,
      });

      if (smsError) {
        const isProviderError =
          smsError.message?.toLowerCase().includes('unsupported phone provider') ||
          smsError.message?.toLowerCase().includes('provider') ||
          smsError.status === 400;

        if (isProviderError) {
          return NextResponse.json(
            {
              error:
                'WhatsApp/SMS OTP provider is not configured in your Supabase project. For testing, you can use "Use Demo Account" or configure your phone provider in Supabase Auth.',
              isProviderError: true,
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: smsError.message || 'Failed to send OTP verification code.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your phone',
      requiresOtp: true,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process phone verification request.' },
      { status: 500 }
    );
  }
}
