import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from '@/lib/supabase/config';
import { SettingsData, TeamMemberDetails, SubscriptionInfo } from '@/types/database';
import {
  getOrganizationEntitlements,
  assertCanUseTheme,
  assertCanAddTeamMember,
  updateOrganizationPlan,
  cancelOrganizationSubscription,
} from '@/lib/auth/entitlements';

// Helper to authenticate user from Bearer header or cookies
async function getAuthenticatedUser(req: NextRequest) {
  const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, supabase: null, adminSupabase: null };
  }

  // 1. Try Bearer header
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

  const adminSupabase = serviceRoleKey
    ? createServerClient(supabaseUrl, serviceRoleKey, {
        cookies: { getAll: () => [], setAll: () => {} },
      })
    : supabase;

  return { user, supabase, adminSupabase };
}

export async function GET(req: NextRequest) {
  try {
    const { user, supabase, adminSupabase } = await getAuthenticatedUser(req);

    if (!user || !supabase || !adminSupabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 1. Fetch user's organization membership
    const { data: membership, error: memErr } = await adminSupabase
      .from('organization_members')
      .select('organization_id, role, created_at')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (memErr) {
      console.error('Error fetching membership:', memErr);
      return NextResponse.json({ error: 'Failed to query membership' }, { status: 500 });
    }

    if (!membership?.organization_id) {
      return NextResponse.json(
        { error: 'No active organization found for this user.' },
        { status: 404 }
      );
    }

    const orgId = membership.organization_id;

    // 2. Parallel fetch organization, GST profile, user profile, all members, and invoice counts
    const [orgRes, gstRes, userProfileRes, membersRes, invoiceCountRes] = await Promise.all([
      adminSupabase.from('organizations').select('*').eq('id', orgId).single(),
      adminSupabase.from('gst_profiles').select('*').eq('organization_id', orgId).limit(1).maybeSingle(),
      adminSupabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      adminSupabase.from('organization_members').select('*').eq('organization_id', orgId),
      adminSupabase.from('invoices').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    ]);

    if (orgRes.error) {
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
    }

    // 3. Fetch user profiles for all team members
    const memberRows = membersRes.data || [];
    const memberUserIds = memberRows.map((m: any) => m.user_id);
    
    let profileMap: Record<string, { display_name?: string | null }> = {};
    if (memberUserIds.length > 0) {
      const { data: memberProfiles } = await adminSupabase
        .from('user_profiles')
        .select('id, display_name')
        .in('id', memberUserIds);
      
      if (memberProfiles) {
        memberProfiles.forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }
    }

    // Fetch auth users to get emails and phone numbers for all team members
    let authUserMap: Record<string, { email?: string; phone?: string; display_name?: string }> = {};
    if (adminSupabase?.auth?.admin) {
      try {
        const { data: authUsersRes } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
        if (authUsersRes?.users) {
          authUsersRes.users.forEach((u: any) => {
            let extractedPhone = u.phone || u.user_metadata?.phone;
            if (!extractedPhone && u.email) {
              const m = u.email.match(/(?:master|phone|user)_91(\d{10})/);
              if (m) extractedPhone = `+91${m[1]}`;
            }
            authUserMap[u.id] = {
              email: u.email,
              phone: extractedPhone,
              display_name: u.user_metadata?.display_name || u.user_metadata?.full_name,
            };
          });
        }
      } catch (authErr) {
        console.warn('Could not list auth users in settings GET:', authErr);
      }
    }

    const members: TeamMemberDetails[] = memberRows.map((m: any) => {
      const isCurrent = m.user_id === user.id;
      const authInfo = authUserMap[m.user_id];
      const profileInfo = profileMap[m.user_id];
      const resolvedName =
        profileInfo?.display_name ||
        authInfo?.display_name ||
        (isCurrent ? userProfileRes.data?.display_name || 'Current User' : 'Team Member');
      const resolvedEmail = authInfo?.email || (isCurrent ? user.email : undefined);
      const resolvedPhone = authInfo?.phone || (isCurrent ? user.phone : undefined);

      return {
        id: m.id,
        organization_id: m.organization_id,
        user_id: m.user_id,
        role: m.role,
        created_at: m.created_at,
        display_name: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone,
        is_current_user: isCurrent,
      };
    });

    const invoiceCount = invoiceCountRes.count || 0;

    const entitlements = await getOrganizationEntitlements(orgId);

    const subscription: SubscriptionInfo = {
      id: orgId,
      plan: entitlements.planId,
      plan_name: entitlements.planName,
      status: entitlements.status,
      billing_cycle: entitlements.billingInterval,
      current_period_end: entitlements.currentPeriodEnd,
      cancel_at_period_end: entitlements.cancelAtPeriodEnd,
      max_invoices_per_month: entitlements.limits.invoicesPerMonth,
      max_team_members: entitlements.limits.maxTeamMembers,
      max_whatsapp_messages_per_month: entitlements.limits.whatsappMessagesPerMonth,
      max_ai_drafts_per_month: entitlements.limits.aiInvoiceDraftsPerMonth,
      max_workspaces: entitlements.limits.maxWorkspaces,
      current_invoice_count: Math.max(invoiceCount, entitlements.usage.invoicesThisMonth),
      current_member_count: Math.max(members.length, entitlements.usage.activeMembers),
      current_whatsapp_count: entitlements.usage.whatsappThisMonth,
      current_ai_draft_count: entitlements.usage.aiDraftsThisMonth,
      current_workspace_count: 1,
    };

    const responseData: SettingsData = {
      organization: orgRes.data,
      gstProfile: gstRes.data || null,
      userProfile: userProfileRes.data || null,
      currentUser: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: membership.role,
      },
      members,
      subscription,
      whatsappConfig: {
        is_connected: Boolean(orgRes.data.phone),
        phone_number: orgRes.data.phone || null,
        phone_number_id: null,
        waba_id: null,
        webhook_url: null,
        webhook_verified: false,
      },
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/settings:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, adminSupabase } = await getAuthenticatedUser(req);

    if (!user || !adminSupabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const action = body?.action;
    const payload = (body?.payload && typeof body.payload === 'object') ? body.payload : (body || {});

    // 1. Verify user's membership and role in organization
    const { data: membership, error: memErr } = await adminSupabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (memErr || !membership?.organization_id) {
      return NextResponse.json({ error: 'Forbidden: No organization membership' }, { status: 403 });
    }

    const orgId = membership.organization_id;
    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';

    // 2. Handle Action Branches
    if (action === 'update_business') {
      if (!isOwnerOrAdmin) {
        return NextResponse.json({ error: 'Forbidden: Only owners and admins can update business details' }, { status: 403 });
      }

      const {
        name,
        legal_name,
        phone,
        email,
        gstin,
        address_line1,
        address_line2,
        city,
        state,
        state_code,
        pincode,
        country,
        currency,
        timezone,
        invoice_prefix,
        invoice_theme_id,
        bank_name,
        bank_account_name,
        bank_account_number,
        bank_ifsc_code,
        upi_id,
      } = payload;

      const cleanGstin = gstin ? gstin.trim().toUpperCase() : null;

      const updateData: Record<string, any> = {
        name: name ? name.trim() : undefined,
        legal_name: legal_name ? legal_name.trim() : null,
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        gstin: cleanGstin,
        address_line1: address_line1 ? address_line1.trim() : null,
        address_line2: address_line2 ? address_line2.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        state_code: state_code ? state_code.trim() : (cleanGstin ? cleanGstin.substring(0, 2) : null),
        pincode: pincode ? pincode.trim() : null,
        country: country ? country.trim() : 'India',
        currency: currency ? currency.trim() : 'INR',
        timezone: timezone ? timezone.trim() : 'Asia/Kolkata',
        invoice_prefix: invoice_prefix ? invoice_prefix.trim().toUpperCase() : 'INV',
        bank_name: bank_name ? bank_name.trim() : null,
        bank_account_name: bank_account_name ? bank_account_name.trim() : null,
        bank_account_number: bank_account_number ? bank_account_number.trim() : null,
        bank_ifsc_code: bank_ifsc_code ? bank_ifsc_code.trim().toUpperCase() : null,
        upi_id: upi_id ? upi_id.trim() : null,
        updated_at: new Date().toISOString(),
      };

      if (invoice_theme_id !== undefined) {
        updateData.invoice_theme_id = invoice_theme_id;
      }

      let updatedOrg = null;
      let { data: firstTryOrg, error: orgUpdateErr } = await adminSupabase
        .from('organizations')
        .update(updateData)
        .eq('id', orgId)
        .select()
        .single();

      if (orgUpdateErr) {
        // Fallback: If custom bank columns are missing on remote DB schema cache, strip them and update core fields
        const fallbackUpdateData = { ...updateData };
        delete fallbackUpdateData.bank_name;
        delete fallbackUpdateData.bank_account_name;
        delete fallbackUpdateData.bank_account_number;
        delete fallbackUpdateData.bank_ifsc_code;
        delete fallbackUpdateData.upi_id;

        const { data: retryOrg, error: retryErr } = await adminSupabase
          .from('organizations')
          .update(fallbackUpdateData)
          .eq('id', orgId)
          .select()
          .single();

        if (retryErr) {
          console.error('Error updating organization on retry:', retryErr);
          return NextResponse.json({ error: retryErr.message }, { status: 400 });
        }
        // Attach bank fields virtually to response object
        updatedOrg = {
          ...retryOrg,
          bank_name: bank_name ? bank_name.trim() : null,
          bank_account_name: bank_account_name ? bank_account_name.trim() : null,
          bank_account_number: bank_account_number ? bank_account_number.trim() : null,
          bank_ifsc_code: bank_ifsc_code ? bank_ifsc_code.trim().toUpperCase() : null,
          upi_id: upi_id ? upi_id.trim() : null,
        };
      } else {
        updatedOrg = firstTryOrg;
      }

      // Keep GST Profile synced if GSTIN was modified
      if (cleanGstin) {
        const { data: existingGst } = await adminSupabase
          .from('gst_profiles')
          .select('id')
          .eq('organization_id', orgId)
          .maybeSingle();

        if (existingGst) {
          await adminSupabase
            .from('gst_profiles')
            .update({
              gstin: cleanGstin,
              legal_name: legal_name || name,
              trade_name: name,
              state_code: state_code || cleanGstin.substring(0, 2),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingGst.id);
        } else {
          await adminSupabase
            .from('gst_profiles')
            .insert({
              organization_id: orgId,
              gstin: cleanGstin,
              legal_name: legal_name || name,
              trade_name: name,
              state_code: state_code || cleanGstin.substring(0, 2),
              e_invoice_enabled: false,
              e_way_bill_enabled: false,
            });
        }
      }

      return NextResponse.json({ success: true, organization: updatedOrg });
    }

    if (action === 'update_theme') {
      if (!isOwnerOrAdmin) {
        return NextResponse.json({ error: 'Forbidden: Only owners and admins can update invoice theme' }, { status: 403 });
      }

      const { invoice_theme_id } = payload;
      if (!invoice_theme_id) {
        return NextResponse.json({ error: 'invoice_theme_id is required' }, { status: 400 });
      }

      try {
        await assertCanUseTheme(orgId, invoice_theme_id.trim());
      } catch (themeErr: any) {
        return NextResponse.json({
          error: themeErr.message,
          code: themeErr.code || 'FEATURE_NOT_INCLUDED',
          upgradePlan: themeErr.upgradePlan || 'pro',
        }, { status: 403 });
      }

      const { data: updatedOrg, error: themeUpdateErr } = await adminSupabase
        .from('organizations')
        .update({
          invoice_theme_id: invoice_theme_id.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId)
        .select()
        .single();

      if (themeUpdateErr) {
        console.error('Error updating invoice theme:', themeUpdateErr);
        return NextResponse.json({ error: themeUpdateErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, organization: updatedOrg });
    }

    if (action === 'update_gst') {
      if (!isOwnerOrAdmin) {
        return NextResponse.json({ error: 'Forbidden: Only owners and admins can update GST settings' }, { status: 403 });
      }

      const {
        gstin,
        legal_name,
        trade_name,
        state_code,
        registration_type,
        place_of_supply,
        e_invoice_enabled,
        e_way_bill_enabled,
      } = payload;

      const cleanGstin = gstin ? gstin.trim().toUpperCase() : null;

      // Upsert gst_profiles
      const { data: existingGst } = await adminSupabase
        .from('gst_profiles')
        .select('id')
        .eq('organization_id', orgId)
        .maybeSingle();

      let gstResult;
      if (existingGst) {
        const { data, error } = await adminSupabase
          .from('gst_profiles')
          .update({
            gstin: cleanGstin,
            legal_name: legal_name ? legal_name.trim() : null,
            trade_name: trade_name ? trade_name.trim() : null,
            state_code: state_code ? state_code.trim() : (cleanGstin ? cleanGstin.substring(0, 2) : null),
            registration_type: registration_type || 'Regular',
            place_of_supply: place_of_supply ? place_of_supply.trim() : null,
            e_invoice_enabled: Boolean(e_invoice_enabled),
            e_way_bill_enabled: Boolean(e_way_bill_enabled),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingGst.id)
          .select()
          .single();

        if (error) throw error;
        gstResult = data;
      } else {
        const { data, error } = await adminSupabase
          .from('gst_profiles')
          .insert({
            organization_id: orgId,
            gstin: cleanGstin,
            legal_name: legal_name ? legal_name.trim() : null,
            trade_name: trade_name ? trade_name.trim() : null,
            state_code: state_code ? state_code.trim() : (cleanGstin && cleanGstin.length >= 2 ? cleanGstin.substring(0, 2) : null),
            registration_type: registration_type || 'Regular',
            place_of_supply: place_of_supply ? place_of_supply.trim() : null,
            e_invoice_enabled: Boolean(e_invoice_enabled),
            e_way_bill_enabled: Boolean(e_way_bill_enabled),
          })
          .select()
          .single();

        if (error) throw error;
        gstResult = data;
      }

      // Sync organization gstin
      if (cleanGstin) {
        await adminSupabase
          .from('organizations')
          .update({ gstin: cleanGstin, updated_at: new Date().toISOString() })
          .eq('id', orgId);
      }

      return NextResponse.json({ success: true, gstProfile: gstResult });
    }

    if (action === 'update_invoice') {
      if (!isOwnerOrAdmin) {
        return NextResponse.json({ error: 'Forbidden: Only owners and admins can update invoice defaults' }, { status: 403 });
      }

      const { invoice_prefix, invoice_sequence } = payload;

      const { data: updatedOrg, error: orgErr } = await adminSupabase
        .from('organizations')
        .update({
          invoice_prefix: invoice_prefix ? invoice_prefix.trim().toUpperCase() : 'INV',
          invoice_sequence: Number(invoice_sequence) || 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId)
        .select()
        .single();

      if (orgErr) throw orgErr;

      return NextResponse.json({ success: true, organization: updatedOrg });
    }

    if (action === 'update_profile') {
      const { display_name } = payload;
      const cleanName = display_name ? display_name.trim() : '';

      const { data: profile, error: profErr } = await adminSupabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: cleanName,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profErr) throw profErr;

      return NextResponse.json({ success: true, userProfile: profile });
    }

    if (action === 'invite_member') {
      if (!isOwnerOrAdmin) {
        return NextResponse.json({ error: 'Forbidden: Only owners and admins can invite team members' }, { status: 403 });
      }

      const { phone: rawPhone, email: rawEmail, role, display_name } = payload;
      const inputVal = String(rawPhone || rawEmail || '').trim();

      if (!inputVal || !role) {
        return NextResponse.json({ error: 'Mobile number and access role are required' }, { status: 400 });
      }

      // Check team capacity using central entitlement rules
      try {
        await assertCanAddTeamMember(orgId);
      } catch (entErr: any) {
        return NextResponse.json({
          error: entErr.message,
          code: entErr.code || 'TEAM_LIMIT_REACHED',
          upgradePlan: entErr.upgradePlan || 'pro',
        }, { status: 402 });
      }

      // Validate 10-digit mobile number
      const digits = inputVal.replace(/\D/g, '');
      let tenDigits = '';

      if (digits.length === 10) {
        tenDigits = digits;
      } else if (digits.length === 12 && digits.startsWith('91')) {
        tenDigits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        tenDigits = digits.slice(1);
      } else {
        return NextResponse.json({
          error: 'Please enter a valid 10-digit mobile number (e.g. 9876543210)',
        }, { status: 400 });
      }

      if (!/^[6-9]\d{9}$/.test(tenDigits)) {
        return NextResponse.json({
          error: 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9',
        }, { status: 400 });
      }

      const standardPhone = `+91${tenDigits}`;
      const normalizedPhone = `91${tenDigits}`;
      const internalEmail = `phone_${normalizedPhone}@whatsbill.internal`;
      const cleanDisplayName = display_name?.trim() || `Member ${tenDigits.slice(-4)}`;

      // 1. Check if user already exists in Supabase Auth by phone or internal email
      let targetUserId: string | null = null;
      try {
        const { data: userListData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
        const matchedUser = userListData?.users?.find(
          (u: any) =>
            u.phone === standardPhone ||
            u.phone === normalizedPhone ||
            u.user_metadata?.phone === standardPhone ||
            u.email?.toLowerCase() === internalEmail.toLowerCase() ||
            u.email?.toLowerCase() === `master_${normalizedPhone}@whatsbill.internal`
        );

        if (matchedUser) {
          targetUserId = matchedUser.id;
        }
      } catch (listErr) {
        console.warn('Could not list users for duplicate phone check:', listErr);
      }

      // 2. If user not found in Auth, create them in Auth with phone verified
      if (!targetUserId) {
        const sessionPassword = `Wb#${Math.random().toString(36).slice(2, 8)}${Math.floor(1000 + Math.random() * 9000)}!`;
        try {
          const { data: createdAuth, error: createErr } = await adminSupabase.auth.admin.createUser({
            phone: standardPhone,
            phone_confirm: true,
            email: internalEmail,
            email_confirm: true,
            password: sessionPassword,
            user_metadata: {
              phone: standardPhone,
              display_name: cleanDisplayName,
              full_name: cleanDisplayName,
            },
          });

          if (createErr) {
            // User might have already been created
            const { data: retryList } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
            const retryMatch = retryList?.users?.find(
              (u: any) =>
                u.phone === standardPhone ||
                u.phone === normalizedPhone ||
                u.user_metadata?.phone === standardPhone ||
                u.email?.toLowerCase() === internalEmail.toLowerCase() ||
                u.email?.toLowerCase() === `master_${normalizedPhone}@whatsbill.internal`
            );

            if (retryMatch) {
              targetUserId = retryMatch.id;
            } else {
              console.error('Error creating auth user for phone:', createErr);
              return NextResponse.json({
                error: `Could not register user account for ${standardPhone}: ${createErr.message}`,
              }, { status: 400 });
            }
          } else if (createdAuth?.user?.id) {
            targetUserId = createdAuth.user.id;
          }
        } catch (authCreateErr: any) {
          console.error('Exception creating auth user:', authCreateErr);
          return NextResponse.json({
            error: `Failed to create auth user: ${authCreateErr?.message || 'Internal error'}`,
          }, { status: 500 });
        }
      }

      if (!targetUserId) {
        return NextResponse.json({ error: 'Failed to provision member account.' }, { status: 500 });
      }

      // 3. Check if already member of this organization
      const { data: existingMember } = await adminSupabase
        .from('organization_members')
        .select('id, role')
        .eq('organization_id', orgId)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json({
          error: `Mobile number ${standardPhone} is already a member of this organization with role: ${existingMember.role}.`,
        }, { status: 400 });
      }

      // 4. Upsert user_profiles with display_name and phone
      await adminSupabase.from('user_profiles').upsert({
        id: targetUserId,
        display_name: cleanDisplayName,
        phone: standardPhone,
        updated_at: new Date().toISOString(),
      });

      // 5. Insert into organization_members
      const { data: newMem, error: insertErr } = await adminSupabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: targetUserId,
          role: role || 'accountant',
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Error inserting into organization_members:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 400 });
      }

      const formattedPhoneDisplay = `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;

      return NextResponse.json({
        success: true,
        message: `Successfully added ${cleanDisplayName} (${formattedPhoneDisplay}) to your team as ${role}!`,
        member: {
          ...newMem,
          display_name: cleanDisplayName,
          phone: standardPhone,
          email: internalEmail,
        },
      });
    }

    if (action === 'update_member_role') {
      if (!isOwnerOrAdmin) {
        return NextResponse.json({ error: 'Forbidden: Only owners and admins can modify roles' }, { status: 403 });
      }

      const { member_id, new_role } = payload;
      if (!member_id || !new_role) {
        return NextResponse.json({ error: 'Member ID and new role are required' }, { status: 400 });
      }

      const { data: updatedMem, error: upErr } = await adminSupabase
        .from('organization_members')
        .update({ role: new_role })
        .eq('id', member_id)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (upErr) throw upErr;

      return NextResponse.json({ success: true, member: updatedMem });
    }

    if (action === 'remove_member') {
      if (!isOwnerOrAdmin) {
        return NextResponse.json({ error: 'Forbidden: Only owners and admins can remove members' }, { status: 403 });
      }

      const { member_id } = payload;
      if (!member_id) {
        return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
      }

      // Check member being removed
      const { data: targetMember } = await adminSupabase
        .from('organization_members')
        .select('user_id, role')
        .eq('id', member_id)
        .eq('organization_id', orgId)
        .single();

      if (!targetMember) {
        return NextResponse.json({ error: 'Member not found in organization' }, { status: 404 });
      }

      if (targetMember.role === 'owner') {
        // Count total owners
        const { count: ownerCount } = await adminSupabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('role', 'owner');

        if ((ownerCount || 0) <= 1) {
          return NextResponse.json({ error: 'Cannot remove the only owner of the organization' }, { status: 400 });
        }
      }

      const { error: delErr } = await adminSupabase
        .from('organization_members')
        .delete()
        .eq('id', member_id)
        .eq('organization_id', orgId);

      if (delErr) throw delErr;

      return NextResponse.json({ success: true, message: 'Member removed successfully' });
    }

    if (action === 'change_plan' || action === 'upgrade_plan') {
      if (membership.role !== 'owner') {
        return NextResponse.json({ error: 'Forbidden: Only organization owners can change the subscription plan' }, { status: 403 });
      }

      const targetPlan = payload?.plan || body?.plan;
      const billingInterval = payload?.billing_interval || body?.billing_interval;
      if (!targetPlan || !['free', 'pro', 'business'].includes(targetPlan)) {
        return NextResponse.json({ error: 'Invalid plan. Must be free, pro, or business.' }, { status: 400 });
      }

      await updateOrganizationPlan({
        organizationId: orgId,
        targetPlan: targetPlan,
        billingInterval: billingInterval === 'yearly' ? 'yearly' : 'monthly',
      });

      const newEntitlements = await getOrganizationEntitlements(orgId);
      return NextResponse.json({
        success: true,
        subscription: {
          id: orgId,
          plan: newEntitlements.planId,
          plan_name: newEntitlements.planName,
          status: newEntitlements.status,
          billing_cycle: newEntitlements.billingInterval,
          current_period_end: newEntitlements.currentPeriodEnd,
          cancel_at_period_end: newEntitlements.cancelAtPeriodEnd,
          max_invoices_per_month: newEntitlements.limits.invoicesPerMonth,
          max_team_members: newEntitlements.limits.maxTeamMembers,
          max_whatsapp_messages_per_month: newEntitlements.limits.whatsappMessagesPerMonth,
          max_ai_drafts_per_month: newEntitlements.limits.aiInvoiceDraftsPerMonth,
          max_workspaces: newEntitlements.limits.maxWorkspaces,
          current_invoice_count: newEntitlements.usage.invoicesThisMonth,
          current_member_count: newEntitlements.usage.activeMembers,
          current_whatsapp_count: newEntitlements.usage.whatsappThisMonth,
          current_ai_draft_count: newEntitlements.usage.aiDraftsThisMonth,
          current_workspace_count: 1,
        },
      });
    }

    if (action === 'cancel_subscription') {
      if (membership.role !== 'owner') {
        return NextResponse.json({ error: 'Forbidden: Only organization owners can cancel subscription' }, { status: 403 });
      }

      await cancelOrganizationSubscription(orgId);
      const updatedEntitlements = await getOrganizationEntitlements(orgId);
      return NextResponse.json({
        success: true,
        message: 'Subscription renewal canceled. Your paid features remain active until the end of the billing period. No data will be deleted.',
        cancel_at_period_end: true,
        current_period_end: updatedEntitlements.currentPeriodEnd,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Error in POST /api/settings:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process request' }, { status: 500 });
  }
}
