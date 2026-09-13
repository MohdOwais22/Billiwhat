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

    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase credentials are not configured in this environment.' },
        { status: 503 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const standardPhone = normalizedPhone ? `+${normalizedPhone}` : rawPhone.trim();

    // 1. Check Master Identity Server-Side
    if (isMasterPhone(rawPhone)) {
      // For master user, external OTP provider is completely bypassed.
      // Return a completely generic response to advance to the OTP entry screen without leaking identity.
      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your phone',
        requiresOtp: true,
      });
    }

    // 2. Normal User Flow: Call existing Supabase OTP provider
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
