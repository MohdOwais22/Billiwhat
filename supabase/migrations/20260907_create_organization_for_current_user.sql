-- Migration: Secure atomic organization creation for authenticated user
-- Prevents race conditions, enforces auth.uid() identity, and updates user_profiles.
-- Uses the production schema address fields: address_line1, address_line2, city, state, state_code, pincode, country.

CREATE OR REPLACE FUNCTION public.create_organization_for_current_user(
  p_name text,
  p_legal_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_address_line1 text DEFAULT NULL,
  p_address_line2 text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_state_code text DEFAULT NULL,
  p_pincode text DEFAULT NULL,
  p_country text DEFAULT 'India',
  p_gstin text DEFAULT NULL,
  p_display_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_existing_org_id uuid;
  v_new_org_id uuid;
  v_clean_gstin text;
  v_state_code text;
BEGIN
  -- 1. Obtain and verify authenticated user UUID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: auth.uid() is null';
  END IF;

  -- 2. Prevent duplicate organization creation for the same user onboarding attempt
  SELECT organization_id INTO v_existing_org_id
  FROM public.organization_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_existing_org_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'organization_id', v_existing_org_id,
      'already_existed', true
    );
  END IF;

  -- 3. Update public.user_profiles display_name if provided
  IF p_display_name IS NOT NULL AND trim(p_display_name) <> '' THEN
    UPDATE public.user_profiles
    SET display_name = trim(p_display_name),
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Determine state code from GSTIN if not explicitly passed
  v_state_code := NULLIF(trim(p_state_code), '');
  IF v_state_code IS NULL AND p_gstin IS NOT NULL AND trim(p_gstin) <> '' THEN
    v_state_code := substring(upper(trim(p_gstin)) FROM 1 FOR 2);
  END IF;

  -- 4. Create the organization atomically using existing production columns
  INSERT INTO public.organizations (
    name,
    legal_name,
    phone,
    email,
    address_line1,
    address_line2,
    city,
    state,
    state_code,
    pincode,
    country
  ) VALUES (
    trim(p_name),
    NULLIF(trim(p_legal_name), ''),
    NULLIF(trim(p_phone), ''),
    NULLIF(trim(p_email), ''),
    NULLIF(trim(p_address_line1), ''),
    NULLIF(trim(p_address_line2), ''),
    NULLIF(trim(p_city), ''),
    NULLIF(trim(p_state), ''),
    v_state_code,
    NULLIF(trim(p_pincode), ''),
    COALESCE(NULLIF(trim(p_country), ''), 'India')
  )
  RETURNING id INTO v_new_org_id;

  -- 5. Create owner membership directly linking auth.users.id
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role
  ) VALUES (
    v_new_org_id,
    v_user_id,
    'owner'
  );

  -- 6. Insert GST Profile if GSTIN provided
  IF p_gstin IS NOT NULL AND trim(p_gstin) <> '' THEN
    v_clean_gstin := upper(trim(p_gstin));
    
    INSERT INTO public.gst_profiles (
      organization_id,
      gstin,
      trade_name,
      legal_name,
      state_code,
      e_invoice_enabled,
      e_way_bill_enabled
    ) VALUES (
      v_new_org_id,
      v_clean_gstin,
      trim(p_name),
      COALESCE(NULLIF(trim(p_legal_name), ''), trim(p_name)),
      v_state_code,
      false,
      false
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_new_org_id,
    'already_existed', false
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization_for_current_user TO authenticated;
