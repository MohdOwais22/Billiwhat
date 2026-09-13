import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/supabase/config';
import {
  normalizePhoneNumber,
  isMasterPhone,
  isMasterOtp,
  isMasterAdmin,
} from '@/lib/auth/masterAdmin';

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
        { error: 'Authentication service is unavailable.' },
        { status: 503 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const standardPhone = normalizedPhone ? `+${normalizedPhone}` : rawPhone.trim();

    // 1. Step 1: Check Master Identity Server-Side
    if (isMasterPhone(rawPhone)) {
      // Verify the entered OTP against the securely configured master OTP
      if (!isMasterOtp(token)) {
        // If the OTP is incorrect, return strictly "Invalid credentials"
        // Do not reveal whether phone number or OTP was incorrect (prevents enumeration)
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      if (!serviceRoleKey) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
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

      // Check if master user exists in Supabase
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
        const { data: newUser } = await adminClient.auth.admin.createUser({
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
        }
      }

      // Authenticate session through Supabase to set secure session cookies
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
          { error: 'Invalid credentials' },
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
        user: {
          id: authenticatedUser.id,
          phone: authenticatedUser.phone || standardPhone,
          email: authenticatedUser.email,
        },
        hasOrganization,
        organizationId,
        isAdmin: true,
      });
    }

    // 2. Normal User Flow: Verify OTP using standard Supabase provider
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

    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      phone: standardPhone,
      token: token.trim(),
      type: 'sms',
    });

    if (verifyError) {
      // Fallback to whatsapp type verification
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
      let orgId: string | null = null;
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (member?.organization_id) {
        hasOrg = true;
        orgId = member.organization_id;
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
        },
        hasOrganization: hasOrg,
        organizationId: orgId,
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
    let orgId: string | null = null;
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (member?.organization_id) {
      hasOrg = true;
      orgId = member.organization_id;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
      },
      hasOrganization: hasOrg,
      organizationId: orgId,
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
