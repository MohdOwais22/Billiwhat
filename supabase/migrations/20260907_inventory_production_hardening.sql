-- ============================================================================
-- WhatsBill: Task #4 Inventory & Stock Management Production Hardening
-- 1. Creates public.stock_movements table for audit trail
-- 2. Sets canonical organization-isolated RLS policies for products & stock_movements
-- 3. Defines RPC public.adjust_product_stock_atomic for concurrency-safe stock updates
-- 4. Updates public.create_invoice_with_items to deduct stock atomically with row locks
-- 5. Defines RPC public.cancel_invoice_atomic to reverse stock atomically on cancellation
-- ============================================================================

-- 1. Create public.stock_movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('opening_stock', 'stock_in', 'sale', 'adjustment', 'cancellation_return')),
  quantity numeric NOT NULL, -- positive for addition, negative for deduction
  reference_type text DEFAULT 'manual', -- 'manual', 'invoice', 'purchase'
  reference_id text, -- invoice_id or order_id
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_movements ENABLE ROW LEVEL SECURITY;

-- 3. Clean up existing product RLS policies
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

DROP POLICY IF EXISTS "products_select_org" ON public.products;
DROP POLICY IF EXISTS "products_insert_org" ON public.products;
DROP POLICY IF EXISTS "products_update_org" ON public.products;
DROP POLICY IF EXISTS "products_delete_org" ON public.products;

DROP POLICY IF EXISTS "Users can view products in their organization" ON public.products;
DROP POLICY IF EXISTS "Users can insert products in their organization" ON public.products;
DROP POLICY IF EXISTS "Users can update products in their organization" ON public.products;
DROP POLICY IF EXISTS "Users can delete products in their organization" ON public.products;

-- Canonical RLS policies for products
CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = products.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = products.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = products.organization_id
        AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = products.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "products_delete_policy" ON public.products
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = products.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- Clean up and set stock_movements RLS policies
DROP POLICY IF EXISTS "stock_movements_select_policy" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert_policy" ON public.stock_movements;

CREATE POLICY "stock_movements_select_policy" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = stock_movements.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "stock_movements_insert_policy" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = stock_movements.organization_id
        AND om.user_id = auth.uid()
    )
  );

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_products_org_id ON public.products (organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org_sku ON public.products (organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_org_prod ON public.stock_movements (organization_id, product_id);

-- 5. RPC: Atomic Stock Adjustment
CREATE OR REPLACE FUNCTION public.adjust_product_stock_atomic(
  p_product_id uuid,
  p_adjustment_delta numeric DEFAULT NULL,
  p_new_stock_quantity numeric DEFAULT NULL,
  p_movement_type text DEFAULT 'adjustment',
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_current_stock numeric;
  v_target_stock numeric;
  v_delta numeric;
  v_prod_name text;
  v_movement_kind text;
  v_updated_prod record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  SELECT om.organization_id INTO v_org_id
  FROM public.organization_members om
  WHERE om.user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User does not belong to any organization';
  END IF;

  -- Lock product row for atomic stock update
  SELECT stock_quantity, name INTO v_current_stock, v_prod_name
  FROM public.products
  WHERE id = p_product_id AND organization_id = v_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or does not belong to your organization';
  END IF;

  v_current_stock := COALESCE(v_current_stock, 0);

  IF p_new_stock_quantity IS NOT NULL THEN
    v_target_stock := GREATEST(0::numeric, p_new_stock_quantity);
    v_delta := v_target_stock - v_current_stock;
  ELSIF p_adjustment_delta IS NOT NULL THEN
    v_delta := p_adjustment_delta;
    v_target_stock := v_current_stock + v_delta;
    IF v_target_stock < 0 THEN
      RAISE EXCEPTION 'Stock quantity cannot be negative for product "%". Available: %, Attempted reduction: %',
        v_prod_name, v_current_stock, abs(v_delta);
    END IF;
  ELSE
    RAISE EXCEPTION 'Either p_adjustment_delta or p_new_stock_quantity must be provided';
  END IF;

  -- Determine movement type
  v_movement_kind := COALESCE(p_movement_type, 'adjustment');
  IF v_movement_kind NOT IN ('opening_stock', 'stock_in', 'sale', 'adjustment', 'cancellation_return') THEN
    v_movement_kind := 'adjustment';
  END IF;

  -- Update product stock_quantity
  UPDATE public.products
  SET stock_quantity = v_target_stock,
      updated_at = now()
  WHERE id = p_product_id AND organization_id = v_org_id
  RETURNING * INTO v_updated_prod;

  -- Record stock movement
  IF v_delta <> 0 THEN
    INSERT INTO public.stock_movements (
      organization_id,
      product_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      note,
      created_by
    ) VALUES (
      v_org_id,
      p_product_id,
      v_movement_kind,
      v_delta,
      'manual',
      NULL,
      NULLIF(trim(p_note), ''),
      v_user_id
    );
  END IF;

  RETURN to_jsonb(v_updated_prod);
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_product_stock_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_product_stock_atomic TO authenticated;

-- 6. RPC: Atomic Invoice Creation with Stock Deductions
CREATE OR REPLACE FUNCTION public.create_invoice_with_items(
  p_customer_id uuid,
  p_items jsonb,
  p_status text DEFAULT 'issued',
  p_issue_date date DEFAULT CURRENT_DATE,
  p_due_date date DEFAULT NULL,
  p_invoice_type text DEFAULT 'tax_invoice',
  p_place_of_supply text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_terms text DEFAULT NULL,
  p_custom_invoice_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_cust_exists boolean;
  v_invoice_number text;
  v_prefix text;
  v_current_seq integer;
  v_next_seq integer;
  v_status text;
  v_seller_state_code text;
  v_place_of_supply_code text;
  v_is_inter_state boolean := false;
  v_invoice_id uuid;
  
  v_item jsonb;
  v_desc text;
  v_qty numeric;
  v_unit_price numeric;
  v_disc numeric;
  v_tax_rate numeric;
  v_unit text;
  v_hsn text;
  v_prod_id uuid;
  v_current_stock numeric;
  v_prod_name text;

  v_item_gross numeric := 0;
  v_item_taxable numeric := 0;
  v_item_tax numeric := 0;
  v_item_cgst numeric := 0;
  v_item_sgst numeric := 0;
  v_item_igst numeric := 0;
  v_item_cess numeric := 0;
  v_item_line_total numeric := 0;

  v_subtotal numeric := 0;
  v_discount_total numeric := 0;
  v_taxable_amount numeric := 0;
  v_cgst numeric := 0;
  v_sgst numeric := 0;
  v_igst numeric := 0;
  v_cess numeric := 0;
  v_total numeric := 0;
  v_item_idx integer := 0;
  v_result record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create invoice';
  END IF;

  SELECT om.organization_id INTO v_org_id
  FROM public.organization_members om
  WHERE om.user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User does not belong to any active organization';
  END IF;

  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = p_customer_id AND organization_id = v_org_id
  ) INTO v_cust_exists;

  IF NOT v_cust_exists THEN
    RAISE EXCEPTION 'Customer does not belong to your organization or does not exist';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Invoice must contain at least one line item';
  END IF;

  v_status := LOWER(COALESCE(p_status, 'issued'));
  IF v_status NOT IN ('draft', 'issued') THEN
    v_status := 'issued';
  END IF;

  -- Validate line items & product stock sufficiency
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_desc := trim(COALESCE(v_item->>'productName', v_item->>'description', ''));
    IF v_desc = '' THEN
      RAISE EXCEPTION 'Line item description is required';
    END IF;

    v_qty := (COALESCE(v_item->>'quantity', '0'))::numeric;
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than zero for %', v_desc;
    END IF;

    v_unit_price := (COALESCE(v_item->>'unitPrice', v_item->>'unit_price', '0'))::numeric;
    IF v_unit_price < 0 THEN
      RAISE EXCEPTION 'Unit price cannot be negative for %', v_desc;
    END IF;

    BEGIN
      v_prod_id := (v_item->>'productId')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_prod_id := NULL;
    END;

    IF v_prod_id IS NOT NULL THEN
      -- Lock product row for validation & stock deduction
      SELECT stock_quantity, name INTO v_current_stock, v_prod_name
      FROM public.products
      WHERE id = v_prod_id AND organization_id = v_org_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % does not belong to your organization', v_desc;
      END IF;

      -- Verify stock sufficiency if invoice status is issued
      IF v_status = 'issued' THEN
        IF COALESCE(v_current_stock, 0) < v_qty THEN
          RAISE EXCEPTION 'Insufficient stock for product "%": Available %, Required %',
            v_prod_name, COALESCE(v_current_stock, 0), v_qty;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Retrieve seller state details
  SELECT COALESCE(gp.state_code, o.state_code) INTO v_seller_state_code
  FROM public.organizations o
  LEFT JOIN public.gst_profiles gp ON gp.organization_id = o.id
  WHERE o.id = v_org_id;

  v_place_of_supply_code := NULLIF(trim(p_place_of_supply), '');
  IF v_place_of_supply_code IS NOT NULL THEN
    IF v_place_of_supply_code ~ '^[0-9]{2}' THEN
      v_place_of_supply_code := substring(v_place_of_supply_code from 1 for 2);
    END IF;
  END IF;

  IF v_seller_state_code IS NOT NULL AND v_place_of_supply_code IS NOT NULL THEN
    IF v_seller_state_code <> v_place_of_supply_code THEN
      v_is_inter_state := true;
    END IF;
  END IF;

  -- Reserve sequential invoice number
  IF p_custom_invoice_number IS NOT NULL AND trim(p_custom_invoice_number) <> '' THEN
    v_invoice_number := trim(p_custom_invoice_number);
    IF EXISTS (
      SELECT 1 FROM public.invoices
      WHERE organization_id = v_org_id AND invoice_number = v_invoice_number
    ) THEN
      RAISE EXCEPTION 'Invoice number % already exists in your organization', v_invoice_number;
    END IF;
  ELSE
    SELECT invoice_prefix, invoice_sequence INTO v_prefix, v_current_seq
    FROM public.organizations
    WHERE id = v_org_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Organization record not found';
    END IF;

    v_next_seq := COALESCE(v_current_seq, 0) + 1;

    UPDATE public.organizations
    SET invoice_sequence = v_next_seq,
        updated_at = now()
    WHERE id = v_org_id;

    v_invoice_number := COALESCE(v_prefix, 'INV') || '-' || lpad(v_next_seq::text, 4, '0');
  END IF;

  -- Calculate item amounts and totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (COALESCE(v_item->>'quantity', '0'))::numeric;
    v_unit_price := (COALESCE(v_item->>'unitPrice', v_item->>'unit_price', '0'))::numeric;
    v_disc := GREATEST(0::numeric, (COALESCE(v_item->>'discount', '0'))::numeric);
    v_tax_rate := GREATEST(0::numeric, (COALESCE(v_item->>'taxRate', v_item->>'tax_rate', v_item->>'gstRate', '0'))::numeric);

    IF v_tax_rate > 0 AND v_seller_state_code IS NULL THEN
      RAISE EXCEPTION 'Seller business state / GST profile is required for tax invoice creation. Please update business state in Settings.';
    END IF;

    v_item_gross := round(v_qty * v_unit_price, 2);
    v_item_taxable := round(GREATEST(0::numeric, v_item_gross - v_disc), 2);
    v_item_tax := round((v_item_taxable * v_tax_rate) / 100.0, 2);

    IF v_is_inter_state THEN
      v_item_igst := v_item_tax;
      v_item_cgst := 0;
      v_item_sgst := 0;
    ELSE
      v_item_cgst := round(v_item_tax / 2.0, 2);
      v_item_sgst := v_item_tax - v_item_cgst;
      v_item_igst := 0;
    END IF;

    v_item_cess := round((COALESCE(v_item->>'cess', '0'))::numeric, 2);

    v_subtotal := v_subtotal + v_item_gross;
    v_discount_total := v_discount_total + v_disc;
    v_taxable_amount := v_taxable_amount + v_item_taxable;
    v_cgst := v_cgst + v_item_cgst;
    v_sgst := v_sgst + v_item_sgst;
    v_igst := v_igst + v_item_igst;
    v_cess := v_cess + v_item_cess;
  END LOOP;

  v_total := round(v_taxable_amount + v_cgst + v_sgst + v_igst + v_cess, 2);
  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Invoice total amount must be greater than zero';
  END IF;

  -- Insert invoice header
  INSERT INTO public.invoices (
    organization_id, customer_id, invoice_number, invoice_type, status,
    issue_date, due_date, subtotal, discount_total, taxable_amount,
    cgst, sgst, igst, cess, total, place_of_supply, notes, terms,
    source, created_by
  ) VALUES (
    v_org_id, p_customer_id, v_invoice_number, COALESCE(p_invoice_type, 'tax_invoice'), v_status,
    COALESCE(p_issue_date, CURRENT_DATE), p_due_date, v_subtotal, v_discount_total, v_taxable_amount,
    v_cgst, v_sgst, v_igst, v_cess, v_total, p_place_of_supply,
    NULLIF(trim(p_notes), ''), NULLIF(trim(p_terms), ''), 'web', v_user_id
  )
  RETURNING id INTO v_invoice_id;

  -- Insert line items and deduct stock atomically
  v_item_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_desc := trim(COALESCE(v_item->>'productName', v_item->>'description', ''));
    v_qty := (COALESCE(v_item->>'quantity', '0'))::numeric;
    v_unit_price := (COALESCE(v_item->>'unitPrice', v_item->>'unit_price', '0'))::numeric;
    v_disc := (COALESCE(v_item->>'discount', '0'))::numeric;
    v_tax_rate := (COALESCE(v_item->>'taxRate', v_item->>'tax_rate', v_item->>'gstRate', '0'))::numeric;
    v_unit := COALESCE(NULLIF(trim(v_item->>'unit'), ''), 'PCS');
    v_hsn := NULLIF(trim(COALESCE(v_item->>'hsnSac', v_item->>'hsn_sac', v_item->>'hsnCode', '')), '');

    BEGIN
      v_prod_id := (v_item->>'productId')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_prod_id := NULL;
    END;

    v_item_gross := round(v_qty * v_unit_price, 2);
    v_item_taxable := round(GREATEST(0::numeric, v_item_gross - v_disc), 2);
    v_item_tax := round((v_item_taxable * v_tax_rate) / 100.0, 2);

    IF v_is_inter_state THEN
      v_item_igst := v_item_tax;
      v_item_cgst := 0;
      v_item_sgst := 0;
    ELSE
      v_item_cgst := round(v_item_tax / 2.0, 2);
      v_item_sgst := v_item_tax - v_item_cgst;
      v_item_igst := 0;
    END IF;

    v_item_cess := round((COALESCE(v_item->>'cess', '0'))::numeric, 2);
    v_item_line_total := round(v_item_taxable + v_item_cgst + v_item_sgst + v_item_igst + v_item_cess, 2);

    INSERT INTO public.invoice_items (
      invoice_id, product_id, description, hsn_sac, quantity, unit,
      unit_price, discount, taxable_amount, tax_rate, cgst, sgst, igst, cess,
      line_total, sort_order
    ) VALUES (
      v_invoice_id, v_prod_id, v_desc, v_hsn, v_qty, v_unit,
      v_unit_price, v_disc, v_item_taxable, v_tax_rate, v_item_cgst, v_item_sgst, v_item_igst, v_item_cess,
      v_item_line_total, v_item_idx
    );

    -- Deduct product stock and log stock movement if product is linked and status = issued
    IF v_prod_id IS NOT NULL AND v_status = 'issued' THEN
      UPDATE public.products
      SET stock_quantity = stock_quantity - v_qty,
          updated_at = now()
      WHERE id = v_prod_id AND organization_id = v_org_id;

      INSERT INTO public.stock_movements (
        organization_id, product_id, movement_type, quantity, reference_type, reference_id, note, created_by
      ) VALUES (
        v_org_id, v_prod_id, 'sale', -v_qty, 'invoice', v_invoice_id::text,
        'Deducted for Invoice ' || v_invoice_number, v_user_id
      );
    END IF;

    v_item_idx := v_item_idx + 1;
  END LOOP;

  -- Insert receivable if issued
  IF v_status <> 'draft' THEN
    BEGIN
      INSERT INTO public.receivables (organization_id, invoice_id, customer_id, status, priority_score)
      VALUES (v_org_id, v_invoice_id, p_customer_id, 'pending', 50)
      ON CONFLICT (organization_id, invoice_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  SELECT * INTO v_result FROM public.invoices WHERE id = v_invoice_id;
  RETURN to_jsonb(v_result);
END;
$$;

REVOKE ALL ON FUNCTION public.create_invoice_with_items FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_invoice_with_items TO authenticated;

-- 7. RPC: Atomic Invoice Cancellation with Stock Restoration
CREATE OR REPLACE FUNCTION public.cancel_invoice_atomic(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_inv record;
  v_item record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  SELECT om.organization_id INTO v_org_id
  FROM public.organization_members om
  WHERE om.user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User does not belong to any active organization';
  END IF;

  -- Lock target invoice
  SELECT * INTO v_inv
  FROM public.invoices
  WHERE id = p_invoice_id AND organization_id = v_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found or access denied';
  END IF;

  IF v_inv.status = 'cancelled' THEN
    RETURN to_jsonb(v_inv);
  END IF;

  -- Update invoice status to cancelled
  UPDATE public.invoices
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = p_invoice_id AND organization_id = v_org_id;

  -- Restore stock for all products referenced in invoice items
  FOR v_item IN
    SELECT product_id, quantity FROM public.invoice_items
    WHERE invoice_id = p_invoice_id AND product_id IS NOT NULL
  LOOP
    -- Lock product row
    PERFORM 1 FROM public.products
    WHERE id = v_item.product_id AND organization_id = v_org_id
    FOR UPDATE;

    UPDATE public.products
    SET stock_quantity = stock_quantity + v_item.quantity,
        updated_at = now()
    WHERE id = v_item.product_id AND organization_id = v_org_id;

    INSERT INTO public.stock_movements (
      organization_id, product_id, movement_type, quantity, reference_type, reference_id, note, created_by
    ) VALUES (
      v_org_id, v_item.product_id, 'cancellation_return', v_item.quantity, 'invoice', p_invoice_id::text,
      'Stock restored from cancelled Invoice ' || v_inv.invoice_number, v_user_id
    );
  END LOOP;

  -- Update receivables status if present
  UPDATE public.receivables
  SET status = 'cancelled',
      updated_at = now()
  WHERE invoice_id = p_invoice_id AND organization_id = v_org_id;

  SELECT * INTO v_inv FROM public.invoices WHERE id = p_invoice_id;
  RETURN to_jsonb(v_inv);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_invoice_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_invoice_atomic TO authenticated;
