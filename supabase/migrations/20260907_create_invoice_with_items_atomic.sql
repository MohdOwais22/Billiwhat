-- ============================================================================
-- WhatsBill: Atomic Sales Invoice & Items Creation RPC
-- Ensures atomic, transactional invoice creation, concurrency-safe sequential
-- invoice numbering, deterministic paise calculations, and organization isolation.
-- ============================================================================

-- Ensure unique constraint on organization_id + invoice_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_org_number 
ON public.invoices(organization_id, invoice_number);

CREATE OR REPLACE FUNCTION public.create_invoice_with_items(
  p_customer_id uuid,
  p_due_date date,
  p_issue_date date DEFAULT CURRENT_DATE,
  p_invoice_type text DEFAULT 'tax_invoice',
  p_place_of_supply text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_terms text DEFAULT NULL,
  p_status text DEFAULT 'issued',
  p_items jsonb DEFAULT '[]'::jsonb,
  p_custom_invoice_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_seller_state_code text;
  v_place_of_supply_code text;
  v_is_inter_state boolean := false;
  v_prefix text;
  v_current_seq bigint;
  v_next_seq bigint;
  v_invoice_number text;
  v_invoice_id uuid;
  v_status text;
  
  -- Totals
  v_subtotal numeric(14,2) := 0;
  v_discount_total numeric(14,2) := 0;
  v_taxable_amount numeric(14,2) := 0;
  v_cgst numeric(14,2) := 0;
  v_sgst numeric(14,2) := 0;
  v_igst numeric(14,2) := 0;
  v_cess numeric(14,2) := 0;
  v_total numeric(14,2) := 0;
  
  -- Iteration variables
  v_item jsonb;
  v_item_idx int := 0;
  v_prod_id uuid;
  v_desc text;
  v_hsn text;
  v_qty numeric(14,3);
  v_unit text;
  v_unit_price numeric(14,2);
  v_disc numeric(14,2);
  v_tax_rate numeric(5,2);
  v_item_gross numeric(14,2);
  v_item_taxable numeric(14,2);
  v_item_tax numeric(14,2);
  v_item_cgst numeric(14,2);
  v_item_sgst numeric(14,2);
  v_item_igst numeric(14,2);
  v_item_cess numeric(14,2);
  v_item_line_total numeric(14,2);
BEGIN
  -- 1. Validate caller authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User session is invalid';
  END IF;

  -- 2. Validate organization membership
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: User is not associated with any organization';
  END IF;

  -- 3. Validate customer exists and belongs to this organization
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer is required to create an invoice';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = p_customer_id AND organization_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Customer not found in your organization';
  END IF;

  -- 4. Validate items count
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Invoice must contain at least one line item';
  END IF;

  -- 5. Validate status: only 'draft' or 'issued' can be created initially
  v_status := LOWER(COALESCE(p_status, 'issued'));
  IF v_status NOT IN ('draft', 'issued') THEN
    v_status := 'issued';
  END IF;

  -- 6. Validate products and descriptions in line items
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
      IF NOT EXISTS (
        SELECT 1 FROM public.products
        WHERE id = v_prod_id AND organization_id = v_org_id
      ) THEN
        RAISE EXCEPTION 'Product with ID % does not belong to your organization', v_prod_id;
      END IF;
    END IF;
  END LOOP;

  -- 7. Retrieve seller state details (never default to any hardcoded state code)
  SELECT COALESCE(gp.state_code, o.state_code) INTO v_seller_state_code
  FROM public.organizations o
  LEFT JOIN public.gst_profiles gp ON gp.organization_id = o.id
  WHERE o.id = v_org_id;

  -- 8. Determine Place of Supply state code
  v_place_of_supply_code := NULLIF(trim(p_place_of_supply), '');
  IF v_place_of_supply_code IS NOT NULL THEN
    IF v_place_of_supply_code ~ '^[0-9]{2}' THEN
      v_place_of_supply_code := substring(v_place_of_supply_code from 1 for 2);
    ELSE
      SELECT code INTO v_place_of_supply_code
      FROM (VALUES 
        ('01', 'Jammu and Kashmir'), ('02', 'Himachal Pradesh'), ('03', 'Punjab'), ('04', 'Chandigarh'),
        ('05', 'Uttarakhand'), ('06', 'Haryana'), ('07', 'Delhi'), ('08', 'Rajasthan'),
        ('09', 'Uttar Pradesh'), ('10', 'Bihar'), ('11', 'Sikkim'), ('12', 'Arunachal Pradesh'),
        ('13', 'Nagaland'), ('14', 'Manipur'), ('15', 'Mizoram'), ('16', 'Tripura'),
        ('17', 'Meghalaya'), ('18', 'Assam'), ('19', 'West Bengal'), ('20', 'Jharkhand'),
        ('21', 'Odisha'), ('22', 'Chhattisgarh'), ('23', 'Madhya Pradesh'), ('24', 'Gujarat'),
        ('26', 'Dadra and Nagar Haveli and Daman and Diu'), ('27', 'Maharashtra'),
        ('29', 'Karnataka'), ('30', 'Goa'), ('31', 'Lakshadweep'), ('32', 'Kerala'),
        ('33', 'Tamil Nadu'), ('34', 'Puducherry'), ('35', 'Andaman and Nicobar Islands'),
        ('36', 'Telangana'), ('37', 'Andhra Pradesh'), ('38', 'Ladakh'), ('97', 'Other Territory')
      ) AS s(code, name)
      WHERE LOWER(s.name) = LOWER(trim(p_place_of_supply))
      LIMIT 1;
    END IF;
  END IF;

  -- Inter-state determination
  IF v_seller_state_code IS NOT NULL AND v_place_of_supply_code IS NOT NULL THEN
    IF v_seller_state_code <> v_place_of_supply_code THEN
      v_is_inter_state := true;
    END IF;
  END IF;

  -- 9. Concurrency-safe sequential invoice number reservation
  IF p_custom_invoice_number IS NOT NULL AND trim(p_custom_invoice_number) <> '' THEN
    v_invoice_number := trim(p_custom_invoice_number);
    IF EXISTS (
      SELECT 1 FROM public.invoices
      WHERE organization_id = v_org_id AND invoice_number = v_invoice_number
    ) THEN
      RAISE EXCEPTION 'Invoice number % already exists in your organization', v_invoice_number;
    END IF;
  ELSE
    -- Lock organization row to guarantee atomic sequence generation without gaps/collisions
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

  -- 10. Authoritative calculation of line items and invoice totals
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_desc := trim(COALESCE(v_item->>'productName', v_item->>'description', ''));
    v_qty := (COALESCE(v_item->>'quantity', '0'))::numeric;
    v_unit_price := (COALESCE(v_item->>'unitPrice', v_item->>'unit_price', '0'))::numeric;
    v_disc := (COALESCE(v_item->>'discount', '0'))::numeric;
    IF v_disc < 0 THEN
      v_disc := 0;
    END IF;

    -- Tax rate strictly from item configuration (never silently defaulting to 18%)
    v_tax_rate := (COALESCE(v_item->>'taxRate', v_item->>'tax_rate', v_item->>'gstRate', '0'))::numeric;
    IF v_tax_rate < 0 THEN
      v_tax_rate := 0;
    END IF;

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
      v_item_sgst := v_item_tax - v_item_cgst; -- Exact split preserving paise
      v_item_igst := 0;
    END IF;

    v_item_cess := round((COALESCE(v_item->>'cess', '0'))::numeric, 2);
    v_item_line_total := round(v_item_taxable + v_item_cgst + v_item_sgst + v_item_igst + v_item_cess, 2);

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

  -- 11. Insert header record into public.invoices
  INSERT INTO public.invoices (
    organization_id,
    customer_id,
    invoice_number,
    invoice_type,
    status,
    issue_date,
    due_date,
    subtotal,
    discount_total,
    taxable_amount,
    cgst,
    sgst,
    igst,
    cess,
    total,
    place_of_supply,
    notes,
    terms,
    source,
    created_by
  ) VALUES (
    v_org_id,
    p_customer_id,
    v_invoice_number,
    COALESCE(p_invoice_type, 'tax_invoice'),
    v_status,
    COALESCE(p_issue_date, CURRENT_DATE),
    p_due_date,
    v_subtotal,
    v_discount_total,
    v_taxable_amount,
    v_cgst,
    v_sgst,
    v_igst,
    v_cess,
    v_total,
    p_place_of_supply,
    NULLIF(trim(p_notes), ''),
    NULLIF(trim(p_terms), ''),
    'web',
    v_user_id
  )
  RETURNING id INTO v_invoice_id;

  -- 12. Insert line items into public.invoice_items
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
      invoice_id,
      product_id,
      description,
      hsn_sac,
      quantity,
      unit,
      unit_price,
      discount,
      taxable_amount,
      tax_rate,
      cgst,
      sgst,
      igst,
      cess,
      line_total,
      sort_order
    ) VALUES (
      v_invoice_id,
      v_prod_id,
      v_desc,
      v_hsn,
      v_qty,
      v_unit,
      v_unit_price,
      v_disc,
      v_item_taxable,
      v_tax_rate,
      v_item_cgst,
      v_item_sgst,
      v_item_igst,
      v_item_cess,
      v_item_line_total,
      v_item_idx
    );

    v_item_idx := v_item_idx + 1;
  END LOOP;

  -- 13. Insert receivable record if issued and not draft
  IF v_status <> 'draft' THEN
    BEGIN
      INSERT INTO public.receivables (
        organization_id,
        invoice_id,
        customer_id,
        status,
        priority_score
      ) VALUES (
        v_org_id,
        v_invoice_id,
        p_customer_id,
        'pending',
        50
      )
      ON CONFLICT (organization_id, invoice_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- In case receivables table is not active, don't fail invoice creation
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'total', v_total,
    'subtotal', v_subtotal,
    'taxable_amount', v_taxable_amount,
    'cgst', v_cgst,
    'sgst', v_sgst,
    'igst', v_igst,
    'cess', v_cess,
    'status', v_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_invoice_with_items FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_invoice_with_items TO authenticated;
