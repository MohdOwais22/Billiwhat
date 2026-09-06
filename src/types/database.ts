export type Organization = {
  id: string;
  name: string;
  legal_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  created_at: string;
  updated_at?: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'accountant' | 'sales_rep' | 'viewer';
  created_at: string;
};

export type Customer = {
  id: string;
  organization_id: string;
  name: string;
  company_name?: string | null;
  phone: string;
  email?: string | null;
  gstin?: string | null;
  billing_address?: string | null;
  credit_limit?: number | null;
  payment_terms_days?: number | null;
  created_at: string;
  updated_at?: string;
};

export type Product = {
  id: string;
  organization_id: string;
  name: string;
  sku?: string | null;
  hsn?: string | null;
  unit?: string | null;
  stock_quantity: number;
  min_stock_alert: number;
  unit_price: number;
  purchase_price?: number | null;
  tax_rate: number; // e.g. 18 for 18% GST
  created_at: string;
  updated_at?: string;
};

export type GstProfile = {
  id: string;
  organization_id: string;
  gstin: string;
  trade_name: string;
  legal_name?: string | null;
  state_code: string;
  is_active: boolean;
  created_at: string;
};

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export type Invoice = {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_total: number;
  total_amount: number;
  status: InvoiceStatus;
  notes?: string | null;
  terms_conditions?: string | null;
  created_at: string;
  updated_at?: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  product_id?: string | null;
  description: string;
  hsn?: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
};

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'cheque';
export type PaymentStatus = 'recorded' | 'cleared' | 'bounced';

export type Payment = {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_id?: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  notes?: string | null;
  status: PaymentStatus;
  created_at: string;
};

export type ReceivableStatus = 'pending' | 'in_followup' | 'disputed' | 'written_off';

export type Receivable = {
  id: string;
  organization_id: string;
  invoice_id: string;
  customer_id: string;
  status: ReceivableStatus;
  assigned_to?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
};

export type Reminder = {
  id: string;
  organization_id: string;
  invoice_id: string;
  customer_id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  scheduled_at: string;
  sent_at?: string | null;
  created_at: string;
};

export type MessageLog = {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_id?: string | null;
  direction: 'inbound' | 'outbound';
  channel: 'whatsapp';
  message_body: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
};

export type AuditLog = {
  id: string;
  organization_id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  organization_id: string;
  plan: 'free' | 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  current_period_end: string;
  created_at: string;
};

// UI & Aggregated Types
export type PeriodType = 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export type DateRange = {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
};

export type InvoiceWithDetails = Invoice & {
  customer?: Customer | null;
  amount_paid: number; // Derived dynamically from payments
  balance_due: number; // Derived dynamically (total_amount - amount_paid)
  days_overdue: number; // Derived: max(0, today - due_date)
};

export type PaymentWithCustomer = Payment & {
  customer?: Customer | null;
  invoice?: {
    invoice_number: string;
  } | null;
};

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'normal';

export type CollectionQueueItem = {
  id: string; // Invoice ID or customer receivable id
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  companyName?: string | null;
  phone: string;
  outstandingAmount: number;
  totalAmount: number;
  daysOverdue: number;
  dueDate: string;
  suggestedAction: string;
  priority: PriorityLevel;
  lastPaymentDate?: string | null;
  creditLimit?: number | null;
};

export type DashboardSummaryMetrics = {
  totalSales: number;
  totalSalesCount: number;
  outstanding: number;
  outstandingCount: number;
  overdue: number;
  overdueCount: number;
  collected: number;
  collectedCount: number;
  comparisonPeriod?: {
    salesChangePercent: number;
    collectedChangePercent: number;
  };
};

export type SalesTrendPoint = {
  date: string;
  label: string;
  sales: number;
  collected: number;
  invoiceCount: number;
};

export type QuickInsightsData = {
  overdueInvoicesCount: number;
  customersNeedingFollowupCount: number;
  lowStockProductsCount: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    stock_quantity: number;
    min_stock_alert: number;
    unit?: string | null;
  }>;
  collectionEfficiencyRate: number; // % of due amount collected in period
};

export type DashboardData = {
  organization: Organization;
  gstProfile?: GstProfile | null;
  metrics: DashboardSummaryMetrics;
  salesTrend: SalesTrendPoint[];
  collectionQueue: CollectionQueueItem[];
  recentInvoices: InvoiceWithDetails[];
  recentPayments: PaymentWithCustomer[];
  quickInsights: QuickInsightsData;
};
