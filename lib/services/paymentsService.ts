import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Customer, Invoice, Payment, Organization, PaymentMethod, PaymentStatus } from '@/types/database';

export interface EnrichedPayment extends Payment {
  customer?: Customer | null;
  invoice?: Invoice | null;
  invoiceTotal?: number;
  invoiceBalanceRemaining?: number;
}

export interface PaymentSummaryMetrics {
  totalCollected: number;
  totalPaymentsCount: number;
  paymentsThisMonth: number;
  paymentsThisMonthCount: number;
  paymentsToday: number;
  paymentsTodayCount: number;
  unallocatedAmount: number;
  unallocatedCount: number;
  failedAmount: number;
  failedCount: number;
  cashAmount: number;
  upiAmount: number;
  bankTransferAmount: number;
  cardAmount: number;
  otherAmount: number;
}

export interface FullPaymentsData {
  organization: Organization;
  payments: EnrichedPayment[];
  customers: Customer[];
  invoices: Invoice[];
  metrics: PaymentSummaryMetrics;
  openInvoicesByCustomer: Record<string, {
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate?: string | null;
    total: number;
    amountPaid: number;
    balanceDue: number;
  }[]>;
}

/**
 * Computes all payment metrics, enrichment, and customer invoice allocations from raw Supabase sets
 */
export function computePaymentsData(
  organization: Organization,
  customers: Customer[],
  invoices: Invoice[],
  payments: Payment[]
): FullPaymentsData {
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const invoiceMap = new Map<string, Invoice>();
  invoices.forEach((i) => invoiceMap.set(i.id, i));

  // Compute payments per invoice to calculate balances
  const paymentsByInvoice = new Map<string, number>();
  payments.forEach((p) => {
    const status = (p.status || '').toLowerCase();
    if (['failed', 'cancelled', 'bounced', 'reversed'].includes(status)) return;
    if (p.invoice_id) {
      paymentsByInvoice.set(
        p.invoice_id,
        (paymentsByInvoice.get(p.invoice_id) || 0) + (Number(p.amount) || 0)
      );
    }
  });

  // Build open invoices by customer
  const openInvoicesByCustomer: Record<string, {
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate?: string | null;
    total: number;
    amountPaid: number;
    balanceDue: number;
  }[]> = {};

  invoices.forEach((inv) => {
    if (inv.status === 'cancelled') return;
    const total = Number(inv.total) || 0;
    const paid = paymentsByInvoice.get(inv.id) || 0;
    const balance = Math.max(0, total - paid);

    if (balance > 0.01) {
      if (!openInvoicesByCustomer[inv.customer_id]) {
        openInvoicesByCustomer[inv.customer_id] = [];
      }
      openInvoicesByCustomer[inv.customer_id].push({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        total,
        amountPaid: paid,
        balanceDue: balance,
      });
    }
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayStr = now.toISOString().split('T')[0];

  let totalCollected = 0;
  let totalPaymentsCount = 0;
  let paymentsThisMonth = 0;
  let paymentsThisMonthCount = 0;
  let paymentsToday = 0;
  let paymentsTodayCount = 0;
  let unallocatedAmount = 0;
  let unallocatedCount = 0;
  let failedAmount = 0;
  let failedCount = 0;

  let cashAmount = 0;
  let upiAmount = 0;
  let bankTransferAmount = 0;
  let cardAmount = 0;
  let otherAmount = 0;

  const enrichedPayments: EnrichedPayment[] = payments.map((p) => {
    const amt = Number(p.amount) || 0;
    const status = (p.status || '').toLowerCase();
    const isFailed = ['failed', 'cancelled', 'bounced', 'reversed'].includes(status);
    const dateStr = (p.paid_at || '').split('T')[0];
    const dateObj = new Date(p.paid_at || p.created_at);

    if (!isFailed) {
      totalCollected += amt;
      totalPaymentsCount += 1;

      // Check if today
      if (dateStr === todayStr) {
        paymentsToday += amt;
        paymentsTodayCount += 1;
      }

      // Check if this month
      if (
        !isNaN(dateObj.getTime()) &&
        dateObj.getFullYear() === currentYear &&
        dateObj.getMonth() === currentMonth
      ) {
        paymentsThisMonth += amt;
        paymentsThisMonthCount += 1;
      }

      // Check allocation
      if (!p.invoice_id) {
        unallocatedAmount += amt;
        unallocatedCount += 1;
      }

      // Method breakdown
      const method = (p.method || '').toLowerCase();
      if (method === 'cash') cashAmount += amt;
      else if (method === 'upi') upiAmount += amt;
      else if (method === 'bank_transfer') bankTransferAmount += amt;
      else if (method === 'card') cardAmount += amt;
      else otherAmount += amt;
    } else {
      failedAmount += amt;
      failedCount += 1;
    }

    const cust = customerMap.get(p.customer_id) || null;
    const inv = p.invoice_id ? invoiceMap.get(p.invoice_id) || null : null;

    let invoiceTotal: number | undefined = undefined;
    let invoiceBalanceRemaining: number | undefined = undefined;

    if (inv) {
      invoiceTotal = Number(inv.total) || 0;
      const totalPaidForInv = paymentsByInvoice.get(inv.id) || 0;
      invoiceBalanceRemaining = Math.max(0, invoiceTotal - totalPaidForInv);
    }

    return {
      ...p,
      customer: cust,
      invoice: inv,
      invoiceTotal,
      invoiceBalanceRemaining,
    };
  });

  // Sort payments by paid_at descending
  enrichedPayments.sort((a, b) => {
    const timeA = new Date(a.paid_at || a.created_at).getTime();
    const timeB = new Date(b.paid_at || b.created_at).getTime();
    return timeB - timeA;
  });

  const metrics: PaymentSummaryMetrics = {
    totalCollected,
    totalPaymentsCount,
    paymentsThisMonth,
    paymentsThisMonthCount,
    paymentsToday,
    paymentsTodayCount,
    unallocatedAmount,
    unallocatedCount,
    failedAmount,
    failedCount,
    cashAmount,
    upiAmount,
    bankTransferAmount,
    cardAmount,
    otherAmount,
  };

  return {
    organization,
    payments: enrichedPayments,
    customers,
    invoices,
    metrics,
    openInvoicesByCustomer,
  };
}

/**
 * Fetches all payments, customers, and invoices directly from Supabase with organization isolation
 */
export async function fetchPaymentsData(): Promise<FullPaymentsData> {
  const supabase = createBrowserClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to view Payments & Settlements.');
  }

  // Verify active organization
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .limit(1)
    .maybeSingle();

  if (memberError || !memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const orgId = memberData.organization_id;

  const [orgRes, custRes, invRes, payRes] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('customers').select('*').eq('organization_id', orgId),
    supabase.from('invoices').select('*').eq('organization_id', orgId).neq('status', 'cancelled'),
    supabase.from('payments').select('*').eq('organization_id', orgId).order('paid_at', { ascending: false }),
  ]);

  if (orgRes.error || !orgRes.data) {
    throw new Error('Failed to retrieve organization profile.');
  }

  const organization = orgRes.data as Organization;
  const customers = (custRes.data || []) as Customer[];
  const invoices = (invRes.data || []) as Invoice[];
  const payments = (payRes.data || []) as Payment[];

  return computePaymentsData(organization, customers, invoices, payments);
}

/**
 * Allocates an unallocated payment to a customer invoice
 */
export async function allocatePaymentToInvoice(paymentId: string, invoiceId: string): Promise<void> {
  const supabase = createBrowserClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to allocate payment.');
  }

  const { data: memberData } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const rpcPayload = {
    p_payment_id: paymentId,
    p_invoice_id: invoiceId,
  };

  const { data: rpcRes, error: rpcErr } = await supabase.rpc('allocate_payment_to_invoice', rpcPayload);

  if (rpcErr) {
    throw new Error(rpcErr.message || 'Failed to allocate payment to invoice.');
  }

  if (!rpcRes || !rpcRes.success) {
    throw new Error('Payment allocation failed on server.');
  }
}
