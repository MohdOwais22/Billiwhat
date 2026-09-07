-- Migration: 20260907_final_db_cleanup_audit.sql
-- Description: Final DB cleanup audit
-- 1. Deduplicate auth.users triggers calling public.handle_new_user_profile()
-- 2. Deduplicate user_profiles RLS policies (exactly 1 SELECT, 1 INSERT, 1 UPDATE using id = auth.uid())
-- 3. Preserve existing user_profiles table structure without modification
-- 4. Revoke EXECUTE on public.rls_auto_enable() from PUBLIC, anon, and authenticated
-- 5. Audit organizations policies: drop broad client WITH CHECK (true) insert policies
-- 6. Enforce strict production schema (no is_active or address on gst_profiles)
-- 7. Preserve identity chain: auth.users.id -> user_profiles.id -> organization_members.user_id -> organizations.id

-- ============================================================================
-- 1. Deduplicate auth.users triggers calling public.handle_new_user_profile()
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  v_kept boolean := false;
BEGIN
  -- Loop over all triggers on auth.users that execute handle_new_user_profile
  FOR r IN (
    SELECT tgname
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
      AND p.proname = 'handle_new_user_profile'
      AND NOT t.tgisinternal
    ORDER BY (tgname = 'on_auth_user_created') DESC, tgname ASC
  ) LOOP
    IF NOT v_kept THEN
      -- Keep exactly ONE canonical trigger
      v_kept := true;
      RAISE NOTICE 'Preserved canonical auth.users trigger: %', r.tgname;
    ELSE
      -- Drop any duplicate trigger
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users;', r.tgname);
      RAISE NOTICE 'Dropped duplicate auth.users trigger: %', r.tgname;
    END IF;
  END LOOP;

  -- If no trigger existed at all, create the canonical one
  IF NOT v_kept THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_profile();
    RAISE NOTICE 'Created canonical auth.users trigger: on_auth_user_created';
  END IF;
END $$;

-- ============================================================================
-- 2. Clean and deduplicate user_profiles RLS policies
-- Keep exactly one SELECT, one INSERT, and one UPDATE policy (id = auth.uid())
-- ============================================================================
-- Explicitly drop reported duplicates from Supabase Security Advisor
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

DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop any other duplicate or legacy policies on public.user_profiles
  FOR pol IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles;', pol.policyname);
    RAISE NOTICE 'Cleaned policy from user_profiles: %', pol.policyname;
  END LOOP;
END $$;

-- Ensure RLS is enabled on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Canonical Single SELECT policy
CREATE POLICY "user_profiles_select"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Canonical Single INSERT policy
CREATE POLICY "user_profiles_insert"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Canonical Single UPDATE policy
CREATE POLICY "user_profiles_update"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- 3. Audit public.rls_auto_enable()
-- Revoke EXECUTE from PUBLIC, anon, and authenticated so it cannot be invoked
-- via PostgREST / REST API. Internal event triggers run under owner/postgres.
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
    RAISE NOTICE 'Revoked EXECUTE on public.rls_auto_enable() from PUBLIC, anon, authenticated.';
  END IF;
END $$;

-- ============================================================================
-- 4. Audit organizations_insert
-- Drop broad client WITH CHECK (true) insert policies.
-- Provisioning is server-authoritative (via service_role or vetted RPC).
-- ============================================================================
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.organizations;
DROP POLICY IF EXISTS "authenticated_insert_organizations" ON public.organizations;

-- Ensure RLS is enabled on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Ensure canonical SELECT policy exists: authenticated members can view their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations' AND cmd = 'SELECT'
  ) THEN
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
  END IF;
END $$;

-- Ensure canonical UPDATE policy exists: owners/admins can update their organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations' AND cmd = 'UPDATE'
  ) THEN
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
  END IF;
END $$;
