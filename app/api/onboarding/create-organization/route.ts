import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from '@/lib/supabase/config';

const STATE_TO_CODE: Record<string, string> = {
  'Jammu and Kashmir': '01',
  'Himachal Pradesh': '02',
  'Punjab': '03',
  'Chandigarh': '04',
  'Uttarakhand': '05',
  'Haryana': '06',
  'Delhi': '07',
  'Rajasthan': '08',
  'Uttar Pradesh': '09',
  'Bihar': '10',
  'Assam': '18',
  'West Bengal': '19',
  'Jharkhand': '20',
  'Odisha': '21',
  'Chhattisgarh': '22',
  'Madhya Pradesh': '23',
  'Gujarat': '24',
  'Maharashtra': '27',
  'Karnataka': '29',
  'Goa': '30',
  'Kerala': '32',
  'Tamil Nadu': '33',
  'Telangana': '36',
  'Andhra Pradesh': '37',
  'Ladakh': '38',
};

export async function POST(req: NextRequest) {
  try {
    const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey } = getSupabaseEnv();

    // 1. Authenticate user: Check Authorization Bearer header first, then cookie-based session
    let user: any = null;
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token && supabaseUrl && supabaseAnonKey) {
        try {
          const tokenClient = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
              getAll: () => [],
              setAll: () => {},
            },
          });
          const { data: tokenAuth } = await tokenClient.auth.getUser(token);
          if (tokenAuth?.user) {
            user = tokenAuth.user;
          }
        } catch (tokenErr) {
          console.warn('Bearer token validation failed:', tokenErr);
        }
      }
    }

    // If no user from header, check cookie session
    if (!user) {
      const supabase = await createClient();
      const { data: cookieAuth } = await supabase.auth.getUser();
      if (cookieAuth?.user) {
        user = cookieAuth.user;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in before creating a workspace.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      legalName,
      phone,
      email,
      addressLine1,
      address_line1,
      address,
      addressLine2,
      address_line2,
      city,
      state,
      stateCode,
      state_code,
      pincode,
      country,
      gstin,
      displayName,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Business or Trading Name is required.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedLegalName = legalName?.trim() || trimmedName;
    const cleanGstin = gstin?.trim().toUpperCase() || null;
    const cleanPhone = phone?.trim() || user.phone || null;
    const cleanEmail = email?.trim() || user.email || null;
    
    // Existing production schema address fields:
    const cleanAddressLine1 = (addressLine1 || address_line1 || address)?.trim() || null;
    const cleanAddressLine2 = (addressLine2 || address_line2)?.trim() || null;
    const cleanCity = city?.trim() || null;
    const cleanState = state?.trim() || null;
    const cleanPincode = pincode?.trim() || null;
    const cleanCountry = country?.trim() || 'India';
    
    // Derive state_code from stateCode, gstin (first 2 digits), or state name
    let derivedStateCode = (stateCode || state_code)?.trim() || null;
    if (!derivedStateCode && cleanGstin && cleanGstin.length >= 2) {
      derivedStateCode = cleanGstin.substring(0, 2);
    }
    if (!derivedStateCode && cleanState && STATE_TO_CODE[cleanState]) {
      derivedStateCode = STATE_TO_CODE[cleanState];
    }

    const cleanDisplayName = displayName?.trim() || null;

    // Use admin client with service role key if available, otherwise cookie-based client
    let dbClient: any = null;
    if (serviceRoleKey && supabaseUrl) {
      dbClient = createServerClient(supabaseUrl, serviceRoleKey, {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      });
    } else {
      dbClient = await createClient();
    }

    // 1. Prevent duplicate organization creation for the same user
    const { data: existingMember } = await dbClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (existingMember?.organization_id) {
      return NextResponse.json({
        success: true,
        organizationId: existingMember.organization_id,
        alreadyExisted: true,
      });
    }

    // 2. Try atomic database RPC first if deployed in Supabase
    try {
      const { data: rpcResult, error: rpcError } = await dbClient.rpc(
        'create_organization_for_current_user',
        {
          p_name: trimmedName,
          p_legal_name: trimmedLegalName,
          p_phone: cleanPhone,
          p_email: cleanEmail,
          p_address_line1: cleanAddressLine1,
          p_address_line2: cleanAddressLine2,
          p_city: cleanCity,
          p_state: cleanState,
          p_state_code: derivedStateCode,
          p_pincode: cleanPincode,
          p_country: cleanCountry,
          p_gstin: cleanGstin,
          p_display_name: cleanDisplayName,
        }
      );

      if (!rpcError && rpcResult?.success && rpcResult?.organization_id) {
        return NextResponse.json({
          success: true,
          organizationId: rpcResult.organization_id,
          alreadyExisted: rpcResult.already_existed || false,
        });
      }
    } catch {
      // RPC not found or errored, proceed to server fallback
    }

    // 3. Fallback: Server-side execution
    if (cleanDisplayName) {
      try {
        await dbClient
          .from('user_profiles')
          .update({
            display_name: cleanDisplayName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch (profileErr) {
        console.warn('Could not update user_profiles:', profileErr);
      }
    }

    // Create organization using existing production columns
    const newOrgId = crypto.randomUUID();
    const payload: Record<string, any> = {
      id: newOrgId,
      name: trimmedName,
      legal_name: trimmedLegalName,
      country: cleanCountry || 'India',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      invoice_prefix: 'INV',
      invoice_sequence: 1,
    };
    if (cleanGstin) payload.gstin = cleanGstin;
    if (cleanPhone) payload.phone = cleanPhone;
    if (cleanEmail) payload.email = cleanEmail;
    if (cleanAddressLine1) payload.address_line1 = cleanAddressLine1;
    if (cleanAddressLine2) payload.address_line2 = cleanAddressLine2;
    if (cleanCity) payload.city = cleanCity;
    if (cleanState) payload.state = cleanState;
    if (derivedStateCode) payload.state_code = derivedStateCode;
    if (cleanPincode) payload.pincode = cleanPincode;

    const { error: orgError } = await dbClient
      .from('organizations')
      .insert(payload);

    if (orgError) {
      console.error('Failed to insert organization:', orgError);
      return NextResponse.json(
        { error: orgError.message || 'Failed to create workspace in database.' },
        { status: 500 }
      );
    }

    // Insert organization membership (role: 'owner') linked to auth.users.id
    const { error: memberError } = await dbClient
      .from('organization_members')
      .insert({
        organization_id: newOrgId,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Failed to insert owner membership, rolling back organization:', memberError);
      await dbClient.from('organizations').delete().eq('id', newOrgId);
      return NextResponse.json(
        { error: memberError.message || 'Failed to assign workspace ownership.' },
        { status: 500 }
      );
    }

    // Insert GST profile if provided (strictly respecting gst_profiles schema)
    if (cleanGstin) {
      try {
        await dbClient.from('gst_profiles').insert({
          organization_id: newOrgId,
          gstin: cleanGstin,
          trade_name: trimmedName,
          legal_name: trimmedLegalName,
          state_code: derivedStateCode || '27',
          e_invoice_enabled: false,
          e_way_bill_enabled: false,
        });
      } catch (gstErr) {
        console.warn('Could not insert gst_profile:', gstErr);
      }
    }

    return NextResponse.json({
      success: true,
      organizationId: newOrgId,
      alreadyExisted: false,
    });
  } catch (err: any) {
    console.error('Organization creation API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Something went wrong while creating your workspace.' },
      { status: 500 }
    );
  }
}
