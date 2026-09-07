import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { captureWhatsBillError } from '@/lib/sentry';
import { APP_NAME } from '@/config/brand';
import { computeInvoiceSummary, determineGstState, roundPaise } from '@/lib/utils/taxCalculation';
import {
  CollectionQueueItem,
  Customer,
  DashboardData,
  DashboardSummaryMetrics,
  DateRange,
  GstProfile,
  Invoice,
  InvoiceStatus,
  InvoiceWithDetails,
  Organization,
  Payment,
  PaymentMethod,
  PaymentWithCustomer,
  PeriodType,
  Product,
  QuickInsightsData,
  SalesTrendPoint,
} from '@/types/database';

/**
 * Calculates start and end date strings (YYYY-MM-DD) for a given PeriodType
 */
export function calculateDateRange(
  period: PeriodType,
  customRange?: { startDate: string; endDate: string }
): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const toDateStr = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  switch (period) {
    case 'today': {
      const todayStr = toDateStr(now);
      return { startDate: todayStr, endDate: todayStr };
    }
    case 'this_week': {
      const currentDay = now.getDay();
      const distanceToMonday = (currentDay + 6) % 7;
      const monday = new Date(year, month, day - distanceToMonday);
      const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
      return { startDate: toDateStr(monday), endDate: toDateStr(sunday) };
    }
    case 'this_month': {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      return { startDate: toDateStr(startOfMonth), endDate: toDateStr(endOfMonth) };
    }
    case 'last_month': {
      const startOfLastMonth = new Date(year, month - 1, 1);
      const endOfLastMonth = new Date(year, month, 0);
      return { startDate: toDateStr(startOfLastMonth), endDate: toDateStr(endOfLastMonth) };
    }
    case 'custom': {
      if (customRange?.startDate && customRange?.endDate) {
        return customRange;
      }
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      return { startDate: toDateStr(startOfMonth), endDate: toDateStr(endOfMonth) };
    }
  }
}

/**
 * Core service to fetch and compute all dashboard data for Whatsbill from Supabase
 */
export async function fetchDashboardData(
  period: PeriodType,
  supabaseClient?: any,
  customRange?: { startDate: string; endDate: string }
): Promise<DashboardData> {
  const dateRange = calculateDateRange(period, customRange);
  const client = supabaseClient || createBrowserClient();

  try {
    const { data: authData } = await client.auth.getUser();
    if (authData?.user) {
      const liveData = await fetchFromSupabase(client, authData.user, dateRange);
      return {
        ...liveData,
        dataSource: 'supabase_live',
        userEmail: authData.user.email || authData.user.phone || undefined,
        isAuthenticated: true,
      };
    }
  } catch (err) {
    captureWhatsBillError(err, {
      module: 'supabase',
      action: 'fetch_dashboard_data',
      errorType: 'query_failure',
    });
    console.error('Failed to fetch dashboard data from Supabase:', err);
  }

  // Return empty state if no authenticated user is found
  return {
    ...getEmptyDashboardData(dateRange),
    isAuthenticated: false,
    hasOrganization: false,
  };
}

/**
 * Returns clean empty dashboard structure when database is empty
 */
export function getEmptyDashboardData(dateRange: DateRange): DashboardData {
  const emptyOrg: Organization = {
    id: '',
    name: 'My Organization',
    country: 'India',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    invoice_prefix: 'INV',
    invoice_sequence: 1,
    created_at: new Date().toISOString(),
  };

  const emptyMetrics: DashboardSummaryMetrics = {
    totalSales: 0,
    totalSalesCount: 0,
    outstanding: 0,
    outstandingCount: 0,
    overdue: 0,
    overdueCount: 0,
    collected: 0,
    collectedCount: 0,
    comparisonPeriod: {
      salesChangePercent: 0,
      collectedChangePercent: 0,
    },
  };

  const emptyInsights: QuickInsightsData = {
    overdueInvoicesCount: 0,
    customersNeedingFollowupCount: 0,
    lowStockProductsCount: 0,
    lowStockItems: [],
    collectionEfficiencyRate: 0,
  };

  return {
    organization: emptyOrg,
    gstProfile: null,
    metrics: emptyMetrics,
    salesTrend: [],
    collectionQueue: [],
    recentInvoices: [],
    recentPayments: [],
    quickInsights: emptyInsights,
    customers: [],
    products: [],
    dataSource: 'supabase_live',
    isAuthenticated: false,
    hasOrganization: false,
  };
}

/**
 * Executes real Supabase queries respecting RLS and authenticated context
 */
async function fetchFromSupabase(
  supabase: any,
  user: { id: string },
  dateRange: DateRange
): Promise<DashboardData> {
  // 1. Determine user's active organization via organization_members
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (memberError) {
    throw new Error(`Failed to query organization membership: ${memberError.message}`);
  }

  if (!memberData?.organization_id) {
    return {
      ...getEmptyDashboardData(dateRange),
      isAuthenticated: true,
      hasOrganization: false,
    };
  }

  const orgId = memberData.organization_id;

  // 2. Parallel fetch organization details, GST profile, customers, products, invoices, and payments
  const [
    orgRes,
    gstRes,
    customersRes,
    productsRes,
    invoicesRes,
    paymentsRes,
  ] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('gst_profiles').select('*').eq('organization_id', orgId).limit(1).maybeSingle(),
    supabase.from('customers').select('*').eq('organization_id', orgId),
    supabase.from('products').select('*').eq('organization_id', orgId),
    supabase.from('invoices').select('*').eq('organization_id', orgId),
    supabase.from('payments').select('*').eq('organization_id', orgId),
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
  const products: Product[] = productsRes.data ?? [];
  const invoices: Invoice[] = invoicesRes.data ?? [];
  const payments: Payment[] = paymentsRes.data ?? [];

  const computed = computeDataFromSets(organization, gstProfile, customers, products, invoices, payments, dateRange);
  return {
    ...computed,
    isAuthenticated: true,
    hasOrganization: true,
  };
}

/**
 * Computes dashboard metrics, collection queue, sales trends, and tables from data sets
 */
function computeDataFromSets(
  organization: Organization,
  gstProfile: GstProfile | null,
  customers: Customer[],
  products: Product[],
  allInvoices: Invoice[],
  allPayments: Payment[],
  dateRange: DateRange
): DashboardData {
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const paymentsByInvoice = new Map<string, number>();
  const paymentsByCustomer = new Map<string, number>();

  allPayments.forEach((p) => {
    if (p.status === 'bounced' || p.status === 'failed' || p.status === 'cancelled') return;

    if (p.invoice_id) {
      paymentsByInvoice.set(
        p.invoice_id,
        (paymentsByInvoice.get(p.invoice_id) || 0) + Number(p.amount)
      );
    }
    if (p.customer_id) {
      paymentsByCustomer.set(
        p.customer_id,
        (paymentsByCustomer.get(p.customer_id) || 0) + Number(p.amount)
      );
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enrichedInvoices: InvoiceWithDetails[] = allInvoices.map((inv) => {
    const cust = customerMap.get(inv.customer_id) || null;
    const paid = paymentsByInvoice.get(inv.id) || 0;
    const balance = Math.max(0, Number(inv.total) - paid);

    let daysOverdue = 0;
    if (inv.due_date) {
      const due = new Date(inv.due_date);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      daysOverdue = diffDays > 0 ? diffDays : 0;
    }

    return {
      ...inv,
      customer: cust,
      amount_paid: paid,
      balance_due: balance,
      days_overdue: daysOverdue,
    };
  });

  const invoicesInPeriod = enrichedInvoices.filter((inv) => {
    return inv.issue_date >= dateRange.startDate && inv.issue_date <= dateRange.endDate;
  });

  const paymentsInPeriod = allPayments.filter((p) => {
    return p.paid_at >= dateRange.startDate && p.paid_at <= dateRange.endDate && p.status === 'completed';
  });

  const validPeriodInvoices = invoicesInPeriod.filter((inv) => inv.status !== 'cancelled');
  const totalSales = validPeriodInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
  const totalSalesCount = validPeriodInvoices.length;

  const activeInvoices = enrichedInvoices.filter((inv) => inv.status !== 'cancelled');
  const totalOutstanding = activeInvoices.reduce((acc, inv) => acc + inv.balance_due, 0);
  const outstandingInvoicesCount = activeInvoices.filter((inv) => inv.balance_due > 0).length;

  const overdueInvoices = activeInvoices.filter((inv) => {
    if (!inv.due_date) return false;
    const due = new Date(inv.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today && inv.balance_due > 0;
  });
  const totalOverdue = overdueInvoices.reduce((acc, inv) => acc + inv.balance_due, 0);
  const overdueCount = overdueInvoices.length;

  const totalCollected = paymentsInPeriod.reduce((acc, p) => acc + Number(p.amount), 0);
  const collectedCount = paymentsInPeriod.length;

  const metrics: DashboardSummaryMetrics = {
    totalSales,
    totalSalesCount,
    outstanding: totalOutstanding,
    outstandingCount: outstandingInvoicesCount,
    overdue: totalOverdue,
    overdueCount,
    collected: totalCollected,
    collectedCount,
  };

  const collectionQueue = buildCollectionQueue(activeInvoices, customerMap, allPayments);

  const recentInvoices = [...enrichedInvoices]
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
    .slice(0, 8);

  const recentPayments: PaymentWithCustomer[] = [...allPayments]
    .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())
    .slice(0, 8)
    .map((p) => {
      const cust = customerMap.get(p.customer_id) || null;
      const inv = p.invoice_id ? allInvoices.find((i) => i.id === p.invoice_id) : null;
      return {
        ...p,
        customer: cust,
        invoice: inv ? { invoice_number: inv.invoice_number } : null,
      };
    });

  const lowStockItems = products
    .filter((p) => Number(p.stock_quantity) <= Number(p.low_stock_threshold))
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock_quantity: p.stock_quantity,
      low_stock_threshold: p.low_stock_threshold,
      unit: p.unit,
    }));

  const quickInsights: QuickInsightsData = {
    overdueInvoicesCount: overdueCount,
    customersNeedingFollowupCount: collectionQueue.length,
    lowStockProductsCount: lowStockItems.length,
    lowStockItems,
    collectionEfficiencyRate: totalSales > 0 ? Math.min(100, Math.round((totalCollected / totalSales) * 100)) : 0,
  };

  return {
    organization,
    gstProfile,
    metrics,
    salesTrend: [],
    collectionQueue,
    recentInvoices,
    recentPayments,
    quickInsights,
    customers,
    products,
  };
}

function buildCollectionQueue(
  activeInvoices: InvoiceWithDetails[],
  customerMap: Map<string, Customer>,
  allPayments: Payment[]
): CollectionQueueItem[] {
  const unpaidInvoices = activeInvoices.filter((inv) => inv.balance_due > 0);

  return unpaidInvoices.map((inv) => {
    const cust = customerMap.get(inv.customer_id);
    const customerName = cust?.name || 'Valued Customer';
    const companyName = cust?.business_name || '';
    const phone = cust?.phone || '';
    const daysOverdue = inv.days_overdue;
    const balance = inv.balance_due;

    const custPayments = allPayments.filter((p) => p.customer_id === inv.customer_id);
    const lastPayment = custPayments.sort(
      (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
    )[0];

    let priority: 'critical' | 'high' | 'medium' | 'normal' = 'normal';
    let suggestedAction = 'Send WhatsApp payment reminder';

    if (daysOverdue > 30 || balance > 100000) {
      priority = 'critical';
      suggestedAction = 'Urgent call + Send formal WhatsApp statement';
    } else if (daysOverdue > 14 || balance > 50000) {
      priority = 'high';
      suggestedAction = 'Send WhatsApp payment reminder with UPI QR link';
    } else if (daysOverdue > 0) {
      priority = 'medium';
      suggestedAction = 'Send friendly WhatsApp payment reminder';
    }

    return {
      id: inv.id,
      invoiceId: inv.id,
      invoiceNumber: inv.invoice_number,
      customerId: inv.customer_id,
      customerName,
      companyName,
      phone,
      outstandingAmount: balance,
      totalAmount: Number(inv.total),
      daysOverdue,
      dueDate: inv.due_date || null,
      suggestedAction,
      priority,
      lastPaymentDate: lastPayment ? lastPayment.paid_at : null,
      creditLimit: cust?.credit_limit || null,
    };
  });
}

/**
 * Adds a new customer to Supabase with organization isolation and duplicate detection
 */
export async function addNewCustomer(params: {
  name: string;
  businessName?: string;
  companyName?: string;
  phone: string;
  whatsappPhone?: string;
  email?: string;
  gstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  creditLimit?: number;
  creditDays?: number;
  paymentTermsDays?: number;
  notes?: string;
  isActive?: boolean;
  allowDuplicate?: boolean;
}) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to your account to add a customer.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const orgId = memberData.organization_id;

  const trimmedBusiness = (params.businessName || params.companyName)?.trim() || '';
  const trimmedName = params.name?.trim() || '';
  const primaryName = trimmedBusiness || trimmedName;
  const secondaryName = trimmedName || trimmedBusiness;

  if (!primaryName) {
    throw new Error('Customer or Business Name is required.');
  }

  const trimmedPhone = params.phone?.trim() || '';
  if (!trimmedPhone) {
    throw new Error('Primary Phone number is required.');
  }

  const cleanPhone = trimmedPhone.replace(/[\s\-\(\)]/g, '');
  if (cleanPhone.length < 7) {
    throw new Error('Please enter a valid phone number.');
  }

  const trimmedEmail = params.email?.trim() || null;
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const trimmedGstin = params.gstin?.trim().toUpperCase() || null;
  if (trimmedGstin) {
    if (trimmedGstin.length !== 15) {
      throw new Error('GSTIN must be exactly 15 characters.');
    }
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(trimmedGstin)) {
      throw new Error('Invalid GSTIN format. Example: 27AABCU9603R1ZM');
    }
  }

  const creditLimit = params.creditLimit !== undefined ? Math.max(0, Number(params.creditLimit)) : 0;
  if (isNaN(creditLimit)) {
    throw new Error('Credit limit must be a valid non-negative number.');
  }

  const creditDays = params.creditDays ?? params.paymentTermsDays ?? 0;
  if (isNaN(creditDays) || creditDays < 0 || creditDays > 365) {
    throw new Error('Credit days must be between 0 and 365.');
  }

  // Duplicate Check scoped to organization
  if (!params.allowDuplicate) {
    const { data: existingMatches } = await client
      .from('customers')
      .select('id, name, business_name, phone, gstin')
      .eq('organization_id', orgId)
      .or(`phone.eq.${cleanPhone}${trimmedGstin ? `,gstin.eq.${trimmedGstin}` : ''}`);

    if (existingMatches && existingMatches.length > 0) {
      const match = existingMatches[0];
      const matchName = match.business_name || match.name;
      throw new Error(`A customer with phone (${match.phone}) or GSTIN (${match.gstin || 'N/A'}) already exists in your organization ("${matchName}").`);
    }
  }

  const { data, error } = await client.from('customers').insert({
    organization_id: orgId,
    name: secondaryName,
    business_name: primaryName,
    phone: cleanPhone,
    whatsapp_phone: params.whatsappPhone?.trim() || null,
    email: trimmedEmail,
    gstin: trimmedGstin,
    billing_address: params.billingAddress?.trim() || 'N/A',
    shipping_address: params.shippingAddress?.trim() || null,
    credit_limit: creditLimit,
    credit_days: creditDays,
    notes: params.notes?.trim() || null,
    is_active: params.isActive !== undefined ? params.isActive : true,
  }).select().single();

  if (error) throw error;
  return data;
}

/**
 * Updates an existing customer profile in Supabase
 */
export async function updateCustomer(
  customerId: string,
  params: {
    name: string;
    businessName?: string | null;
    phone: string;
    whatsappPhone?: string | null;
    email?: string | null;
    gstin?: string | null;
    billingAddress?: string;
    shippingAddress?: string | null;
    creditLimit?: number;
    creditDays?: number;
    notes?: string | null;
    isActive?: boolean;
  }
) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to your account to update customer details.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const orgId = memberData.organization_id;

  const trimmedBusiness = params.businessName?.trim() || '';
  const trimmedName = params.name?.trim() || '';
  const primaryName = trimmedBusiness || trimmedName;
  const secondaryName = trimmedName || trimmedBusiness;

  if (!primaryName) {
    throw new Error('Customer or Business Name is required.');
  }

  const trimmedPhone = params.phone?.trim() || '';
  if (!trimmedPhone) {
    throw new Error('Primary Phone number is required.');
  }

  const cleanPhone = trimmedPhone.replace(/[\s\-\(\)]/g, '');
  if (cleanPhone.length < 7) {
    throw new Error('Please enter a valid phone number.');
  }

  const trimmedEmail = params.email !== undefined ? (params.email?.trim() || null) : undefined;
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const trimmedGstin = params.gstin !== undefined ? (params.gstin?.trim().toUpperCase() || null) : undefined;
  if (trimmedGstin) {
    if (trimmedGstin.length !== 15) {
      throw new Error('GSTIN must be exactly 15 characters.');
    }
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(trimmedGstin)) {
      throw new Error('Invalid GSTIN format. Example: 27AABCU9603R1ZM');
    }
  }

  const creditLimit = params.creditLimit !== undefined ? Math.max(0, Number(params.creditLimit)) : undefined;
  const creditDays = params.creditDays !== undefined ? Math.max(0, Number(params.creditDays)) : undefined;

  const payload: any = {
    name: secondaryName,
    business_name: primaryName,
    phone: cleanPhone,
    whatsapp_phone: params.whatsappPhone !== undefined ? (params.whatsappPhone?.trim() || null) : undefined,
    email: trimmedEmail,
    gstin: trimmedGstin,
    billing_address: params.billingAddress !== undefined ? (params.billingAddress?.trim() || 'N/A') : undefined,
    shipping_address: params.shippingAddress !== undefined ? (params.shippingAddress?.trim() || null) : undefined,
    credit_limit: creditLimit,
    credit_days: creditDays,
    notes: params.notes !== undefined ? (params.notes?.trim() || null) : undefined,
  };

  if (params.isActive !== undefined) {
    payload.is_active = params.isActive;
  }

  // Clean undefined keys
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  const { data, error } = await client
    .from('customers')
    .update(payload)
    .eq('id', customerId)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Safely deletes or archives a customer record based on invoice and payment associations
 */
export async function deleteCustomer(customerId: string) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to delete a customer.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const orgId = memberData.organization_id;

  // 1. Check if customer has associated invoices
  const { count: invCount } = await client
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('organization_id', orgId);

  // 2. Check if customer has associated payments
  const { count: payCount } = await client
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('organization_id', orgId);

  const totalRecords = (invCount || 0) + (payCount || 0);

  if (totalRecords > 0) {
    // Has financial history: archive by marking is_active = false to preserve GST & payment audit trail
    const { error: updateError } = await client
      .from('customers')
      .update({ is_active: false })
      .eq('id', customerId)
      .eq('organization_id', orgId);

    if (updateError) throw updateError;
    return {
      archived: true,
      message: 'Customer has existing financial history (invoices/payments) and was marked Inactive to preserve audit trails.',
    };
  }

  // No financial history: delete record permanently
  const { error } = await client
    .from('customers')
    .delete()
    .eq('id', customerId)
    .eq('organization_id', orgId);

  if (error) throw error;
  return { deleted: true, message: 'Customer record successfully deleted.' };
}

/**
 * Adds a new product catalog item to Supabase with organization isolation and SKU uniqueness check
 */
export async function addNewProduct(params: {
  name: string;
  sku?: string;
  barcode?: string;
  hsnSac?: string;
  hsnCode?: string;
  unit?: string;
  unitPrice?: number;
  sellingPrice?: number;
  purchasePrice?: number;
  costPrice?: number;
  gstRate?: number;
  taxRate?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  reorderLevel?: number;
  isActive?: boolean;
}) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to your account to add a product.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const orgId = memberData.organization_id;

  const trimmedName = params.name?.trim() || '';
  if (!trimmedName) {
    throw new Error('Product name is required.');
  }

  const sellingPrice = params.sellingPrice ?? params.unitPrice ?? 0;
  if (isNaN(sellingPrice) || sellingPrice < 0) {
    throw new Error('Selling price must be a non-negative number.');
  }

  const purchasePrice = params.purchasePrice ?? params.costPrice ?? 0;
  if (isNaN(purchasePrice) || purchasePrice < 0) {
    throw new Error('Purchase price/cost must be a non-negative number.');
  }

  const taxRate = params.taxRate ?? params.gstRate ?? 0;
  if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new Error('GST / Tax rate must be between 0% and 100%.');
  }

  const stockQuantity = params.stockQuantity ?? 0;
  if (isNaN(stockQuantity) || stockQuantity < 0) {
    throw new Error('Stock quantity cannot be negative.');
  }

  const lowStockThreshold = params.lowStockThreshold ?? params.reorderLevel ?? 10;
  if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
    throw new Error('Low stock threshold must be a non-negative number.');
  }

  const trimmedSku = params.sku?.trim() || null;
  if (trimmedSku) {
    const { data: existingSku } = await client
      .from('products')
      .select('id, name')
      .eq('organization_id', orgId)
      .eq('sku', trimmedSku)
      .limit(1);

    if (existingSku && existingSku.length > 0) {
      throw new Error(`SKU "${trimmedSku}" is already assigned to another product ("${existingSku[0].name}") in your organization.`);
    }
  }

  const { data, error } = await client.from('products').insert({
    organization_id: orgId,
    name: trimmedName,
    sku: trimmedSku,
    barcode: params.barcode?.trim() || null,
    hsn_sac: (params.hsnSac || params.hsnCode)?.trim() || null,
    unit: params.unit?.trim() || 'PCS',
    selling_price: sellingPrice,
    purchase_price: purchasePrice,
    tax_rate: taxRate,
    stock_quantity: 0, // Initial stock set via atomic RPC below
    low_stock_threshold: lowStockThreshold,
    is_active: params.isActive ?? true,
  }).select().single();

  if (error) throw error;

  // Apply opening stock atomically via RPC if > 0
  if (stockQuantity > 0 && data?.id) {
    const { data: updatedProd, error: stockErr } = await client.rpc('adjust_product_stock_atomic', {
      p_product_id: data.id,
      p_adjustment_delta: null,
      p_new_stock_quantity: stockQuantity,
      p_movement_type: 'opening_stock',
      p_note: 'Initial opening stock',
    });

    if (!stockErr && updatedProd) {
      return updatedProd;
    }
  }

  return data;
}

/**
 * Updates an existing product catalog item in Supabase
 */
export async function updateProduct(
  productId: string,
  params: {
    name?: string;
    sku?: string | null;
    barcode?: string | null;
    hsnSac?: string | null;
    unit?: string;
    sellingPrice?: number;
    purchasePrice?: number;
    taxRate?: number;
    stockQuantity?: number;
    lowStockThreshold?: number;
    isActive?: boolean;
  }
) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to update product.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const orgId = memberData.organization_id;

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (params.name !== undefined) {
    const trimmedName = params.name.trim();
    if (!trimmedName) throw new Error('Product name cannot be empty.');
    payload.name = trimmedName;
  }

  if (params.sku !== undefined) {
    const trimmedSku = params.sku ? params.sku.trim() : null;
    if (trimmedSku) {
      const { data: existingSku } = await client
        .from('products')
        .select('id, name')
        .eq('organization_id', orgId)
        .eq('sku', trimmedSku)
        .neq('id', productId)
        .limit(1);

      if (existingSku && existingSku.length > 0) {
        throw new Error(`SKU "${trimmedSku}" is already assigned to product "${existingSku[0].name}".`);
      }
    }
    payload.sku = trimmedSku;
  }

  if (params.barcode !== undefined) payload.barcode = params.barcode ? params.barcode.trim() : null;
  if (params.hsnSac !== undefined) payload.hsn_sac = params.hsnSac ? params.hsnSac.trim() : null;
  if (params.unit !== undefined) payload.unit = params.unit.trim() || 'PCS';

  if (params.sellingPrice !== undefined) {
    const val = Number(params.sellingPrice);
    if (isNaN(val) || val < 0) throw new Error('Selling price must be non-negative.');
    payload.selling_price = val;
  }

  if (params.purchasePrice !== undefined) {
    const val = Number(params.purchasePrice);
    if (isNaN(val) || val < 0) throw new Error('Purchase price must be non-negative.');
    payload.purchase_price = val;
  }

  if (params.taxRate !== undefined) {
    const val = Number(params.taxRate);
    if (isNaN(val) || val < 0 || val > 100) throw new Error('Tax rate must be between 0% and 100%.');
    payload.tax_rate = val;
  }

  let newStockVal: number | undefined;
  if (params.stockQuantity !== undefined) {
    const val = Number(params.stockQuantity);
    if (isNaN(val) || val < 0) throw new Error('Stock quantity cannot be negative.');
    newStockVal = val;
    // stock_quantity is NOT mutated directly via payload, but via RPC below
  }

  if (params.lowStockThreshold !== undefined) {
    const val = Number(params.lowStockThreshold);
    if (isNaN(val) || val < 0) throw new Error('Low stock threshold must be non-negative.');
    payload.low_stock_threshold = val;
  }

  if (params.isActive !== undefined) payload.is_active = params.isActive;

  const { data, error } = await client
    .from('products')
    .update(payload)
    .eq('id', productId)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) throw error;

  // Apply stock quantity change via authoritative RPC
  if (newStockVal !== undefined) {
    const updatedProd = await adjustProductStock(productId, {
      newStockQuantity: newStockVal,
      reason: 'Product record edit',
    });
    return updatedProd || data;
  }

  return data;
}

/**
 * Adjusts stock quantity for a product atomically using database RPC
 */
export async function adjustProductStock(
  productId: string,
  params: {
    newStockQuantity?: number;
    adjustmentDelta?: number;
    reason?: string;
  }
) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to adjust product stock.');
  }

  const { data, error } = await client.rpc('adjust_product_stock_atomic', {
    p_product_id: productId,
    p_adjustment_delta: params.adjustmentDelta ?? null,
    p_new_stock_quantity: params.newStockQuantity ?? null,
    p_movement_type: 'adjustment',
    p_note: params.reason?.trim() || 'Manual stock adjustment',
  });

  if (error) {
    throw new Error(error.message || 'Failed to adjust product stock.');
  }

  return data;
}

/**
 * Safely deletes or archives a product catalog item based on invoice usage
 */
export async function deleteProduct(productId: string) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to delete a product.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const orgId = memberData.organization_id;

  // Check if product is referenced in invoice_items
  const { count } = await client
    .from('invoice_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (count && count > 0) {
    // If referenced in invoices, mark inactive to preserve historical audit trail
    const { error: updateError } = await client
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('organization_id', orgId);

    if (updateError) throw updateError;
    return {
      archived: true,
      message: 'Product is referenced in existing invoices and has been marked Inactive to preserve GST financial audit trail.',
    };
  }

  const { error } = await client
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('organization_id', orgId);

  if (error) throw error;
  return { deleted: true, message: 'Product successfully deleted from catalog.' };
}

/**
 * Fetches real sales usage and invoice line items for a specific product
 */
export async function fetchProductSalesUsage(productId: string) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) return { totalUnitsSold: 0, totalRevenue: 0, invoiceCount: 0, sales: [] };

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) return { totalUnitsSold: 0, totalRevenue: 0, invoiceCount: 0, sales: [] };

  const { data: items, error } = await client
    .from('invoice_items')
    .select(`
      id,
      invoice_id,
      description,
      quantity,
      unit,
      unit_price,
      discount,
      tax_rate,
      line_total,
      invoices:invoice_id (
        id,
        invoice_number,
        issue_date,
        due_date,
        status,
        customer_id,
        customers:customer_id (
          id,
          name,
          business_name
        )
      )
    `)
    .eq('product_id', productId);

  if (error || !items) {
    return { totalUnitsSold: 0, totalRevenue: 0, invoiceCount: 0, sales: [] };
  }

  let totalUnitsSold = 0;
  let totalRevenue = 0;
  const uniqueInvoices = new Set<string>();

  const sales = items.map((item: any) => {
    const inv = item.invoices || {};
    const cust = inv.customers || {};
    const qty = Number(item.quantity) || 0;
    const lineTot = Number(item.line_total) || 0;

    totalUnitsSold += qty;
    totalRevenue += lineTot;
    if (inv.id) uniqueInvoices.add(inv.id);

    return {
      itemId: item.id,
      invoiceId: inv.id || item.invoice_id,
      invoiceNumber: inv.invoice_number || 'INV',
      issueDate: inv.issue_date || '',
      dueDate: inv.due_date || '',
      status: inv.status || 'issued',
      customerId: cust.id || inv.customer_id,
      customerName: cust.name || 'Customer',
      customerBusiness: cust.business_name || null,
      quantity: qty,
      unit: item.unit || 'PCS',
      unitPrice: Number(item.unit_price) || 0,
      taxRate: Number(item.tax_rate) || 0,
      lineTotal: lineTot,
    };
  });

  return {
    totalUnitsSold,
    totalRevenue,
    invoiceCount: uniqueInvoices.size,
    sales,
  };
}

/**
 * Fetches the next sequential invoice number preview for the current organization
 */
export async function getNextSequentialInvoiceNumber(): Promise<string> {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();
  if (!authData?.user) return 'INV-0001';

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) return 'INV-0001';

  const { data: orgData } = await client
    .from('organizations')
    .select('invoice_prefix, invoice_sequence')
    .eq('id', memberData.organization_id)
    .single();

  const prefix = orgData?.invoice_prefix || 'INV';
  const nextSeq = (orgData?.invoice_sequence ?? 0) + 1;
  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Fetches line items for a specific invoice from Supabase
 */
export async function fetchInvoiceItems(invoiceId: string): Promise<any[]> {
  const client = createBrowserClient();
  const { data, error } = await client
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching invoice line items:', error);
    return [];
  }
  return data || [];
}

/**
 * Updates an invoice's status in Supabase
 */
export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();
  if (!authData?.user) throw new Error('Please sign in to update invoice.');

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) throw new Error('No active organization found.');

  const { data, error } = await client
    .from('invoices')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('organization_id', memberData.organization_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cancels an invoice in Supabase and atomically restores deducted product stock
 */
export async function cancelInvoice(invoiceId: string) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();
  if (!authData?.user) throw new Error('Please sign in to cancel invoice.');

  const { data, error } = await client.rpc('cancel_invoice_atomic', {
    p_invoice_id: invoiceId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to cancel invoice.');
  }

  return data;
}

/**
 * Deletes a draft or cancelled invoice and its line items in Supabase
 */
export async function deleteInvoice(invoiceId: string) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();
  if (!authData?.user) throw new Error('Please sign in to delete invoice.');

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) throw new Error('No active organization found.');

  // Delete line items first
  await client
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);

  const { error } = await client
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('organization_id', memberData.organization_id);

  if (error) throw error;
  return true;
}

/**
 * Creates a new B2B invoice in Supabase
 */
export async function createNewInvoice(params: {
  customerId: string;
  issueDate?: string;
  invoiceDate?: string;
  dueDate: string;
  invoiceNumber?: string;
  invoiceType?: string;
  status?: InvoiceStatus;
  placeOfSupply?: string;
  subtotal?: number;
  discountTotal?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  cess?: number;
  totalAmount?: number;
  items?: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    gstRate?: number;
    taxRate?: number;
    unit?: string;
    hsnSac?: string;
    hsnCode?: string;
    taxableAmount?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    cess?: number;
    lineTotal?: number;
  }>;
  notes?: string;
  terms?: string;
}) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to your account to issue an invoice.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  if (!params.items || params.items.length === 0) {
    throw new Error('Invoice must contain at least one line item.');
  }

  const rpcPayload = {
    p_customer_id: params.customerId,
    p_due_date: params.dueDate,
    p_issue_date: params.issueDate || params.invoiceDate || new Date().toISOString().split('T')[0],
    p_invoice_type: params.invoiceType || 'tax_invoice',
    p_place_of_supply: params.placeOfSupply || null,
    p_notes: params.notes || null,
    p_terms: params.terms || null,
    p_status: params.status || 'issued',
    p_items: params.items.map((it) => ({
      productId: it.productId || null,
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discount: it.discount || 0,
      taxRate: typeof it.taxRate === 'number' ? it.taxRate : (typeof it.gstRate === 'number' ? it.gstRate : 0),
      unit: it.unit || 'PCS',
      hsnSac: it.hsnSac || it.hsnCode || '',
      cess: it.cess || 0,
    })),
    p_custom_invoice_number: params.invoiceNumber?.trim() || null,
  };

  const { data: rpcRes, error: rpcErr } = await client.rpc('create_invoice_with_items', rpcPayload);

  if (rpcErr) {
    throw new Error(rpcErr.message || 'Failed to create invoice.');
  }

  if (!rpcRes || !rpcRes.success || !rpcRes.id) {
    throw new Error('Invoice creation failed on server.');
  }

  const { data: insertedInv, error: fetchErr } = await client
    .from('invoices')
    .select('*')
    .eq('id', rpcRes.id)
    .single();

  if (fetchErr || !insertedInv) {
    throw new Error(fetchErr?.message || 'Invoice created successfully but failed to retrieve record.');
  }

  return insertedInv;
}

/**
 * Records a customer payment settlement in Supabase with full validation,
 * audit logging, invoice status recalculation, and receipt generation.
 */
export async function recordNewPayment(params: {
  customerId: string;
  invoiceId?: string;
  amount: number;
  paidAt?: string;
  paymentDate?: string;
  method?: string;
  paymentMethod?: string;
  reference?: string;
  referenceNumber?: string;
  notes?: string;
  allowOverpayment?: boolean;
}) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('Please sign in to your account to record a payment.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const amount = Number(params.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  const payMethod = (params.method || params.paymentMethod || 'cash').toLowerCase();
  const payReference = params.reference || params.referenceNumber || null;
  const payDate = params.paidAt || params.paymentDate || new Date().toISOString().split('T')[0];

  const rpcPayload = {
    p_customer_id: params.customerId,
    p_amount: amount,
    p_invoice_id: params.invoiceId || null,
    p_method: payMethod,
    p_reference: payReference,
    p_paid_at: payDate,
    p_notes: params.notes || null,
  };

  const { data: rpcRes, error: rpcErr } = await client.rpc('record_payment_with_allocation', rpcPayload);

  if (rpcErr) {
    throw new Error(rpcErr.message || 'Failed to record payment.');
  }

  if (!rpcRes || !rpcRes.success || !rpcRes.payment_id) {
    throw new Error('Payment recording failed on server.');
  }

  const { data: paymentRecord, error: payFetchErr } = await client
    .from('payments')
    .select('*')
    .eq('id', rpcRes.payment_id)
    .single();

  if (payFetchErr || !paymentRecord) {
    throw new Error(payFetchErr?.message || 'Payment recorded successfully but failed to fetch record.');
  }

  const custName = rpcRes.customer_name || 'Customer';
  const invNumber = rpcRes.invoice_number;
  const newOutstanding = Number(rpcRes.new_outstanding || 0);

  const receiptSummary = invNumber
    ? `₹${amount.toLocaleString('en-IN')} ${payMethod.toUpperCase()} payment recorded against ${invNumber} (${custName}). Remaining outstanding: ₹${newOutstanding.toLocaleString('en-IN')}.`
    : `₹${amount.toLocaleString('en-IN')} ${payMethod.toUpperCase()} payment recorded for ${custName}.`;

  return {
    ...paymentRecord,
    invoice_number: invNumber,
    customer_name: custName,
    new_outstanding: newOutstanding,
    receipt_summary: receiptSummary,
  };
}

/**
 * Fetches the timeline/history of payments recorded against a specific invoice
 */
export async function getInvoicePaymentHistory(invoiceId: string) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) return { payments: [], totalPaid: 0, totalAmount: 0, outstanding: 0 };

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) return { payments: [], totalPaid: 0, totalAmount: 0, outstanding: 0 };

  const { data: invoice } = await client
    .from('invoices')
    .select('id, invoice_number, total, status')
    .eq('id', invoiceId)
    .eq('organization_id', memberData.organization_id)
    .single();

  if (!invoice) return { payments: [], totalPaid: 0, totalAmount: 0, outstanding: 0 };

  const { data: rawPayments } = await client
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('organization_id', memberData.organization_id)
    .order('paid_at', { ascending: true });

  const validPayments = (rawPayments || []).filter(
    (p) => !['failed', 'cancelled', 'reversed', 'bounced'].includes(p.status?.toLowerCase())
  );

  const totalPaid = validPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const outstanding = Math.max(0, Number(invoice.total) - totalPaid);

  return {
    payments: validPayments,
    totalPaid,
    totalAmount: Number(invoice.total),
    outstanding,
    invoiceNumber: invoice.invoice_number,
  };
}

/**
 * Parses and processes a merchant WhatsApp natural language payment command
 * Example: "Ramesh ne invoice INV-1045 ka 20 hazaar cash de diya"
 */
export async function processWhatsAppPaymentMessage(message: string) {
  const client = createBrowserClient();
  const { data: authData } = await client.auth.getUser();

  if (!authData?.user) {
    throw new Error('User must be authenticated to execute WhatsApp commands.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No active organization found.');
  }

  const orgId = memberData.organization_id;

  // 1. Natural Language Intent Parsing
  const cleanMsg = message.trim();

  // Extract Invoice Number (e.g. INV-1045, INV1045, inv-1045)
  const invoiceMatch = cleanMsg.match(/INV-?\d+/i);
  const targetInvoiceNum = invoiceMatch ? invoiceMatch[0].toUpperCase().replace(/^INV(\d+)/, 'INV-$1') : null;

  // Extract Amount (e.g. "20 hazaar", "20k", "20000", "₹20,000", "20000 rupees")
  let extractedAmount = 0;
  const hazarMatch = cleanMsg.match(/(\d+(?:\.\d+)?)\s*(?:hazaar|hazar|k|thousand)/i);
  if (hazarMatch) {
    extractedAmount = parseFloat(hazarMatch[1]) * 1000;
  } else {
    const rawNumMatch = cleanMsg.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)/i);
    if (rawNumMatch) {
      extractedAmount = parseFloat(rawNumMatch[1].replace(/,/g, ''));
    }
  }

  // Extract Payment Method
  let method: string = 'cash';
  const lowerMsg = cleanMsg.toLowerCase();
  if (lowerMsg.includes('upi') || lowerMsg.includes('gpay') || lowerMsg.includes('phonepe') || lowerMsg.includes('paytm')) {
    method = 'upi';
  } else if (lowerMsg.includes('bank') || lowerMsg.includes('neft') || lowerMsg.includes('rtgs') || lowerMsg.includes('transfer')) {
    method = 'bank_transfer';
  } else if (lowerMsg.includes('card')) {
    method = 'card';
  } else if (lowerMsg.includes('gateway') || lowerMsg.includes('razorpay')) {
    method = 'payment_gateway';
  } else if (lowerMsg.includes('cheque') || lowerMsg.includes('check')) {
    method = 'cheque';
  } else if (lowerMsg.includes('cash') || lowerMsg.includes('नकद') || lowerMsg.includes('कैश')) {
    method = 'cash';
  }

  const structuredCommand = {
    intent: 'record_payment',
    invoice_number: targetInvoiceNum,
    amount: extractedAmount,
    method: method,
    raw_message: message,
  };

  // 2. Deterministic Business Layer Execution
  if (!targetInvoiceNum && extractedAmount <= 0) {
    return {
      success: false,
      replyText: `❓ Could not recognize invoice or payment amount from: "${message}". Please specify like: "Ramesh ne invoice INV-1045 ka 20 hazaar cash de diya".`,
      command: structuredCommand,
    };
  }

  // Resolve target invoice in Supabase
  let targetInvoice: any = null;
  if (targetInvoiceNum) {
    const { data: inv } = await client
      .from('invoices')
      .select('id, invoice_number, total, customer_id, organization_id, status')
      .eq('organization_id', orgId)
      .ilike('invoice_number', targetInvoiceNum)
      .maybeSingle();

    targetInvoice = inv;
  }

  if (!targetInvoice) {
    // Attempt fuzzy search for unpaid invoices
    const { data: unpaidInvoices } = await client
      .from('invoices')
      .select('id, invoice_number, total, customer_id, organization_id, status')
      .eq('organization_id', orgId)
      .neq('status', 'paid')
      .neq('status', 'cancelled')
      .limit(5);

    if (unpaidInvoices && unpaidInvoices.length > 0) {
      targetInvoice = unpaidInvoices[0];
    }
  }

  if (!targetInvoice) {
    return {
      success: false,
      replyText: `❌ Invoice ${targetInvoiceNum || ''} not found in your active organization ledgers.`,
      command: structuredCommand,
    };
  }

  // Fetch Customer
  const { data: customer } = await client
    .from('customers')
    .select('id, name, business_name')
    .eq('id', targetInvoice.customer_id)
    .single();

  const customerName = customer?.business_name || customer?.name || 'Customer';

  // Execute Payment via Deterministic Service
  try {
    const recorded = await recordNewPayment({
      customerId: targetInvoice.customer_id,
      invoiceId: targetInvoice.id,
      amount: extractedAmount > 0 ? extractedAmount : Number(targetInvoice.total),
      paidAt: new Date().toISOString().split('T')[0],
      method: method,
      notes: `Recorded via ${APP_NAME} AI WhatsApp Assistant: "${message}"`,
    });

    const replyText = `✅ *Payment Recorded Successfully*\n\n` +
      `• *Customer:* ${customerName}\n` +
      `• *Invoice:* ${targetInvoice.invoice_number}\n` +
      `• *Amount Paid:* ₹${recorded.amount.toLocaleString('en-IN')} (${method.toUpperCase()})\n` +
      `• *Remaining Outstanding:* ₹${recorded.new_outstanding.toLocaleString('en-IN')}\n\n` +
      `📄 *Receipt Summary:* ${recorded.receipt_summary}`;

    return {
      success: true,
      replyText,
      command: structuredCommand,
      paymentRecord: recorded,
    };
  } catch (err: any) {
    return {
      success: false,
      replyText: `⚠️ Payment Recording Error: ${err.message || 'Validation failed'}`,
      command: structuredCommand,
    };
  }
}

/**
 * Creates a new organization in Supabase and sets the authenticated user as Owner
 * Executes atomically using the database function create_organization_for_current_user
 * or the dedicated atomic server route, updating public.user_profiles where applicable.
 */
export async function createOrganizationAndOwner(params: {
  name: string;
  legalName?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  displayName?: string;
}) {
  const client = createBrowserClient();
  const { data: authData, error: authErr } = await client.auth.getUser();

  if (authErr || !authData?.user) {
    throw new Error('Please sign in to your account before setting up a workspace.');
  }

  // 1. Try atomic database RPC first if deployed
  try {
    const { data: rpcData, error: rpcError } = await client.rpc('create_organization_for_current_user', {
      p_name: params.name.trim(),
      p_legal_name: params.legalName?.trim() || params.name.trim(),
      p_phone: params.phone?.trim() || null,
      p_email: params.email?.trim() || null,
      p_address_line1: params.addressLine1?.trim() || null,
      p_address_line2: params.addressLine2?.trim() || null,
      p_city: params.city?.trim() || null,
      p_state: params.state?.trim() || null,
      p_state_code: params.stateCode?.trim() || null,
      p_pincode: params.pincode?.trim() || null,
      p_country: params.country?.trim() || 'India',
      p_gstin: params.gstin?.trim().toUpperCase() || null,
      p_display_name: params.displayName?.trim() || null,
    });

    if (!rpcError && rpcData?.success && rpcData?.organization_id) {
      return { id: rpcData.organization_id };
    }
  } catch (rpcErr) {
    console.info('Database RPC unavailable, falling back to atomic server API:', rpcErr);
  }

  // 2. Call the server route with Authorization Bearer header so session is guaranteed even on Safari/Vercel
  const { data: sessionData } = await client.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  let serverApiError: string | null = null;
  try {
    const res = await fetch('/api/onboarding/create-organization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        name: params.name.trim(),
        legalName: params.legalName?.trim() || params.name.trim(),
        phone: params.phone?.trim() || undefined,
        email: params.email?.trim() || undefined,
        addressLine1: params.addressLine1?.trim() || undefined,
        addressLine2: params.addressLine2?.trim() || undefined,
        city: params.city?.trim() || undefined,
        state: params.state?.trim() || undefined,
        stateCode: params.stateCode?.trim() || undefined,
        pincode: params.pincode?.trim() || undefined,
        country: params.country?.trim() || 'India',
        gstin: params.gstin?.trim().toUpperCase() || undefined,
        displayName: params.displayName?.trim() || undefined,
      }),
    });

    const responseData = await res.json().catch(() => null);

    if (res.ok && responseData?.success && responseData?.organizationId) {
      return { id: responseData.organizationId };
    }

    serverApiError = responseData?.error || `Server responded with status ${res.status}`;
  } catch (fetchErr: any) {
    serverApiError = fetchErr?.message || 'Network request failed';
  }

  throw new Error(serverApiError || 'Failed to create workspace. Please check your network and try again.');
}

