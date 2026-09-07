import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { captureWhatsBillError } from '@/lib/sentry';
import { APP_NAME } from '@/config/brand';
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

    const due = inv.due_date ? new Date(inv.due_date) : new Date(inv.issue_date);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const daysOverdue = diffDays > 0 ? diffDays : 0;

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
    const due = inv.due_date ? new Date(inv.due_date) : new Date(inv.issue_date);
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
      dueDate: inv.due_date || inv.issue_date,
      suggestedAction,
      priority,
      lastPaymentDate: lastPayment ? lastPayment.paid_at : null,
      creditLimit: cust?.credit_limit || null,
    };
  });
}

/**
 * Adds a new customer to Supabase
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

  const { data, error } = await client.from('customers').insert({
    organization_id: memberData.organization_id,
    name: params.name.trim(),
    business_name: (params.businessName || params.companyName)?.trim() || null,
    phone: params.phone.trim(),
    whatsapp_phone: params.whatsappPhone?.trim() || null,
    email: params.email?.trim() || null,
    gstin: params.gstin?.trim().toUpperCase() || null,
    billing_address: params.billingAddress?.trim() || 'N/A',
    shipping_address: params.shippingAddress?.trim() || null,
    credit_limit: params.creditLimit ?? 0,
    credit_days: params.creditDays ?? params.paymentTermsDays ?? 0,
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

  const payload: any = {
    name: params.name.trim(),
    business_name: params.businessName !== undefined ? (params.businessName?.trim() || null) : undefined,
    phone: params.phone.trim(),
    whatsapp_phone: params.whatsappPhone !== undefined ? (params.whatsappPhone?.trim() || null) : undefined,
    email: params.email !== undefined ? (params.email?.trim() || null) : undefined,
    gstin: params.gstin !== undefined ? (params.gstin?.trim().toUpperCase() || null) : undefined,
    billing_address: params.billingAddress !== undefined ? (params.billingAddress?.trim() || 'N/A') : undefined,
    shipping_address: params.shippingAddress !== undefined ? (params.shippingAddress?.trim() || null) : undefined,
    credit_limit: params.creditLimit !== undefined ? Number(params.creditLimit) : undefined,
    credit_days: params.creditDays !== undefined ? Number(params.creditDays) : undefined,
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
    .eq('organization_id', memberData.organization_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Safely deletes or archives a customer record based on invoice associations
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

  // Check if customer has associated invoices
  const { count, error: countError } = await client
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .eq('organization_id', memberData.organization_id);

  if (count && count > 0) {
    // If has invoices, mark as inactive to preserve GST financial audit trail
    const { error: updateError } = await client
      .from('customers')
      .update({ is_active: false })
      .eq('id', customerId)
      .eq('organization_id', memberData.organization_id);

    if (updateError) throw updateError;
    return { archived: true, message: 'Customer has associated invoices and has been marked Inactive to preserve financial audit trail.' };
  }

  const { error } = await client
    .from('customers')
    .delete()
    .eq('id', customerId)
    .eq('organization_id', memberData.organization_id);

  if (error) throw error;
  return { deleted: true, message: 'Customer record successfully deleted.' };
}

/**
 * Adds a new product catalog item to Supabase
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
    throw new Error('Please sign in to your Supabase account to add a product.');
  }

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  const sellingPrice = params.sellingPrice ?? params.unitPrice ?? 0;
  const purchasePrice = params.purchasePrice ?? params.costPrice ?? 0;
  const taxRate = params.taxRate ?? params.gstRate ?? 18;
  const lowStockThreshold = params.lowStockThreshold ?? params.reorderLevel ?? 10;

  const { data, error } = await client.from('products').insert({
    organization_id: memberData.organization_id,
    name: params.name.trim(),
    sku: params.sku?.trim() || null,
    barcode: params.barcode?.trim() || null,
    hsn_sac: (params.hsnSac || params.hsnCode)?.trim() || null,
    unit: params.unit?.trim() || 'PCS',
    selling_price: sellingPrice,
    purchase_price: purchasePrice,
    tax_rate: taxRate,
    stock_quantity: params.stockQuantity ?? 0,
    low_stock_threshold: lowStockThreshold,
    is_active: params.isActive ?? true,
  }).select().single();

  if (error) throw error;
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

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (params.name !== undefined) payload.name = params.name.trim();
  if (params.sku !== undefined) payload.sku = params.sku ? params.sku.trim() : null;
  if (params.barcode !== undefined) payload.barcode = params.barcode ? params.barcode.trim() : null;
  if (params.hsnSac !== undefined) payload.hsn_sac = params.hsnSac ? params.hsnSac.trim() : null;
  if (params.unit !== undefined) payload.unit = params.unit.trim();
  if (params.sellingPrice !== undefined) payload.selling_price = Number(params.sellingPrice);
  if (params.purchasePrice !== undefined) payload.purchase_price = Number(params.purchasePrice);
  if (params.taxRate !== undefined) payload.tax_rate = Number(params.taxRate);
  if (params.stockQuantity !== undefined) payload.stock_quantity = Number(params.stockQuantity);
  if (params.lowStockThreshold !== undefined) payload.low_stock_threshold = Number(params.lowStockThreshold);
  if (params.isActive !== undefined) payload.is_active = params.isActive;

  const { data, error } = await client
    .from('products')
    .update(payload)
    .eq('id', productId)
    .eq('organization_id', memberData.organization_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Adjusts stock quantity for a product (direct set or delta change)
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

  const { data: memberData } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!memberData?.organization_id) {
    throw new Error('No organization found for current user session.');
  }

  // Fetch current product stock
  const { data: currentProd, error: fetchErr } = await client
    .from('products')
    .select('id, stock_quantity')
    .eq('id', productId)
    .eq('organization_id', memberData.organization_id)
    .single();

  if (fetchErr || !currentProd) {
    throw new Error('Product not found or access denied.');
  }

  let finalStock = currentProd.stock_quantity || 0;

  if (params.newStockQuantity !== undefined) {
    finalStock = Math.max(0, Number(params.newStockQuantity));
  } else if (params.adjustmentDelta !== undefined) {
    finalStock = Math.max(0, (currentProd.stock_quantity || 0) + Number(params.adjustmentDelta));
  }

  const { data, error } = await client
    .from('products')
    .update({
      stock_quantity: finalStock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('organization_id', memberData.organization_id)
    .select()
    .single();

  if (error) throw error;
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

  // Check if product is referenced in invoice_items
  const { count, error: countError } = await client
    .from('invoice_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (count && count > 0) {
    // If has line items, deactivate to preserve GST audit trail
    const { error: updateError } = await client
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('organization_id', memberData.organization_id);

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
    .eq('organization_id', memberData.organization_id);

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
 * Cancels an invoice in Supabase
 */
export async function cancelInvoice(invoiceId: string) {
  return updateInvoiceStatus(invoiceId, 'cancelled');
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

  const orgId = memberData.organization_id;

  // Retrieve customer for place of supply validation if needed
  const { data: customer } = await client
    .from('customers')
    .select('id, name, billing_address, gstin')
    .eq('id', params.customerId)
    .eq('organization_id', orgId)
    .single();

  // Retrieve organization for state code comparison
  const { data: orgData } = await client
    .from('organizations')
    .select('invoice_prefix, invoice_sequence, state_code, state')
    .eq('id', orgId)
    .single();

  let subtotal = params.subtotal ?? 0;
  let discountTotal = params.discountTotal ?? 0;
  let taxableAmount = params.taxableAmount ?? (subtotal - discountTotal);
  let cgst = params.cgst ?? 0;
  let sgst = params.sgst ?? 0;
  let igst = params.igst ?? 0;
  let cess = params.cess ?? 0;
  let totalAmount = params.totalAmount;

  // Calculate deterministically from items if items are provided
  if (params.items && params.items.length > 0) {
    let computedSubtotal = 0;
    let computedDiscount = 0;
    let computedTaxable = 0;
    let computedCgst = 0;
    let computedSgst = 0;
    let computedIgst = 0;
    let computedCess = 0;

    params.items.forEach((item) => {
      const rate = item.taxRate ?? item.gstRate ?? 18;
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDisc = item.discount ?? 0;
      const itemTaxable = item.taxableAmount ?? Math.max(0, itemSubtotal - itemDisc);

      computedSubtotal += itemSubtotal;
      computedDiscount += itemDisc;
      computedTaxable += itemTaxable;

      if (item.cgst !== undefined && item.sgst !== undefined) {
        computedCgst += item.cgst;
        computedSgst += item.sgst;
        computedIgst += item.igst ?? 0;
      } else if (item.igst !== undefined && item.igst > 0) {
        computedIgst += item.igst;
      } else {
        // Fallback deterministic tax calculation
        const itemTax = (itemTaxable * rate) / 100;
        computedCgst += itemTax / 2;
        computedSgst += itemTax / 2;
      }

      computedCess += item.cess ?? 0;
    });

    subtotal = computedSubtotal;
    discountTotal = computedDiscount;
    taxableAmount = computedTaxable;
    cgst = params.cgst ?? Math.round(computedCgst * 100) / 100;
    sgst = params.sgst ?? Math.round(computedSgst * 100) / 100;
    igst = params.igst ?? Math.round(computedIgst * 100) / 100;
    cess = params.cess ?? Math.round(computedCess * 100) / 100;

    if (totalAmount === undefined) {
      totalAmount = Math.round(taxableAmount + cgst + sgst + igst + cess);
    }
  }

  const finalTotal = totalAmount ?? Math.round(taxableAmount + cgst + sgst + igst + cess);
  const issueDate = params.issueDate || params.invoiceDate || new Date().toISOString().split('T')[0];
  const invoiceStatus = params.status || 'issued';

  let invNumber = params.invoiceNumber?.trim();
  if (!invNumber) {
    // Concurrency-safe sequential invoice numbering
    const prefix = orgData?.invoice_prefix || 'INV';
    let currentSeq = orgData?.invoice_sequence ?? 0;

    for (let attempt = 0; attempt < 5; attempt++) {
      const nextSeq = currentSeq + 1;
      const { data: updatedOrg } = await client
        .from('organizations')
        .update({ invoice_sequence: nextSeq, updated_at: new Date().toISOString() })
        .eq('id', orgId)
        .eq('invoice_sequence', currentSeq)
        .select('invoice_sequence')
        .maybeSingle();

      if (updatedOrg) {
        invNumber = `${prefix}-${String(nextSeq).padStart(4, '0')}`;
        break;
      }

      // Concurrency conflict: fetch refreshed sequence and retry
      const { data: refOrg } = await client
        .from('organizations')
        .select('invoice_sequence')
        .eq('id', orgId)
        .single();
      currentSeq = refOrg?.invoice_sequence ?? (currentSeq + 1);
    }

    if (!invNumber) {
      invNumber = `${prefix}-${Date.now().toString().slice(-6)}`;
    }
  }

  const { data: invoice, error: invError } = await client
    .from('invoices')
    .insert({
      organization_id: orgId,
      customer_id: params.customerId,
      invoice_number: invNumber,
      invoice_type: params.invoiceType || 'tax_invoice',
      status: invoiceStatus,
      issue_date: issueDate,
      due_date: params.dueDate,
      subtotal,
      discount_total: discountTotal,
      taxable_amount: taxableAmount,
      cgst,
      sgst,
      igst,
      cess,
      total: finalTotal,
      place_of_supply: params.placeOfSupply || null,
      notes: params.notes || null,
      terms: params.terms || null,
      source: 'web',
      created_by: authData.user.id,
    })
    .select()
    .single();

  if (invError) throw invError;

  if (params.items && params.items.length > 0) {
    const lineItems = params.items.map((item, idx) => {
      const itemTaxRate = item.taxRate ?? item.gstRate ?? 18;
      const itemSub = item.quantity * item.unitPrice;
      const itemDisc = item.discount ?? 0;
      const itemTaxable = item.taxableAmount ?? Math.max(0, itemSub - itemDisc);

      let itemCgst = item.cgst;
      let itemSgst = item.sgst;
      let itemIgst = item.igst ?? 0;
      let itemCess = item.cess ?? 0;

      if (itemCgst === undefined || itemSgst === undefined) {
        if (itemIgst > 0) {
          itemCgst = 0;
          itemSgst = 0;
        } else {
          const itemTax = (itemTaxable * itemTaxRate) / 100;
          itemCgst = Math.round((itemTax / 2) * 100) / 100;
          itemSgst = Math.round((itemTax / 2) * 100) / 100;
        }
      }

      const lineTot = item.lineTotal ?? Math.round(itemTaxable + (itemCgst || 0) + (itemSgst || 0) + itemIgst + itemCess);

      return {
        invoice_id: invoice.id,
        product_id: item.productId || null,
        description: item.productName,
        hsn_sac: item.hsnSac || item.hsnCode || null,
        quantity: item.quantity,
        unit: item.unit || 'PCS',
        unit_price: item.unitPrice,
        discount: itemDisc,
        taxable_amount: itemTaxable,
        tax_rate: itemTaxRate,
        cgst: itemCgst || 0,
        sgst: itemSgst || 0,
        igst: itemIgst,
        cess: itemCess,
        line_total: lineTot,
        sort_order: idx,
      };
    });

    await client.from('invoice_items').insert(lineItems);
  }

  return invoice;
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
    throw new Error('Please sign in to your Supabase account to record a payment.');
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

  // Validate positive amount
  const amount = Number(params.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  // Verify customer belongs to this organization
  const { data: customer, error: custError } = await client
    .from('customers')
    .select('id, name, business_name, organization_id')
    .eq('id', params.customerId)
    .eq('organization_id', orgId)
    .single();

  if (custError || !customer) {
    throw new Error('Customer does not exist or does not belong to your organization.');
  }

  let invoiceRecord: any = null;
  let remainingBalance = 0;
  let currentPaidTotal = 0;

  // If invoiceId is provided, verify ownership and check remaining balance
  if (params.invoiceId) {
    const { data: inv, error: invError } = await client
      .from('invoices')
      .select('id, invoice_number, total, customer_id, organization_id, status')
      .eq('id', params.invoiceId)
      .eq('organization_id', orgId)
      .single();

    if (invError || !inv) {
      throw new Error('Invoice not found or does not belong to your organization.');
    }

    invoiceRecord = inv;

    // Fetch existing valid payments for this invoice
    const { data: existingPayments } = await client
      .from('payments')
      .select('amount, status')
      .eq('invoice_id', inv.id)
      .eq('organization_id', orgId);

    const validPayments = (existingPayments || []).filter(
      (p: any) => !['failed', 'cancelled', 'reversed', 'bounced'].includes(p.status?.toLowerCase())
    );

    currentPaidTotal = validPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    remainingBalance = Math.max(0, Number(inv.total) - currentPaidTotal);

    // Validate payment amount against remaining invoice balance
    if (amount > remainingBalance + 0.01 && !params.allowOverpayment) {
      throw new Error(
        `Payment amount (₹${amount.toLocaleString('en-IN')}) exceeds the remaining invoice balance (₹${remainingBalance.toLocaleString('en-IN')}) for invoice ${inv.invoice_number}.`
      );
    }
  }

  const paymentDateStr = params.paidAt || params.paymentDate || new Date().toISOString().split('T')[0];
  const payMethod = (params.method || params.paymentMethod || 'cash') as PaymentMethod;
  const payReference = params.reference || params.referenceNumber || null;

  // Insert payment record into payments table
  const { data: payment, error: payError } = await client
    .from('payments')
    .insert({
      organization_id: orgId,
      customer_id: params.customerId,
      invoice_id: params.invoiceId || null,
      amount: amount,
      paid_at: paymentDateStr,
      method: payMethod,
      reference: payReference,
      status: 'completed',
      metadata: params.notes ? { notes: params.notes } : {},
    })
    .select()
    .single();

  if (payError) throw payError;

  // Update invoice status if associated with an invoice
  let updatedInvoiceStatus = invoiceRecord?.status;
  let newOutstanding = remainingBalance;

  if (invoiceRecord) {
    const newTotalPaid = currentPaidTotal + amount;
    newOutstanding = Math.max(0, Number(invoiceRecord.total) - newTotalPaid);

    if (newOutstanding === 0) {
      updatedInvoiceStatus = 'paid';
    } else if (newTotalPaid > 0) {
      updatedInvoiceStatus = 'partially_paid';
    }

    await client
      .from('invoices')
      .update({
        status: updatedInvoiceStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceRecord.id)
      .eq('organization_id', orgId);
  }

  // Record transaction in audit_logs
  try {
    await client.from('audit_logs').insert({
      organization_id: orgId,
      user_id: authData.user.id,
      action: 'RECORD_PAYMENT',
      entity_type: 'payment',
      entity_id: payment.id,
      details: {
        invoice_id: params.invoiceId || null,
        invoice_number: invoiceRecord?.invoice_number || null,
        customer_id: params.customerId,
        customer_name: customer.business_name || customer.name,
        amount: amount,
        method: payMethod,
        remaining_balance: newOutstanding,
        status: 'completed',
        notes: params.notes || null,
      },
      created_at: new Date().toISOString(),
    });
  } catch (auditErr) {
    console.warn('Audit log write warning:', auditErr);
  }

  const custName = customer.business_name || customer.name;
  const receiptSummary = invoiceRecord
    ? `₹${amount.toLocaleString('en-IN')} ${payMethod.toUpperCase()} payment recorded against ${invoiceRecord.invoice_number} (${custName}). Remaining outstanding: ₹${newOutstanding.toLocaleString('en-IN')}.`
    : `₹${amount.toLocaleString('en-IN')} ${payMethod.toUpperCase()} payment recorded for ${custName}.`;

  return {
    ...payment,
    invoice_number: invoiceRecord?.invoice_number,
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

