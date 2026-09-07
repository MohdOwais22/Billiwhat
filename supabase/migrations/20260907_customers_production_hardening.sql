-- ============================================================================
-- WhatsBill: Customers & Credit Management Production Hardening
-- Enforces row-level security, organization isolation, and index optimizations
-- for public.customers table.
-- ============================================================================

-- 1. Ensure RLS is enabled
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing customer policies if any
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;

DROP POLICY IF EXISTS "customers_select_org" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_org" ON public.customers;
DROP POLICY IF EXISTS "customers_update_org" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_org" ON public.customers;

DROP POLICY IF EXISTS "Users can view customers in their organization" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers in their organization" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers in their organization" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers in their organization" ON public.customers;

-- 3. Create canonical organization-isolated policies
CREATE POLICY "customers_select_policy" ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = customers.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "customers_insert_policy" ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = customers.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "customers_update_policy" ON public.customers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = customers.organization_id
        AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = customers.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "customers_delete_policy" ON public.customers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = customers.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- 4. Create performance indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers (organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_phone ON public.customers (organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_org_gstin ON public.customers (organization_id, gstin);
CREATE INDEX IF NOT EXISTS idx_customers_org_name ON public.customers (organization_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_org_business_name ON public.customers (organization_id, business_name);
