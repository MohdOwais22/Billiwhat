export type UserProfile = {
  id: string; // References auth.users.id
  display_name?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type Organization = {
  id: string;
  name: string;
  legal_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  state_code?: string | null;
  pincode?: string | null;
  country?: string | null;
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
  hsn_code?: string | null;
  hsn?: string | null;
  unit?: string | null;
  stock_quantity: number;
  min_stock_alert: number;
  unit_price: number;
  purchase_price?: number | null;
  gst_rate: number;
  tax_rate?: number;
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
  hsn_code?: string | null;
  hsn?: string | null;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  tax_rate?: number;
  tax_amount?: number;
  amount: number;
  total?: number;
  created_at: string;
};

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'payment_gateway' | 'other' | 'cheque';
export type PaymentStatus = 'completed' | 'recorded' | 'cleared' | 'bounced' | 'failed' | 'cancelled' | 'reversed';

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

export type PeriodType = 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type InvoiceWithDetails = Invoice & {
  customer?: Customer | null;
  amount_paid: number;
  balance_due: number;
  days_overdue: number;
};

export type PaymentWithCustomer = Payment & {
  customer?: Customer | null;
  invoice?: {
    invoice_number: string;
  } | null;
};

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'normal';

export type CollectionQueueItem = {
  id: string;
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
  collectionEfficiencyRate: number;
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
  customers: Customer[];
  products: Product[];
  dataSource?: 'supabase_live';
  userEmail?: string;
  isAuthenticated?: boolean;
  hasOrganization?: boolean;
};
