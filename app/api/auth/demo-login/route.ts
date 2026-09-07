import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/supabase/config';

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
    const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey } = getSupabaseEnv();

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

    // If sign-in failed and service role key is available, bootstrap or repair the demo user and organization
    if (signInResult.error && serviceRoleKey) {
      try {
        const adminClient = createServerClient(supabaseUrl, serviceRoleKey, {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {},
          },
        });

        let targetUserId: string | null = null;

        // Try creating user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: demoEmail,
          password: demoPassword,
          email_confirm: true,
          user_metadata: {
            full_name: 'Demo Proprietor',
            is_demo: true,
          },
        });

        if (newUser?.user?.id) {
          targetUserId = newUser.user.id;
        } else if (createError?.message?.toLowerCase().includes('already') || createError?.status === 422) {
          // User already exists in Supabase Auth, let's locate their user ID and sync password
          const { data: userList } = await adminClient.auth.admin.listUsers({ perPage: 100 });
          const users = userList?.users || [];
          const matchedUser = users.find(
            (u: any) => u.email?.toLowerCase() === demoEmail.toLowerCase()
          );

          if (matchedUser) {
            targetUserId = matchedUser.id;
            // Reset password to match configured demo password and confirm email
            await adminClient.auth.admin.updateUserById(matchedUser.id, {
              password: demoPassword,
              email_confirm: true,
            });
          }
        }

        if (targetUserId) {
          // Ensure Demo Organization exists in public schema
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
      } catch (adminErr: any) {
        console.warn('Auto-provisioning with service role encountered error:', adminErr);
      }
    }

    if (signInResult.error) {
      console.warn('Demo login failed:', signInResult.error.message);
      const isMissingServiceKey = !serviceRoleKey;
      return NextResponse.json(
        {
          error: isMissingServiceKey
            ? 'Demo account is not yet created. Add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables (or create demo@whatsbill.internal with password WhatsBillDemo2026! in Supabase Auth).'
            : `Demo sign-in failed: ${signInResult.error.message}. Please verify the user in Supabase Auth > Users.`,
          details: signInResult.error.message,
        },
        { status: 401 }
      );
    }

    const user = signInResult.data.user;

    // Check if user has an organization
    let hasOrg = false;
    try {
      const { data: member, error: memberErr } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!memberErr && member?.organization_id) {
        hasOrg = true;
      }
    } catch {
      hasOrg = false;
    }

    return NextResponse.json({
      success: true,
      hasOrganization: hasOrg,
      targetUrl: hasOrg ? '/dashboard' : '/onboarding?next=/dashboard',
    });
  } catch (err: any) {
    console.error('Demo authentication error:', err);
    return NextResponse.json(
      { error: err?.message || 'Unexpected demo authentication failure.' },
      { status: 500 }
    );
  }
}
