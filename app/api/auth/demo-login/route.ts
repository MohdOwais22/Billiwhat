import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Temporary Internal Demo Authentication Handler
 *
 * Requirements:
 * 1. Do NOT expose demo credentials to the client.
 * 2. Authenticate through the standard Supabase Auth mechanism (cookie-based session).
 * 3. Ensure the demo user belongs to a valid demo organization with an organization_members record.
 * 4. Never bypass middleware or RLS.
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error:
            'Supabase credentials are not configured in this environment. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        },
        { status: 503 }
      );
    }

    const demoEmail = process.env.DEMO_LOGIN_EMAIL || 'demo@whatsbill.internal';
    const demoPassword = process.env.DEMO_LOGIN_PASSWORD || 'WhatsBillDemo2026!';

    const cookieStore = await cookies();

    // Create SSR Supabase client that manages auth cookies on the response
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

    // 1. Attempt standard password authentication for demo user
    let signInResult = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    // If account does not exist and service role key is available, bootstrap the demo user and organization
    if (signInResult.error && serviceRoleKey) {
      const adminClient = createServerClient(supabaseUrl, serviceRoleKey, {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      });

      // Try creating user if missing
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Demo Proprietor',
          is_demo: true,
        },
      });

      // If user creation succeeded or if user already existed (e.g. password was reset)
      const targetUserId = newUser?.user?.id;

      if (targetUserId) {
        // Ensure Demo Organization exists
        let { data: org } = await adminClient
          .from('organizations')
          .select('id')
          .eq('name', 'Demo Wholesale Traders')
          .maybeSingle();

        if (!org) {
          const { data: newOrg } = await adminClient
            .from('organizations')
            .insert({
              name: 'Demo Wholesale Traders',
              legal_name: 'Demo Wholesale Traders LLP',
              phone: '+919876543210',
              email: demoEmail,
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001',
            })
            .select('id')
            .single();
          org = newOrg;
        }

        if (org?.id) {
          // Ensure membership exists
          const { data: existingMember } = await adminClient
            .from('organization_members')
            .select('id')
            .eq('organization_id', org.id)
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (!existingMember) {
            await adminClient.from('organization_members').insert({
              organization_id: org.id,
              user_id: targetUserId,
              role: 'owner',
            });
          }
        }
      }

      // Retry sign-in with the configured password
      signInResult = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
    }

    if (signInResult.error) {
      console.warn('Demo login failed:', signInResult.error.message);
      return NextResponse.json(
        {
          error:
            'Demo account is not yet provisioned in this Supabase database. Please check DEMO_LOGIN_EMAIL / DEMO_LOGIN_PASSWORD or provision the demo user in Supabase.',
          details: signInResult.error.message,
        },
        { status: 401 }
      );
    }

    const user = signInResult.data.user;

    // Check if user has an organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      hasOrganization: Boolean(member?.organization_id),
      targetUrl: member?.organization_id ? '/dashboard' : '/onboarding?next=/dashboard',
    });
  } catch (err: any) {
    console.error('Demo authentication error:', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected demo authentication failure.' },
      { status: 500 }
    );
  }
}
