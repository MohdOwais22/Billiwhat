import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Customer, Invoice, Payment, Organization } from '@/types/database';

export type AgeingBucketKey = 'current' | '1-30' | '31-60' | '61-90' | '90+';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'normal';

export interface ReceivablesInvoiceItem {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerBusinessName: string | null;
  phone: string;
  whatsappPhone: string | null;
  email: string | null;
  gstin: string | null;
  issueDate: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  daysOverdue: number;
  bucket: AgeingBucketKey;
  priority: PriorityLevel;
  suggestedAction: string;
  status: string;
}

export interface CustomerReceivablesSummary {
  customerId: string;
  customerName: string;
  businessName: string | null;
  phone: string;
  whatsappPhone: string | null;
  email: string | null;
  gstin: string | null;
  creditLimit: number;
  creditDays: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
  invoicesCount: number;
  overdueInvoicesCount: number;
  oldestDueDate: string | null;
  invoices: ReceivablesInvoiceItem[];
}

export interface ReceivablesMetricsSummary {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueAmount: number;
  overdueCount: number;
  dueTodayAmount: number;
  dueTodayCount: number;
  dueThisWeekAmount: number;
  dueThisWeekCount: number;
  criticalAmount: number; // 60+ days overdue
  criticalCount: number;
  collectionRate: number; // Percentage (0 - 100)
  activeDebtorsCount: number;
  totalInvoicesCount: number;
  openInvoicesCount: number;
}

export interface AgeingBucketTotals {
  current: { amount: number; count: number; percent: number };
  days1to30: { amount: number; count: number; percent: number };
  days31to60: { amount: number; count: number; percent: number };
  days61to90: { amount: number; count: number; percent: number };
  days90Plus: { amount: number; count: number; percent: number };
}

export interface FullCollectionsData {
  organization: Organization;
  summary: ReceivablesMetricsSummary;
  ageingBuckets: AgeingBucketTotals;
  invoiceQueue: ReceivablesInvoiceItem[];
  customerSummaries: CustomerReceivablesSummary[];
  customers: Customer[];
}

/**
 * Calculates complete receivables, debt ageing, and collection priorities from raw Supabase entities
 */
export function computeCollectionsData(
  organization: Organization,
  customers: Customer[],
  invoices: Invoice[],
  payments: Payment[]
): FullCollectionsData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split('T')[0];

  // Calculate 7 days from now for "Due This Week"
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  // 1. Group valid payments by invoice ID
  const paymentsByInvoice = new Map<string, number>();
  const paymentsByCustomer = new Map<string, number>();

  payments.forEach((p) => {
    const status = (p.status || '').toLowerCase();
    if (['failed', 'cancelled', 'bounced', 'reversed'].includes(status)) {
      return;
    }
    const amt = Number(p.amount) || 0;
    if (p.invoice_id) {
      paymentsByInvoice.set(p.invoice_id, (paymentsByInvoice.get(p.invoice_id) || 0) + amt);
    }
    if (p.customer_id) {
      paymentsByCustomer.set(p.customer_id, (paymentsByCustomer.get(p.customer_id) || 0) + amt);
    }
  });

  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  // 2. Process non-cancelled invoices
  const validInvoices = invoices.filter((i) => i.status !== 'cancelled');

  let totalInvoiced = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let dueTodayAmount = 0;
  let dueTodayCount = 0;
  let dueThisWeekAmount = 0;
  let dueThisWeekCount = 0;
  let criticalAmount = 0;
  let criticalCount = 0;

  const rawBucketTotals = {
    current: { amount: 0, count: 0 },
    days1to30: { amount: 0, count: 0 },
    days31to60: { amount: 0, count: 0 },
    days61to90: { amount: 0, count: 0 },
    days90Plus: { amount: 0, count: 0 },
  };

  const invoiceQueue: ReceivablesInvoiceItem[] = [];
  const customerSummaryMap = new Map<string, CustomerReceivablesSummary>();

  validInvoices.forEach((inv) => {
    const invTotal = Number(inv.total) || 0;
    const invPaid = paymentsByInvoice.get(inv.id) || 0;
    const balanceDue = Math.max(0, invTotal - invPaid);

    totalInvoiced += invTotal;
    totalCollected += invPaid;

    if (balanceDue <= 0.01) {
      return; // Fully settled invoice, exclude from active collections queue
    }

    totalOutstanding += balanceDue;

    const cust = customerMap.get(inv.customer_id);
    const custName = cust?.name || 'Customer';
    const busName = cust?.business_name || null;
    const phone = cust?.phone || '';
    const whatsappPhone = cust?.whatsapp_phone || null;
    const email = cust?.email || null;
    const gstin = cust?.gstin || null;

    let daysOverdue = 0;
    const dueDateStr = inv.due_date || null;

    if (inv.due_date) {
      const dueDateObj = new Date(inv.due_date);
      dueDateObj.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDateObj.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      daysOverdue = diffDays > 0 ? diffDays : 0;
    }

    // Determine ageing bracket
    let bucket: AgeingBucketKey = 'current';
    let priority: PriorityLevel = 'normal';
    let suggestedAction = 'Invoice on Track';

    if (daysOverdue === 0) {
      bucket = 'current';
      rawBucketTotals.current.amount += balanceDue;
      rawBucketTotals.current.count += 1;

      if (dueDateStr === todayStr) {
        dueTodayAmount += balanceDue;
        dueTodayCount += 1;
        priority = 'medium';
        suggestedAction = 'Due Today - Friendly Check-in';
      } else if (dueDateStr <= nextWeekStr) {
        dueThisWeekAmount += balanceDue;
        dueThisWeekCount += 1;
        priority = 'normal';
        suggestedAction = 'Due this week - Advance Notice';
      } else {
        priority = 'normal';
        suggestedAction = 'Payment on Track';
      }
    } else if (daysOverdue <= 30) {
      bucket = '1-30';
      rawBucketTotals.days1to30.amount += balanceDue;
      rawBucketTotals.days1to30.count += 1;
      overdueAmount += balanceDue;
      overdueCount += 1;
      priority = 'medium';
      suggestedAction = 'Send 1st WhatsApp Payment Reminder';
    } else if (daysOverdue <= 60) {
      bucket = '31-60';
      rawBucketTotals.days31to60.amount += balanceDue;
      rawBucketTotals.days31to60.count += 1;
      overdueAmount += balanceDue;
      overdueCount += 1;
      priority = 'high';
      suggestedAction = 'Firm WhatsApp Follow-up & Call';
    } else if (daysOverdue <= 90) {
      bucket = '61-90';
      rawBucketTotals.days61to90.amount += balanceDue;
      rawBucketTotals.days61to90.count += 1;
      overdueAmount += balanceDue;
      overdueCount += 1;
      criticalAmount += balanceDue;
      criticalCount += 1;
      priority = 'critical';
      suggestedAction = 'Urgent Formal Notice & Credit Hold';
    } else {
      bucket = '90+';
      rawBucketTotals.days90Plus.amount += balanceDue;
      rawBucketTotals.days90Plus.count += 1;
      overdueAmount += balanceDue;
      overdueCount += 1;
      criticalAmount += balanceDue;
      criticalCount += 1;
      priority = 'critical';
      suggestedAction = 'Escalate for Recovery / Executive Hold';
    }

    const item: ReceivablesInvoiceItem = {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerId: inv.customer_id,
      customerName: custName,
      customerBusinessName: busName,
      phone,
      whatsappPhone,
      email,
      gstin,
      issueDate: inv.issue_date,
      dueDate: dueDateStr,
      total: invTotal,
      amountPaid: invPaid,
      balanceDue,
      daysOverdue,
      bucket,
      priority,
      suggestedAction,
      status: inv.status,
    };

    invoiceQueue.push(item);

    // Accumulate customer summary
    let custSummary = customerSummaryMap.get(inv.customer_id);
    if (!custSummary) {
      custSummary = {
        customerId: inv.customer_id,
        customerName: custName,
        businessName: busName,
        phone,
        whatsappPhone,
        email,
        gstin,
        creditLimit: cust?.credit_limit || 0,
        creditDays: cust?.credit_days || 0,
        totalInvoiced: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90Plus: 0,
        invoicesCount: 0,
        overdueInvoicesCount: 0,
        oldestDueDate: null,
        invoices: [],
      };
      customerSummaryMap.set(inv.customer_id, custSummary);
    }

    custSummary.totalInvoiced += invTotal;
    custSummary.totalPaid += invPaid;
    custSummary.totalOutstanding += balanceDue;
    custSummary.invoicesCount += 1;
    custSummary.invoices.push(item);

    if (bucket === 'current') {
      custSummary.current += balanceDue;
    } else if (bucket === '1-30') {
      custSummary.days1to30 += balanceDue;
      custSummary.overdueInvoicesCount += 1;
    } else if (bucket === '31-60') {
      custSummary.days31to60 += balanceDue;
      custSummary.overdueInvoicesCount += 1;
    } else if (bucket === '61-90') {
      custSummary.days61to90 += balanceDue;
      custSummary.overdueInvoicesCount += 1;
    } else {
      custSummary.days90Plus += balanceDue;
      custSummary.overdueInvoicesCount += 1;
    }

    if (!custSummary.oldestDueDate || dueDateStr < custSummary.oldestDueDate) {
      custSummary.oldestDueDate = dueDateStr;
    }
  });

  // Sort queue by daysOverdue (desc) then balanceDue (desc)
  invoiceQueue.sort((a, b) => {
    if (b.daysOverdue !== a.daysOverdue) {
      return b.daysOverdue - a.daysOverdue;
    }
    return b.balanceDue - a.balanceDue;
  });

  // Convert customer summaries to array and sort by totalOutstanding (desc)
  const customerSummaries = Array.from(customerSummaryMap.values()).sort(
    (a, b) => b.totalOutstanding - a.totalOutstanding
  );

  const collectionRate =
    totalInvoiced > 0 ? Math.min(100, Math.round((totalCollected / totalInvoiced) * 100)) : 100;

  const totalOutSafe = totalOutstanding || 1;
  const ageingBuckets: AgeingBucketTotals = {
    current: {
      amount: rawBucketTotals.current.amount,
      count: rawBucketTotals.current.count,
      percent: Math.round((rawBucketTotals.current.amount / totalOutSafe) * 100),
    },
    days1to30: {
      amount: rawBucketTotals.days1to30.amount,
      count: rawBucketTotals.days1to30.count,
      percent: Math.round((rawBucketTotals.days1to30.amount / totalOutSafe) * 100),
    },
    days31to60: {
      amount: rawBucketTotals.days31to60.amount,
      count: rawBucketTotals.days31to60.count,
      percent: Math.round((rawBucketTotals.days31to60.amount / totalOutSafe) * 100),
    },
    days61to90: {
      amount: rawBucketTotals.days61to90.amount,
      count: rawBucketTotals.days61to90.count,
      percent: Math.round((rawBucketTotals.days61to90.amount / totalOutSafe) * 100),
    },
    days90Plus: {
      amount: rawBucketTotals.days90Plus.amount,
      count: rawBucketTotals.days90Plus.count,
      percent: Math.round((rawBucketTotals.days90Plus.amount / totalOutSafe) * 100),
    },
  };

  const summary: ReceivablesMetricsSummary = {
    totalInvoiced,
    totalCollected,
    totalOutstanding,
    overdueAmount,
    overdueCount,
    dueTodayAmount,
    dueTodayCount,
    dueThisWeekAmount,
    dueThisWeekCount,
    criticalAmount,
    criticalCount,
    collectionRate,
    activeDebtorsCount: customerSummaries.length,
    totalInvoicesCount: validInvoices.length,
    openInvoicesCount: invoiceQueue.length,
  };

  return {
    organization,
    summary,
    ageingBuckets,
    invoiceQueue,
    customerSummaries,
    customers,
  };
}

/**
 * Direct fetch of all collections & receivables data from Supabase
 */
export async function fetchCollectionsData(): Promise<FullCollectionsData> {
  const supabase = createBrowserClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to view Receivables & Collections.');
  }

  // 1. Verify organization
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

  // 2. Fetch organization, customers, invoices, and payments in parallel
  const [orgRes, custRes, invRes, payRes] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('customers').select('*').eq('organization_id', orgId),
    supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled')
      .order('issue_date', { ascending: false }),
    supabase.from('payments').select('*').eq('organization_id', orgId),
  ]);

  if (orgRes.error || !orgRes.data) {
    throw new Error('Failed to retrieve organization profile.');
  }

  const organization = orgRes.data as Organization;
  const customers = (custRes.data || []) as Customer[];
  const invoices = (invRes.data || []) as Invoice[];
  const payments = (payRes.data || []) as Payment[];

  return computeCollectionsData(organization, customers, invoices, payments);
}
