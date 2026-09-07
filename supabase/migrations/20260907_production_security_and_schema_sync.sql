-- Migration: 20260907_production_security_and_schema_sync.sql
-- Description: Consolidated production security, RLS hardening, and schema synchronization with required corrections:
-- 1. Corrected invoice sequence off-by-one (first invoice is INV-0001 using bigint)
-- 2. Removed Maharashtra ('27') default for gst_profiles state_code
-- 3. Strict server-side validation for organization name ('Business name is required')
-- 4. Strict SECURITY DEFINER fixed search_path and execution grants

-- ============================================================================
-- 1. Enable RLS on all verified public tables
-- ============================================================================
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gst_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Deduplicate and clean user_profiles RLS policies
-- ============================================================================
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "user_profiles_select"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "user_profiles_insert"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- 3. Lock down organizations table - Drop permissive insert policies
-- ============================================================================
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.organizations;
DROP POLICY IF EXISTS "authenticated_insert_organizations" ON public.organizations;

DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
CREATE POLICY "organizations_select"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
CREATE POLICY "organizations_update"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 4. Secure Atomic Organization Creation RPC (create_organization_for_current_user)
-- ============================================================================
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
  v_clean_org_name text;
  v_clean_gstin text;
  v_state_code text;
BEGIN
  -- 1. Validate authenticated caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: auth.uid() is null';
  END IF;

  -- 2. Validate organization name server-side
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;
  v_clean_org_name := trim(p_name);

  -- 3. Idempotency: Prevent duplicate organization creation for same user
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

  -- 4. Update public.user_profiles display_name if provided
  IF p_display_name IS NOT NULL AND trim(p_display_name) <> '' THEN
    UPDATE public.user_profiles
    SET display_name = trim(p_display_name),
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- 5. Derive state code from GSTIN if omitted (never default to Maharashtra or random state)
  v_state_code := NULLIF(trim(p_state_code), '');
  IF v_state_code IS NULL AND p_gstin IS NOT NULL AND length(trim(p_gstin)) >= 2 THEN
    v_state_code := substring(upper(trim(p_gstin)) FROM 1 FOR 2);
  END IF;

  -- 6. Atomically insert organization record (invoice_sequence starts at 1 so first invoice is INV-0001)
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
    country,
    currency,
    timezone,
    invoice_prefix,
    invoice_sequence
  ) VALUES (
    v_clean_org_name,
    NULLIF(trim(p_legal_name), ''),
    NULLIF(trim(p_phone), ''),
    NULLIF(trim(p_email), ''),
    NULLIF(trim(p_address_line1), ''),
    NULLIF(trim(p_address_line2), ''),
    NULLIF(trim(p_city), ''),
    NULLIF(trim(p_state), ''),
    v_state_code,
    NULLIF(trim(p_pincode), ''),
    COALESCE(NULLIF(trim(p_country), ''), 'India'),
    'INR',
    'Asia/Kolkata',
    'INV',
    1
  )
  RETURNING id INTO v_new_org_id;

  -- 7. Insert owner membership record
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role
  ) VALUES (
    v_new_org_id,
    v_user_id,
    'owner'
  );

  -- 8. Insert GST profile if GSTIN provided (state_code is strictly provided or derived from GSTIN, never defaulted)
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
      v_clean_org_name,
      COALESCE(NULLIF(trim(p_legal_name), ''), v_clean_org_name),
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

REVOKE ALL ON FUNCTION public.create_organization_for_current_user FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_for_current_user TO authenticated;

-- ============================================================================
-- 5. Atomic Sequential Invoice Number Generator RPC (Off-by-one fixed using bigint)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_is_member boolean;
  v_prefix text;
  v_current_seq bigint;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Forbidden: User is not a member of this organization';
  END IF;

  -- Atomically fetch current sequence and increment for next time, ensuring first invoice is INV-0001 if sequence is 1
  SELECT invoice_prefix, invoice_sequence INTO v_prefix, v_current_seq
  FROM public.organizations
  WHERE id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  UPDATE public.organizations
  SET invoice_sequence = v_current_seq + 1,
      updated_at = now()
  WHERE id = p_org_id;

  RETURN COALESCE(v_prefix, 'INV') || '-' || lpad(v_current_seq::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.get_next_invoice_number(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_next_invoice_number(uuid) TO authenticated;

-- ============================================================================
-- 6. Lock down public.rls_auto_enable()
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon;
    REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;
  END IF;
END $$;
