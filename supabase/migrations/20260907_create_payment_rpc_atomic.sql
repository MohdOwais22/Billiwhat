-- ============================================================================
-- WhatsBill: Atomic Payment Recording & Allocation RPCs
-- Ensures atomic, concurrency-safe payment recording, payment allocation,
-- overpayment prevention, paise precision, and organization isolation.
-- ============================================================================

-- 1. Function: record_payment_with_allocation
CREATE OR REPLACE FUNCTION public.record_payment_with_allocation(
  p_customer_id uuid,
  p_amount numeric,
  p_invoice_id uuid DEFAULT NULL,
  p_method text DEFAULT 'cash',
  p_reference text DEFAULT NULL,
  p_paid_at date DEFAULT CURRENT_DATE,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_amount numeric(14,2);
  v_invoice_total numeric(14,2);
  v_inv_customer_id uuid;
  v_inv_status text;
  v_existing_paid numeric(14,2) := 0;
  v_remaining numeric(14,2) := 0;
  v_new_total_paid numeric(14,2) := 0;
  v_new_remaining numeric(14,2) := 0;
  v_new_status text;
  v_payment_id uuid;
  v_cust_name text;
  v_inv_number text;
BEGIN
  -- A. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User session is invalid';
  END IF;

  -- B. Verify organization membership
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: User is not associated with any organization';
  END IF;

  -- C. Validate customer ownership
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required to record a payment';
  END IF;

  SELECT COALESCE(business_name, name) INTO v_cust_name
  FROM public.customers
  WHERE id = p_customer_id AND organization_id = v_org_id;

  IF v_cust_name IS NULL THEN
    RAISE EXCEPTION 'Customer not found in your organization';
  END IF;

  -- D. Validate payment amount
  v_amount := round(COALESCE(p_amount, 0), 2);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- E. If allocated to an invoice, perform atomic lock & overpayment check
  IF p_invoice_id IS NOT NULL THEN
    -- Lock target invoice row to serialize concurrent payment attempts on the same invoice
    SELECT total, customer_id, invoice_number, status 
    INTO v_invoice_total, v_inv_customer_id, v_inv_number, v_inv_status
    FROM public.invoices
    WHERE id = p_invoice_id AND organization_id = v_org_id
    FOR UPDATE;

    IF v_inv_number IS NULL THEN
      RAISE EXCEPTION 'Invoice not found or access denied';
    END IF;

    IF v_inv_customer_id <> p_customer_id THEN
      RAISE EXCEPTION 'Selected invoice does not belong to the payment customer';
    END IF;

    -- Calculate total existing valid payments for this invoice
    SELECT COALESCE(SUM(amount), 0) INTO v_existing_paid
    FROM public.payments
    WHERE invoice_id = p_invoice_id
      AND organization_id = v_org_id
      AND LOWER(COALESCE(status, 'completed')) NOT IN ('failed', 'cancelled', 'bounced', 'reversed');

    v_existing_paid := round(v_existing_paid, 2);
    v_remaining := round(GREATEST(0::numeric, v_invoice_total - v_existing_paid), 2);

    -- Reject overpayment
    IF v_amount > v_remaining THEN
      RAISE EXCEPTION 'Payment amount (₹%) exceeds remaining invoice balance (₹%) for invoice %', 
        v_amount, v_remaining, v_inv_number;
    END IF;
  END IF;

  -- F. Insert payment record
  INSERT INTO public.payments (
    organization_id,
    customer_id,
    invoice_id,
    amount,
    paid_at,
    method,
    reference,
    status,
    metadata
  ) VALUES (
    v_org_id,
    p_customer_id,
    p_invoice_id,
    v_amount,
    COALESCE(p_paid_at, CURRENT_DATE),
    LOWER(COALESCE(p_method, 'cash')),
    NULLIF(trim(p_reference), ''),
    'completed',
    CASE WHEN p_notes IS NOT NULL AND trim(p_notes) <> '' 
         THEN jsonb_build_object('notes', trim(p_notes)) 
         ELSE '{}'::jsonb 
    END
  )
  RETURNING id INTO v_payment_id;

  -- G. If associated with invoice, update invoice & receivables status authoritatively
  IF p_invoice_id IS NOT NULL THEN
    v_new_total_paid := round(v_existing_paid + v_amount, 2);
    v_new_remaining := round(GREATEST(0::numeric, v_invoice_total - v_new_total_paid), 2);

    IF v_new_remaining <= 0 THEN
      v_new_status := 'paid';
    ELSIF v_new_total_paid > 0 THEN
      v_new_status := 'partially_paid';
    ELSE
      v_new_status := 'unpaid';
    END IF;

    UPDATE public.invoices
    SET status = v_new_status,
        updated_at = now()
    WHERE id = p_invoice_id AND organization_id = v_org_id;

    -- Sync status in receivables table if record exists
    BEGIN
      UPDATE public.receivables
      SET status = CASE 
            WHEN v_new_status = 'paid' THEN 'paid'
            WHEN v_new_status = 'partially_paid' THEN 'partially_paid'
            ELSE 'pending'
          END,
          updated_at = now()
      WHERE invoice_id = p_invoice_id AND organization_id = v_org_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  -- H. Audit log entry
  BEGIN
    INSERT INTO public.audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (
      v_org_id,
      v_user_id,
      'RECORD_PAYMENT',
      'payment',
      v_payment_id,
      jsonb_build_object(
        'customer_id', p_customer_id,
        'invoice_id', p_invoice_id,
        'amount', v_amount,
        'method', LOWER(COALESCE(p_method, 'cash')),
        'new_outstanding', v_new_remaining,
        'new_status', v_new_status
      ),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'customer_id', p_customer_id,
    'customer_name', v_cust_name,
    'invoice_id', p_invoice_id,
    'invoice_number', v_inv_number,
    'amount', v_amount,
    'new_status', COALESCE(v_new_status, 'completed'),
    'new_outstanding', v_new_remaining
  );
END;
$$;


-- 2. Function: allocate_payment_to_invoice
CREATE OR REPLACE FUNCTION public.allocate_payment_to_invoice(
  p_payment_id uuid,
  p_invoice_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_pay_amount numeric(14,2);
  v_pay_customer_id uuid;
  v_existing_inv_id uuid;
  v_pay_status text;
  v_inv_total numeric(14,2);
  v_inv_customer_id uuid;
  v_inv_number text;
  v_existing_paid numeric(14,2) := 0;
  v_remaining numeric(14,2) := 0;
  v_new_total_paid numeric(14,2) := 0;
  v_new_remaining numeric(14,2) := 0;
  v_new_status text;
BEGIN
  -- A. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User session is invalid';
  END IF;

  -- B. Verify organization membership
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: User is not associated with any organization';
  END IF;

  -- C. Lock & verify payment record
  SELECT amount, customer_id, invoice_id, status 
  INTO v_pay_amount, v_pay_customer_id, v_existing_inv_id, v_pay_status
  FROM public.payments
  WHERE id = p_payment_id AND organization_id = v_org_id
  FOR UPDATE;

  IF v_pay_amount IS NULL THEN
    RAISE EXCEPTION 'Payment not found or access denied';
  END IF;

  IF LOWER(COALESCE(v_pay_status, 'completed')) IN ('failed', 'cancelled', 'bounced', 'reversed') THEN
    RAISE EXCEPTION 'Cannot allocate a failed or cancelled payment';
  END IF;

  IF v_existing_inv_id IS NOT NULL THEN
    RAISE EXCEPTION 'Payment is already allocated to an invoice';
  END IF;

  -- D. Lock & verify target invoice record
  SELECT total, customer_id, invoice_number, status
  INTO v_inv_total, v_inv_customer_id, v_inv_number, v_new_status
  FROM public.invoices
  WHERE id = p_invoice_id AND organization_id = v_org_id
  FOR UPDATE;

  IF v_inv_number IS NULL THEN
    RAISE EXCEPTION 'Invoice not found or access denied';
  END IF;

  IF v_inv_customer_id <> v_pay_customer_id THEN
    RAISE EXCEPTION 'Invoice does not belong to the payment customer account';
  END IF;

  -- E. Calculate total existing valid payments for target invoice
  SELECT COALESCE(SUM(amount), 0) INTO v_existing_paid
  FROM public.payments
  WHERE invoice_id = p_invoice_id
    AND organization_id = v_org_id
    AND LOWER(COALESCE(status, 'completed')) NOT IN ('failed', 'cancelled', 'bounced', 'reversed');

  v_existing_paid := round(v_existing_paid, 2);
  v_pay_amount := round(v_pay_amount, 2);
  v_remaining := round(GREATEST(0::numeric, v_inv_total - v_existing_paid), 2);

  -- Reject overpayment
  IF v_pay_amount > v_remaining THEN
    RAISE EXCEPTION 'Payment amount (₹%) exceeds remaining invoice balance (₹%) for invoice %', 
      v_pay_amount, v_remaining, v_inv_number;
  END IF;

  -- F. Allocate payment
  UPDATE public.payments
  SET invoice_id = p_invoice_id,
      updated_at = now()
  WHERE id = p_payment_id AND organization_id = v_org_id;

  -- G. Recalculate invoice status authoritatively
  v_new_total_paid := round(v_existing_paid + v_pay_amount, 2);
  v_new_remaining := round(GREATEST(0::numeric, v_inv_total - v_new_total_paid), 2);

  IF v_new_remaining <= 0 THEN
    v_new_status := 'paid';
  ELSIF v_new_total_paid > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  UPDATE public.invoices
  SET status = v_new_status,
      updated_at = now()
  WHERE id = p_invoice_id AND organization_id = v_org_id;

  -- H. Sync status in receivables table if record exists
  BEGIN
    UPDATE public.receivables
    SET status = CASE 
          WHEN v_new_status = 'paid' THEN 'paid'
          WHEN v_new_status = 'partially_paid' THEN 'partially_paid'
          ELSE 'pending'
        END,
        updated_at = now()
    WHERE invoice_id = p_invoice_id AND organization_id = v_org_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- I. Audit log entry
  BEGIN
    INSERT INTO public.audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (
      v_org_id,
      v_user_id,
      'ALLOCATE_PAYMENT',
      'payment',
      p_payment_id,
      jsonb_build_object(
        'invoice_id', p_invoice_id,
        'invoice_number', v_inv_number,
        'amount', v_pay_amount,
        'new_outstanding', v_new_remaining,
        'new_status', v_new_status
      ),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'invoice_id', p_invoice_id,
    'invoice_number', v_inv_number,
    'amount', v_pay_amount,
    'new_status', v_new_status,
    'new_outstanding', v_new_remaining
  );
END;
$$;

-- Privileges
REVOKE ALL ON FUNCTION public.record_payment_with_allocation FROM PUBLIC;
REVOKE ALL ON FUNCTION public.allocate_payment_to_invoice FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_payment_with_allocation TO authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_payment_to_invoice TO authenticated;
