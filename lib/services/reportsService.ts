import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Customer, GstProfile, Invoice, InvoiceItem, InvoiceStatus, Organization, Payment } from '@/types/database';

export type ReportPeriod = 'this_month' | 'last_month' | 'this_quarter' | 'this_fy' | 'custom';

export interface ReportDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

/**
 * Calculates Indian Financial Year & standard date ranges
 */
export function calculateReportDateRange(
  period: ReportPeriod,
  customRange?: { startDate: string; endDate: string }
): ReportDateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = Jan, 3 = Apr, 8 = Sep, 11 = Dec)

  const toDateStr = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  switch (period) {
    case 'this_month': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const monthName = now.toLocaleString('default', { month: 'short' });
      return {
        startDate: toDateStr(start),
        endDate: toDateStr(end),
        label: `This Month (${monthName} ${year})`,
      };
    }
    case 'last_month': {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      const lastMonthDate = new Date(year, month - 1, 1);
      const monthName = lastMonthDate.toLocaleString('default', { month: 'short' });
      const lastMonthYear = lastMonthDate.getFullYear();
      return {
        startDate: toDateStr(start),
        endDate: toDateStr(end),
        label: `Last Month (${monthName} ${lastMonthYear})`,
      };
    }
    case 'this_quarter': {
      // Indian Financial Quarters:
      // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
      let qStartMonth = 0;
      let qEndMonth = 2;
      let qLabel = 'Q4';
      let qYear = year;

      if (month >= 3 && month <= 5) {
        qStartMonth = 3;
        qEndMonth = 5;
        qLabel = 'Q1 (Apr-Jun)';
      } else if (month >= 6 && month <= 8) {
        qStartMonth = 6;
        qEndMonth = 8;
        qLabel = 'Q2 (Jul-Sep)';
      } else if (month >= 9 && month <= 11) {
        qStartMonth = 9;
        qEndMonth = 11;
        qLabel = 'Q3 (Oct-Dec)';
      } else {
        qStartMonth = 0;
        qEndMonth = 2;
        qLabel = 'Q4 (Jan-Mar)';
      }

      const start = new Date(year, qStartMonth, 1);
      const end = new Date(year, qEndMonth + 1, 0);
      return {
        startDate: toDateStr(start),
        endDate: toDateStr(end),
        label: `This Quarter (${qLabel} ${qYear})`,
      };
    }
    case 'this_fy': {
      // Indian Financial Year: April 1 to March 31
      let fyStartYear = year;
      let fyEndYear = year + 1;

      if (month < 3) {
        // Jan-Mar belongs to previous calendar start
        fyStartYear = year - 1;
        fyEndYear = year;
      }

      const start = new Date(fyStartYear, 3, 1); // Apr 1
      const end = new Date(fyEndYear, 2, 31);    // Mar 31
      return {
        startDate: toDateStr(start),
        endDate: toDateStr(end),
        label: `FY ${fyStartYear}-${String(fyEndYear).slice(-2)}`,
      };
    }
    case 'custom': {
      if (customRange?.startDate && customRange?.endDate) {
        return {
          startDate: customRange.startDate,
          endDate: customRange.endDate,
          label: `${customRange.startDate} to ${customRange.endDate}`,
        };
      }
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        startDate: toDateStr(start),
        endDate: toDateStr(end),
        label: 'Custom Range',
      };
    }
  }
}

// Data models for Reports
export interface FinancialOverviewData {
  totalSales: number;
  totalTaxable: number;
  totalTax: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  partiallyPaidCount: number;
  unpaidCount: number;
  cancelledCount: number;
}

export interface SalesReportBreakdownItem {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  invoiceCount: number;
  taxableAmount: number;
  taxAmount: number;
  totalSales: number;
  collectedAmount: number;
}

export interface GstRateBreakdownItem {
  taxRate: number; // e.g. 0, 5, 12, 18, 28
  itemCount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
  totalValue: number;
}

export interface Gstr1PreparationRow {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  customerId: string;
  customerName: string;
  customerBusinessName: string | null;
  customerGstin: string | null;
  isB2B: boolean;
  placeOfSupply: string;
  status: InvoiceStatus;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
  total: number;
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: 'invoice' | 'payment';
  reference: string;
  description: string;
  debit: number;   // Invoiced amount increases party debt
  credit: number;  // Payment amount reduces party debt
  runningBalance: number;
  status?: string;
  paymentMethod?: string | null;
}

export interface CustomerStatementData {
  customer: Customer;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  entries: CustomerLedgerEntry[];
}

export interface AgeingCustomerRow {
  customerId: string;
  customerName: string;
  businessName: string | null;
  phone: string;
  gstin: string | null;
  totalOutstanding: number;
  current: number;      // Not overdue
  days1to30: number;    // 1-30 days overdue
  days31to60: number;   // 31-60 days overdue
  days61to90: number;   // 61-90 days overdue
  days90Plus: number;   // >90 days overdue
  overdueInvoicesCount: number;
  oldestDueDate: string | null;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    total: number;
    amountPaid: number;
    balanceDue: number;
    daysOverdue: number;
    bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+';
  }>;
}

export interface ReceivablesAgeingReportData {
  totalOutstanding: number;
  bucketTotals: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90Plus: number;
  };
  bucketCounts: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90Plus: number;
  };
  customerRows: AgeingCustomerRow[];
}

export interface FullReportsData {
  organization: Organization;
  gstProfile: GstProfile | null;
  dateRange: ReportDateRange;
  customers: Customer[];
  overview: FinancialOverviewData;
  salesInvoices: Gstr1PreparationRow[];
  dailySales: SalesReportBreakdownItem[];
  weeklySales: SalesReportBreakdownItem[];
  monthlySales: SalesReportBreakdownItem[];
  gstSummary: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    totalTax: number;
    totalInvoiceValue: number;
    rateBreakdown: GstRateBreakdownItem[];
  };
  gstr1Rows: Gstr1PreparationRow[];
  receivablesAgeing: ReceivablesAgeingReportData;
  allInvoices: Invoice[];
  allPayments: Payment[];
}

/**
 * Fetch and compute complete financial reports from Supabase
 * Enforces strict organization isolation via organization_members table
 */
export async function fetchFinancialReportsData(
  dateRange: ReportDateRange
): Promise<FullReportsData> {
  const supabase = createBrowserClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to access financial reports.');
  }

  // 1. Verify organization membership
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', authData.user.id)
    .limit(1)
    .maybeSingle();

  if (memberError || !memberData?.organization_id) {
    throw new Error('No active organization found for this user account.');
  }

  const orgId = memberData.organization_id;

  // 2. Fetch all required tables in parallel with organization scoping
  const [
    orgRes,
    gstRes,
    customersRes,
    invoicesRes,
    paymentsRes,
  ] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('gst_profiles').select('*').eq('organization_id', orgId).limit(1).maybeSingle(),
    supabase.from('customers').select('*').eq('organization_id', orgId).order('name', { ascending: true }),
    supabase.from('invoices').select('*').eq('organization_id', orgId).order('issue_date', { ascending: false }),
    supabase.from('payments').select('*').eq('organization_id', orgId).order('paid_at', { ascending: false }),
  ]);

  if (orgRes.error && orgRes.error.code !== 'PGRST116') throw orgRes.error;

  const organization: Organization = orgRes.data || {
    id: orgId,
    name: 'My Business',
    country: 'India',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    invoice_prefix: 'INV',
    invoice_sequence: 1,
    created_at: new Date().toISOString(),
  };

  const gstProfile: GstProfile | null = gstRes.data ?? null;
  const customers: Customer[] = customersRes.data ?? [];
  const allInvoices: Invoice[] = invoicesRes.data ?? [];
  const allPayments: Payment[] = paymentsRes.data ?? [];

  // 3. Fetch invoice_items for invoices issued in the selected date range
  const periodInvoices = allInvoices.filter(
    (inv) => inv.issue_date >= dateRange.startDate && inv.issue_date <= dateRange.endDate
  );
  const periodInvoiceIds = periodInvoices.map((inv) => inv.id);

  let periodInvoiceItems: InvoiceItem[] = [];
  if (periodInvoiceIds.length > 0) {
    // Query in batches if large, or direct query
    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .in('invoice_id', periodInvoiceIds);

    if (!itemsError && itemsData) {
      periodInvoiceItems = itemsData;
    }
  }

  return computeReportsData({
    organization,
    gstProfile,
    dateRange,
    customers,
    allInvoices,
    allPayments,
    periodInvoiceItems,
  });
}

/**
 * Pure calculation engine for financial, GST, Sales, and Ageing reports
 */
function computeReportsData({
  organization,
  gstProfile,
  dateRange,
  customers,
  allInvoices,
  allPayments,
  periodInvoiceItems,
}: {
  organization: Organization;
  gstProfile: GstProfile | null;
  dateRange: ReportDateRange;
  customers: Customer[];
  allInvoices: Invoice[];
  allPayments: Payment[];
  periodInvoiceItems: InvoiceItem[];
}): FullReportsData {
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  // Map payments by invoice
  const paymentsByInvoice = new Map<string, number>();
  const validPayments = allPayments.filter(
    (p) => p.status !== 'bounced' && p.status !== 'failed' && p.status !== 'cancelled'
  );

  validPayments.forEach((p) => {
    if (p.invoice_id) {
      paymentsByInvoice.set(
        p.invoice_id,
        (paymentsByInvoice.get(p.invoice_id) || 0) + Number(p.amount)
      );
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Invoices in current period
  const periodInvoices = allInvoices.filter(
    (inv) => inv.issue_date >= dateRange.startDate && inv.issue_date <= dateRange.endDate
  );

  // Payments collected in current period
  const periodPayments = validPayments.filter(
    (p) => p.paid_at >= dateRange.startDate && p.paid_at <= dateRange.endDate && p.status === 'completed'
  );

  const totalCollectedInPeriod = periodPayments.reduce((acc, p) => acc + Number(p.amount), 0);

  // Financial Overview calculations (from non-cancelled period invoices)
  const validPeriodInvoices = periodInvoices.filter((inv) => inv.status !== 'cancelled');
  const totalSales = validPeriodInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
  const totalTaxable = validPeriodInvoices.reduce((acc, inv) => acc + Number(inv.taxable_amount || 0), 0);
  const totalCGST = validPeriodInvoices.reduce((acc, inv) => acc + Number(inv.cgst || 0), 0);
  const totalSGST = validPeriodInvoices.reduce((acc, inv) => acc + Number(inv.sgst || 0), 0);
  const totalIGST = validPeriodInvoices.reduce((acc, inv) => acc + Number(inv.igst || 0), 0);
  const totalCess = validPeriodInvoices.reduce((acc, inv) => acc + Number(inv.cess || 0), 0);
  const totalTax = totalCGST + totalSGST + totalIGST + totalCess;

  // Active invoices across the entire organization for outstanding & overdue calculations
  const nonCancelledAllInvoices = allInvoices.filter((inv) => inv.status !== 'cancelled');
  let totalOutstanding = 0;
  let totalOverdue = 0;

  nonCancelledAllInvoices.forEach((inv) => {
    const paid = paymentsByInvoice.get(inv.id) || 0;
    const balance = Math.max(0, Number(inv.total) - paid);
    if (balance > 0) {
      totalOutstanding += balance;
      const due = inv.due_date ? new Date(inv.due_date) : new Date(inv.issue_date);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        totalOverdue += balance;
      }
    }
  });

  // Invoice status counts in selected period
  let paidCount = 0;
  let partiallyPaidCount = 0;
  let unpaidCount = 0;
  let cancelledCount = 0;

  periodInvoices.forEach((inv) => {
    if (inv.status === 'cancelled') {
      cancelledCount += 1;
      return;
    }
    const paid = paymentsByInvoice.get(inv.id) || 0;
    const total = Number(inv.total);
    if (paid >= total && total > 0) {
      paidCount += 1;
    } else if (paid > 0 && paid < total) {
      partiallyPaidCount += 1;
    } else {
      unpaidCount += 1;
    }
  });

  const overview: FinancialOverviewData = {
    totalSales,
    totalTaxable,
    totalTax,
    totalCollected: totalCollectedInPeriod,
    totalOutstanding,
    totalOverdue,
    invoiceCount: validPeriodInvoices.length,
    paidInvoiceCount: paidCount,
    partiallyPaidCount,
    unpaidCount,
    cancelledCount,
  };

  // 4. GSTR-1 preparation rows & Sales Invoices
  const gstr1Rows: Gstr1PreparationRow[] = periodInvoices.map((inv) => {
    const cust = customerMap.get(inv.customer_id);
    const custGstin = cust?.gstin?.trim() || null;
    const isB2B = Boolean(custGstin && custGstin.length === 15);
    const cgstVal = Number(inv.cgst) || 0;
    const sgstVal = Number(inv.sgst) || 0;
    const igstVal = Number(inv.igst) || 0;
    const cessVal = Number(inv.cess) || 0;
    const taxTot = cgstVal + sgstVal + igstVal + cessVal;

    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      invoiceDate: inv.issue_date,
      dueDate: inv.due_date || null,
      customerId: inv.customer_id,
      customerName: cust?.name || 'Customer',
      customerBusinessName: cust?.business_name || null,
      customerGstin: custGstin,
      isB2B,
      placeOfSupply: inv.place_of_supply || organization.state || 'Intra-State',
      status: inv.status,
      taxableAmount: Number(inv.taxable_amount) || 0,
      cgst: cgstVal,
      sgst: sgstVal,
      igst: igstVal,
      cess: cessVal,
      totalTax: taxTot,
      total: Number(inv.total) || 0,
    };
  });

  // 5. GST Rate-wise Breakdown from invoice_items
  const rateMap = new Map<
    number,
    {
      itemCount: number;
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      cess: number;
      totalTax: number;
      totalValue: number;
    }
  >();

  // Initialize standard rates
  [0, 5, 12, 18, 28].forEach((r) => {
    rateMap.set(r, {
      itemCount: 0,
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0,
      totalTax: 0,
      totalValue: 0,
    });
  });

  // Aggregate items from non-cancelled invoices
  const validInvoiceIdSet = new Set(validPeriodInvoices.map((i) => i.id));
  periodInvoiceItems.forEach((item) => {
    if (!validInvoiceIdSet.has(item.invoice_id)) return;

    const rate = Number(item.tax_rate) || 0;
    const existing = rateMap.get(rate) || {
      itemCount: 0,
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0,
      totalTax: 0,
      totalValue: 0,
    };

    const taxAmt = Number(item.taxable_amount) || 0;
    const cgstAmt = Number(item.cgst) || 0;
    const sgstAmt = Number(item.sgst) || 0;
    const igstAmt = Number(item.igst) || 0;
    const cessAmt = Number(item.cess) || 0;
    const lineTax = cgstAmt + sgstAmt + igstAmt + cessAmt;
    const lineTot = Number(item.line_total) || (taxAmt + lineTax);

    rateMap.set(rate, {
      itemCount: existing.itemCount + 1,
      taxableAmount: existing.taxableAmount + taxAmt,
      cgst: existing.cgst + cgstAmt,
      sgst: existing.sgst + sgstAmt,
      igst: existing.igst + igstAmt,
      cess: existing.cess + cessAmt,
      totalTax: existing.totalTax + lineTax,
      totalValue: existing.totalValue + lineTot,
    });
  });

  // Filter and sort rates that have entries or return populated standard slabs
  const rateBreakdown: GstRateBreakdownItem[] = Array.from(rateMap.entries())
    .map(([taxRate, data]) => ({
      taxRate,
      ...data,
    }))
    .filter((r) => r.itemCount > 0 || r.taxableAmount > 0)
    .sort((a, b) => a.taxRate - b.taxRate);

  // Fallback: If no invoice items exist but invoices have tax, synthesize from invoices
  if (rateBreakdown.length === 0 && validPeriodInvoices.length > 0) {
    if (totalTax > 0) {
      rateBreakdown.push({
        taxRate: 18,
        itemCount: validPeriodInvoices.length,
        taxableAmount: totalTaxable,
        cgst: totalCGST,
        sgst: totalSGST,
        igst: totalIGST,
        cess: totalCess,
        totalTax: totalTax,
        totalValue: totalSales,
      });
    } else {
      rateBreakdown.push({
        taxRate: 0,
        itemCount: validPeriodInvoices.length,
        taxableAmount: totalTaxable || totalSales,
        cgst: 0,
        sgst: 0,
        igst: 0,
        cess: 0,
        totalTax: 0,
        totalValue: totalSales,
      });
    }
  }

  // 6. Sales Breakdowns (Daily, Weekly, Monthly)
  const dailySales = computeDailyBreakdown(validPeriodInvoices, periodPayments, dateRange);
  const weeklySales = computeWeeklyBreakdown(validPeriodInvoices, periodPayments);
  const monthlySales = computeMonthlyBreakdown(validPeriodInvoices, periodPayments);

  // 7. Receivables Ageing calculation
  const receivablesAgeing = computeReceivablesAgeing(
    customers,
    nonCancelledAllInvoices,
    paymentsByInvoice
  );

  return {
    organization,
    gstProfile,
    dateRange,
    customers,
    overview,
    salesInvoices: gstr1Rows,
    dailySales,
    weeklySales,
    monthlySales,
    gstSummary: {
      taxableValue: totalTaxable,
      cgst: totalCGST,
      sgst: totalSGST,
      igst: totalIGST,
      cess: totalCess,
      totalTax: totalTax,
      totalInvoiceValue: totalSales,
      rateBreakdown,
    },
    gstr1Rows,
    receivablesAgeing,
    allInvoices,
    allPayments: validPayments,
  };
}

/**
 * Daily grouping of sales and collections
 */
function computeDailyBreakdown(
  invoices: Invoice[],
  payments: Payment[],
  dateRange: ReportDateRange
): SalesReportBreakdownItem[] {
  const dailyMap = new Map<
    string,
    {
      invoiceCount: number;
      taxableAmount: number;
      taxAmount: number;
      totalSales: number;
      collectedAmount: number;
    }
  >();

  invoices.forEach((inv) => {
    const d = inv.issue_date;
    const existing = dailyMap.get(d) || {
      invoiceCount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      totalSales: 0,
      collectedAmount: 0,
    };

    const taxAmt = (Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.igst) || 0) + (Number(inv.cess) || 0);

    dailyMap.set(d, {
      invoiceCount: existing.invoiceCount + 1,
      taxableAmount: existing.taxableAmount + (Number(inv.taxable_amount) || 0),
      taxAmount: existing.taxAmount + taxAmt,
      totalSales: existing.totalSales + Number(inv.total),
      collectedAmount: existing.collectedAmount,
    });
  });

  payments.forEach((p) => {
    const d = p.paid_at.split('T')[0];
    const existing = dailyMap.get(d) || {
      invoiceCount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      totalSales: 0,
      collectedAmount: 0,
    };

    dailyMap.set(d, {
      ...existing,
      collectedAmount: existing.collectedAmount + Number(p.amount),
    });
  });

  return Array.from(dailyMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // Newest date first
    .map(([dateKey, data]) => {
      const dateObj = new Date(dateKey);
      const label = isNaN(dateObj.getTime())
        ? dateKey
        : dateObj.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });

      return {
        key: dateKey,
        label,
        startDate: dateKey,
        endDate: dateKey,
        ...data,
      };
    });
}

/**
 * Weekly grouping of sales and collections
 */
function computeWeeklyBreakdown(
  invoices: Invoice[],
  payments: Payment[]
): SalesReportBreakdownItem[] {
  const weeklyMap = new Map<
    string,
    {
      label: string;
      startDate: string;
      endDate: string;
      invoiceCount: number;
      taxableAmount: number;
      taxAmount: number;
      totalSales: number;
      collectedAmount: number;
    }
  >();

  const getWeekKey = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { key: 'unknown', label: 'Unknown', start: dateStr, end: dateStr };
    const day = d.getDay();
    const diffToMon = (day + 6) % 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const yyyy = mon.getFullYear();
    const mm = String(mon.getMonth() + 1).padStart(2, '0');
    const dd = String(mon.getDate()).padStart(2, '0');
    const key = `${yyyy}-W-${mm}-${dd}`;

    const startLabel = mon.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const endLabel = sun.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return {
      key,
      label: `${startLabel} - ${endLabel}`,
      start: `${yyyy}-${mm}-${dd}`,
      end: sun.toISOString().split('T')[0],
    };
  };

  invoices.forEach((inv) => {
    const { key, label, start, end } = getWeekKey(inv.issue_date);
    const existing = weeklyMap.get(key) || {
      label,
      startDate: start,
      endDate: end,
      invoiceCount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      totalSales: 0,
      collectedAmount: 0,
    };

    const taxAmt = (Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.igst) || 0) + (Number(inv.cess) || 0);

    weeklyMap.set(key, {
      ...existing,
      invoiceCount: existing.invoiceCount + 1,
      taxableAmount: existing.taxableAmount + (Number(inv.taxable_amount) || 0),
      taxAmount: existing.taxAmount + taxAmt,
      totalSales: existing.totalSales + Number(inv.total),
    });
  });

  payments.forEach((p) => {
    const { key, label, start, end } = getWeekKey(p.paid_at.split('T')[0]);
    const existing = weeklyMap.get(key) || {
      label,
      startDate: start,
      endDate: end,
      invoiceCount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      totalSales: 0,
      collectedAmount: 0,
    };

    weeklyMap.set(key, {
      ...existing,
      collectedAmount: existing.collectedAmount + Number(p.amount),
    });
  });

  return Array.from(weeklyMap.entries())
    .sort((a, b) => b[1].startDate.localeCompare(a[1].startDate))
    .map(([key, val]) => ({
      key,
      ...val,
    }));
}

/**
 * Monthly grouping of sales and collections
 */
function computeMonthlyBreakdown(
  invoices: Invoice[],
  payments: Payment[]
): SalesReportBreakdownItem[] {
  const monthlyMap = new Map<
    string,
    {
      label: string;
      startDate: string;
      endDate: string;
      invoiceCount: number;
      taxableAmount: number;
      taxAmount: number;
      totalSales: number;
      collectedAmount: number;
    }
  >();

  invoices.forEach((inv) => {
    const dateObj = new Date(inv.issue_date);
    if (isNaN(dateObj.getTime())) return;
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const label = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const existing = monthlyMap.get(key) || {
      label,
      startDate: start,
      endDate: end,
      invoiceCount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      totalSales: 0,
      collectedAmount: 0,
    };

    const taxAmt = (Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.igst) || 0) + (Number(inv.cess) || 0);

    monthlyMap.set(key, {
      ...existing,
      invoiceCount: existing.invoiceCount + 1,
      taxableAmount: existing.taxableAmount + (Number(inv.taxable_amount) || 0),
      taxAmount: existing.taxAmount + taxAmt,
      totalSales: existing.totalSales + Number(inv.total),
    });
  });

  payments.forEach((p) => {
    const dateObj = new Date(p.paid_at);
    if (isNaN(dateObj.getTime())) return;
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const label = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const existing = monthlyMap.get(key) || {
      label,
      startDate: start,
      endDate: end,
      invoiceCount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      totalSales: 0,
      collectedAmount: 0,
    };

    monthlyMap.set(key, {
      ...existing,
      collectedAmount: existing.collectedAmount + Number(p.amount),
    });
  });

  return Array.from(monthlyMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, val]) => ({
      key,
      ...val,
    }));
}

/**
 * Calculates dynamic Receivables Ageing buckets across all active invoices
 */
function computeReceivablesAgeing(
  customers: Customer[],
  invoices: Invoice[],
  paymentsByInvoice: Map<string, number>
): ReceivablesAgeingReportData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const customerDataMap = new Map<string, AgeingCustomerRow>();

  let totalOutstanding = 0;
  const bucketTotals = {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    days90Plus: 0,
  };
  const bucketCounts = {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    days90Plus: 0,
  };

  invoices.forEach((inv) => {
    const paid = paymentsByInvoice.get(inv.id) || 0;
    const total = Number(inv.total);
    const balance = Math.max(0, total - paid);

    if (balance <= 0) return; // Completely paid invoice, skip from ageing debt

    const due = inv.due_date ? new Date(inv.due_date) : new Date(inv.issue_date);
    due.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const daysOverdue = diffDays > 0 ? diffDays : 0;

    let bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+' = 'current';

    if (daysOverdue === 0) {
      bucket = 'current';
      bucketTotals.current += balance;
      bucketCounts.current += 1;
    } else if (daysOverdue <= 30) {
      bucket = '1-30';
      bucketTotals.days1to30 += balance;
      bucketCounts.days1to30 += 1;
    } else if (daysOverdue <= 60) {
      bucket = '31-60';
      bucketTotals.days31to60 += balance;
      bucketCounts.days31to60 += 1;
    } else if (daysOverdue <= 90) {
      bucket = '61-90';
      bucketTotals.days61to90 += balance;
      bucketCounts.days61to90 += 1;
    } else {
      bucket = '90+';
      bucketTotals.days90Plus += balance;
      bucketCounts.days90Plus += 1;
    }

    totalOutstanding += balance;

    // Customer grouping
    const custId = inv.customer_id;
    const cust = customerMap.get(custId);
    const existing = customerDataMap.get(custId) || {
      customerId: custId,
      customerName: cust?.name || 'Customer',
      businessName: cust?.business_name || null,
      phone: cust?.phone || '',
      gstin: cust?.gstin || null,
      totalOutstanding: 0,
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90Plus: 0,
      overdueInvoicesCount: 0,
      oldestDueDate: null,
      invoices: [],
    };

    existing.totalOutstanding += balance;
    if (bucket === 'current') existing.current += balance;
    else if (bucket === '1-30') {
      existing.days1to30 += balance;
      existing.overdueInvoicesCount += 1;
    } else if (bucket === '31-60') {
      existing.days31to60 += balance;
      existing.overdueInvoicesCount += 1;
    } else if (bucket === '61-90') {
      existing.days61to90 += balance;
      existing.overdueInvoicesCount += 1;
    } else {
      existing.days90Plus += balance;
      existing.overdueInvoicesCount += 1;
    }

    if (!existing.oldestDueDate || (inv.due_date && inv.due_date < existing.oldestDueDate)) {
      existing.oldestDueDate = inv.due_date || inv.issue_date;
    }

    existing.invoices.push({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      issueDate: inv.issue_date,
      dueDate: inv.due_date || inv.issue_date,
      total,
      amountPaid: paid,
      balanceDue: balance,
      daysOverdue,
      bucket,
    });

    customerDataMap.set(custId, existing);
  });

  const customerRows = Array.from(customerDataMap.values()).sort(
    (a, b) => b.totalOutstanding - a.totalOutstanding
  );

  return {
    totalOutstanding,
    bucketTotals,
    bucketCounts,
    customerRows,
  };
}

/**
 * Calculates Customer Account Statement (Party Ledger)
 * Derives opening balance and chronological debits/credits strictly from actual invoices & payments
 */
export function calculateCustomerStatement({
  customer,
  allInvoices,
  allPayments,
  startDate,
  endDate,
}: {
  customer: Customer;
  allInvoices: Invoice[];
  allPayments: Payment[];
  startDate: string;
  endDate: string;
}): CustomerStatementData {
  // 1. Invoices for this customer
  const custInvoices = allInvoices.filter(
    (i) => i.customer_id === customer.id && i.status !== 'cancelled'
  );

  // 2. Payments for this customer
  const custPayments = allPayments.filter(
    (p) =>
      p.customer_id === customer.id &&
      p.status !== 'bounced' &&
      p.status !== 'failed' &&
      p.status !== 'cancelled'
  );

  // 3. Calculate Opening Balance prior to startDate:
  // Invoiced amount before startDate minus Payments before startDate
  const priorInvoices = custInvoices.filter((i) => i.issue_date < startDate);
  const priorPayments = custPayments.filter((p) => p.paid_at < startDate);

  const priorDebits = priorInvoices.reduce((acc, i) => acc + Number(i.total), 0);
  const priorCredits = priorPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const openingBalance = priorDebits - priorCredits;

  // 4. Ledger entries within [startDate, endDate]
  const periodInvoices = custInvoices.filter(
    (i) => i.issue_date >= startDate && i.issue_date <= endDate
  );
  const periodPayments = custPayments.filter(
    (p) => p.paid_at >= startDate && p.paid_at <= endDate
  );

  type RawEntry = {
    date: string;
    type: 'invoice' | 'payment';
    reference: string;
    description: string;
    debit: number;
    credit: number;
    status?: string;
    paymentMethod?: string | null;
  };

  const rawEntries: RawEntry[] = [];

  periodInvoices.forEach((inv) => {
    rawEntries.push({
      date: inv.issue_date,
      type: 'invoice',
      reference: inv.invoice_number,
      description: `Tax Invoice (${inv.status.replace('_', ' ').toUpperCase()})`,
      debit: Number(inv.total),
      credit: 0,
      status: inv.status,
    });
  });

  periodPayments.forEach((p) => {
    const methodStr = p.method ? p.method.toUpperCase().replace('_', ' ') : 'PAYMENT';
    const refStr = p.reference ? `Ref: ${p.reference}` : '';
    rawEntries.push({
      date: p.paid_at.split('T')[0],
      type: 'payment',
      reference: p.reference || `REC-${p.id.slice(0, 6).toUpperCase()}`,
      description: `Payment Received via ${methodStr} ${refStr}`.trim(),
      debit: 0,
      credit: Number(p.amount),
      status: p.status,
      paymentMethod: p.method,
    });
  });

  // Sort chronological
  rawEntries.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    // If same date, show invoices before payments
    return a.type === 'invoice' ? -1 : 1;
  });

  let runningBalance = openingBalance;
  let totalDebits = 0;
  let totalCredits = 0;

  const entries: CustomerLedgerEntry[] = rawEntries.map((raw, idx) => {
    totalDebits += raw.debit;
    totalCredits += raw.credit;
    runningBalance = runningBalance + raw.debit - raw.credit;

    return {
      id: `entry-${idx}-${raw.date}`,
      date: raw.date,
      type: raw.type,
      reference: raw.reference,
      description: raw.description,
      debit: raw.debit,
      credit: raw.credit,
      runningBalance,
      status: raw.status,
      paymentMethod: raw.paymentMethod,
    };
  });

  const closingBalance = openingBalance + totalDebits - totalCredits;

  return {
    customer,
    openingBalance,
    totalDebits,
    totalCredits,
    closingBalance,
    entries,
  };
}
