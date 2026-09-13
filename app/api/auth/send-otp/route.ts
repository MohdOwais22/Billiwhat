import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/supabase/config';
import {
  normalizePhoneNumber,
  isMasterPhone,
  getMasterOtp,
  isMasterAdmin,
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

    const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey } = getSupabaseEnv();

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase credentials are not configured in this environment.' },
        { status: 503 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const standardPhone = normalizedPhone ? `+${normalizedPhone}` : rawPhone.trim();

    // 1. Check if the provided phone matches the configured MASTER_PHONE_NUMBER
    if (isMasterPhone(rawPhone)) {
      const configuredMasterOtp = getMasterOtp();

      // If NO Master OTP is set in the environment, log in the Master user directly without requiring OTP!
      if (!configuredMasterOtp) {
        if (!serviceRoleKey) {
          return NextResponse.json(
            { error: 'Server authentication configuration is missing service role key.' },
            { status: 500 }
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

        const adminClient = createServerClient(supabaseUrl, serviceRoleKey, {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {},
          },
        });

        const sessionSecret = `wb_master_${normalizedPhone}_${serviceRoleKey.slice(0, 16)}`;

        // Check if user already exists
        const { data: userList } = await adminClient.auth.admin.listUsers({ perPage: 100 });
        const users = userList?.users || [];
        const existingUser = users.find(
          (u: any) =>
            u.phone === standardPhone ||
            normalizePhoneNumber(u.phone) === normalizedPhone ||
            normalizePhoneNumber(u.user_metadata?.phone) === normalizedPhone
        );

        let targetUserId: string | null = null;

        if (existingUser) {
          targetUserId = existingUser.id;
          await adminClient.auth.admin.updateUserById(existingUser.id, {
            phone_confirm: true,
            password: sessionSecret,
          });
        } else {
          // Create master user with phone verified
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            phone: standardPhone,
            phone_confirm: true,
            password: sessionSecret,
            user_metadata: {
              phone: standardPhone,
              full_name: 'Master Admin',
            },
          });

          if (newUser?.user?.id) {
            targetUserId = newUser.user.id;
          } else if (createError) {
            console.warn('Could not create master user:', createError.message);
          }
        }

        // Authenticate the session through Supabase to generate valid auth cookies
        let signInResult = await supabase.auth.signInWithPassword({
          phone: standardPhone,
          password: sessionSecret,
        });

        if (signInResult.error && targetUserId) {
          const internalEmail = `master_${normalizedPhone}@whatsbill.internal`;
          await adminClient.auth.admin.updateUserById(targetUserId, {
            email: internalEmail,
            email_confirm: true,
            password: sessionSecret,
          });
          signInResult = await supabase.auth.signInWithPassword({
            email: internalEmail,
            password: sessionSecret,
          });
        }

        if (signInResult.error) {
          return NextResponse.json(
            { error: `Master login failed: ${signInResult.error.message}` },
            { status: 401 }
          );
        }

        const authenticatedUser = signInResult.data.user;

        return NextResponse.json({
          success: true,
          isMaster: true,
          autoLogin: true,
          isAdmin: true,
          message: 'Master Admin authorized. Redirecting...',
          user: {
            id: authenticatedUser.id,
            phone: authenticatedUser.phone || standardPhone,
            email: authenticatedUser.email,
          },
        });
      }

      // If MASTER_OTP is configured, bypass external SMS provider call and prompt for the Master OTP directly
      return NextResponse.json({
        success: true,
        isMaster: true,
        autoLogin: false,
        requiresOtp: true,
        message: 'Master phone verified. Please enter your Master Verification Code.',
      });
    }

    // 2. Standard User Phone: attempt sending OTP via Supabase
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
        // If the SMS/WhatsApp provider is not enabled in Supabase, return a clear message
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
      isMaster: false,
      autoLogin: false,
      requiresOtp: true,
      message: `Verification code sent to ${standardPhone}`,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process phone verification request.' },
      { status: 500 }
    );
  }
}
