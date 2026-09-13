import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/supabase/config';
import { normalizePhoneNumber, isMasterOtp, isMasterAdmin } from '@/lib/auth/masterAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = body?.phone || body?.phoneNumber;
    const token = body?.token || body?.otp;

    if (!rawPhone || typeof rawPhone !== 'string') {
      return NextResponse.json(
        { error: 'Valid phone number is required.' },
        { status: 400 }
      );
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Valid verification code (OTP) is required.' },
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

    const cookieStore = await cookies();

    // Create SSR Supabase client that directly attaches auth cookies to the response
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

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const standardPhone = normalizedPhone ? `+${normalizedPhone}` : rawPhone.trim();

    // 1. Check if the provided OTP matches the server-side MASTER_OTP
    if (isMasterOtp(token)) {
      if (serviceRoleKey) {
        const adminClient = createServerClient(supabaseUrl, serviceRoleKey, {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {},
          },
        });

        // Use a deterministic internal session secret
        const sessionSecret = `wb_otp_${normalizedPhone}_${serviceRoleKey.slice(0, 16)}`;

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
          // Create user with phone verified
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            phone: standardPhone,
            phone_confirm: true,
            password: sessionSecret,
            user_metadata: {
              phone: standardPhone,
              full_name: 'Proprietor',
            },
          });

          if (newUser?.user?.id) {
            targetUserId = newUser.user.id;
          } else if (createError) {
            console.warn('Could not create user by phone:', createError.message);
          }
        }

        // Authenticate the session through Supabase to generate valid cookies
        let signInResult = await supabase.auth.signInWithPassword({
          phone: standardPhone,
          password: sessionSecret,
        });

        if (signInResult.error && targetUserId) {
          // Fallback in case phone password login is disabled in GoTrue config: sign in with internal email
          const internalEmail = `user_${normalizedPhone}@whatsbill.internal`;
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
            { error: `Authentication failed: ${signInResult.error.message}` },
            { status: 401 }
          );
        }

        const authenticatedUser = signInResult.data.user;

        // Check organization membership
        let hasOrganization = false;
        let organizationId: string | null = null;
        if (authenticatedUser?.id) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', authenticatedUser.id)
            .limit(1)
            .maybeSingle();

          if (member?.organization_id) {
            hasOrganization = true;
            organizationId = member.organization_id;
          }
        }

        return NextResponse.json({
          success: true,
          method: 'master_otp',
          user: {
            id: authenticatedUser.id,
            phone: authenticatedUser.phone || standardPhone,
            email: authenticatedUser.email,
          },
          hasOrganization,
          organizationId,
          isAdmin: isMasterAdmin(authenticatedUser),
        });
      }
    }

    // 2. Standard Supabase OTP Verification
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      phone: standardPhone,
      token: token.trim(),
      type: 'sms',
    });

    if (verifyError) {
      // Also try whatsapp channel fallback verification if supported
      const { data: waData, error: waError } = await supabase.auth.verifyOtp({
        phone: standardPhone,
        token: token.trim(),
        type: 'whatsapp' as any,
      });

      if (waError) {
        return NextResponse.json(
          { error: verifyError.message || 'Invalid or expired verification code.' },
          { status: 401 }
        );
      }

      const user = waData.user;
      if (!user) {
        return NextResponse.json(
          { error: 'No user session returned after verification.' },
          { status: 401 }
        );
      }

      let hasOrg = false;
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (member?.organization_id) {
        hasOrg = true;
      }

      return NextResponse.json({
        success: true,
        method: 'standard_otp',
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
        },
        hasOrganization: hasOrg,
        isAdmin: isMasterAdmin(user),
      });
    }

    const user = verifyData.user;
    if (!user) {
      return NextResponse.json(
        { error: 'No user session returned after verification.' },
        { status: 401 }
      );
    }

    let hasOrg = false;
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (member?.organization_id) {
      hasOrg = true;
    }

    return NextResponse.json({
      success: true,
      method: 'standard_otp',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
      },
      hasOrganization: hasOrg,
      isAdmin: isMasterAdmin(user),
    });
  } catch (error: any) {
    console.error('Verify OTP API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify verification code.' },
      { status: 500 }
    );
  }
}
