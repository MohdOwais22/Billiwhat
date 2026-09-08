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
    let dbClient: any = null;
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token && supabaseUrl && supabaseAnonKey) {
        try {
          dbClient = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
              getAll: () => [],
              setAll: () => {},
            },
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          });
          const { data: tokenAuth } = await dbClient.auth.getUser();
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
      dbClient = await createClient();
      if (dbClient) {
        const { data: cookieAuth } = await dbClient.auth.getUser();
        if (cookieAuth?.user) {
          user = cookieAuth.user;
        }
      }
    }

    if (!user || !dbClient) {
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

    // Execute atomic database RPC using the authenticated user's session client
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

    if (rpcError) {
      console.error('RPC Error creating organization:', rpcError);
      return NextResponse.json(
        { error: rpcError.message || 'Failed to create workspace in database.' },
        { status: 500 }
      );
    }

    if (rpcResult && rpcResult.success) {
      return NextResponse.json({
        success: true,
        organizationId: rpcResult.organization_id,
        alreadyExisted: rpcResult.already_existed || false,
      });
    }

    return NextResponse.json(
      { error: 'Failed to create workspace in database.' },
      { status: 500 }
    );
  } catch (err: any) {
    console.error('Organization creation API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Something went wrong while creating your workspace.' },
      { status: 500 }
    );
  }
}
