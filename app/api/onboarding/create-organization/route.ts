import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in before creating a workspace.' },
        { status: 401 }
      );
    }

    const user = authData.user;
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
    const cleanPhone = phone?.trim() || null;
    const cleanEmail = email?.trim() || null;
    
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

    // 1. Prevent duplicate organization creation for the same user
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (existingMember?.organization_id) {
      // User already has an organization
      return NextResponse.json({
        success: true,
        organizationId: existingMember.organization_id,
        alreadyExisted: true,
      });
    }

    // 2. Try atomic database RPC first if deployed in Supabase
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
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
    // If display name provided, update user_profiles table (references auth.users.id)
    if (cleanDisplayName) {
      try {
        await supabase
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
    const payload: Record<string, any> = {
      name: trimmedName,
      legal_name: trimmedLegalName,
      phone: cleanPhone,
      email: cleanEmail,
      address_line1: cleanAddressLine1,
      address_line2: cleanAddressLine2,
      city: cleanCity,
      state: cleanState,
      state_code: derivedStateCode,
      pincode: cleanPincode,
      country: cleanCountry,
    };

    const { data: createdOrg, error: orgError } = await supabase
      .from('organizations')
      .insert(payload)
      .select()
      .single();

    if (orgError || !createdOrg) {
      console.error('Failed to insert organization:', orgError);
      return NextResponse.json(
        { error: 'Something went wrong while creating your workspace. Please try again.' },
        { status: 500 }
      );
    }

    // Insert organization membership (role: 'owner') linked to auth.users.id
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: createdOrg.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Failed to insert owner membership, rolling back organization:', memberError);
      // Clean up orphaned organization to avoid partial state
      await supabase.from('organizations').delete().eq('id', createdOrg.id);
      return NextResponse.json(
        { error: 'Something went wrong while creating your workspace. Please try again.' },
        { status: 500 }
      );
    }

    // Insert GST profile if provided
    if (cleanGstin) {
      try {
        await supabase.from('gst_profiles').insert({
          organization_id: createdOrg.id,
          gstin: cleanGstin,
          trade_name: trimmedName,
          legal_name: trimmedLegalName,
          state_code: derivedStateCode || '27',
          is_active: true,
        });
      } catch (gstErr) {
        console.warn('Could not insert gst_profile:', gstErr);
      }
    }

    return NextResponse.json({
      success: true,
      organizationId: createdOrg.id,
      alreadyExisted: false,
    });
  } catch (err: any) {
    console.error('Organization creation API error:', err);
    return NextResponse.json(
      { error: 'Something went wrong while creating your workspace. Please try again.' },
      { status: 500 }
    );
  }
}
