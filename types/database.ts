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
  gstin?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  state_code?: string | null;
  pincode?: string | null;
  country: string;
  currency: string;
  timezone: string;
  invoice_prefix: string;
  invoice_sequence: number;
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
  business_name?: string | null;
  phone: string;
  whatsapp_phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  billing_address: string;
  shipping_address?: string | null;
  credit_limit: number;
  credit_days: number;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type Product = {
  id: string;
  organization_id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  hsn_sac?: string | null;
  unit: string;
  tax_rate: number;
  selling_price: number;
  purchase_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type GstProfile = {
  id: string;
  organization_id: string;
  gstin?: string | null;
  legal_name?: string | null;
  trade_name?: string | null;
  state_code?: string | null;
  registration_type?: string | null;
  place_of_supply?: string | null;
  e_invoice_enabled: boolean;
  e_way_bill_enabled: boolean;
  created_at: string;
  updated_at?: string;
};

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export type Invoice = {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_type: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date?: string | null;
  subtotal: number;
  discount_total: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
  place_of_supply?: string | null;
  notes?: string | null;
  terms?: string | null;
  source: string;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  product_id?: string | null;
  description: string;
  hsn_sac?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  taxable_amount: number;
  tax_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  line_total: number;
  sort_order: number;
  created_at: string;
};

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'payment_gateway' | 'cheque' | 'other';
export type PaymentStatus = 'completed' | 'recorded' | 'bounced' | 'failed' | 'cancelled';

export type Payment = {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_id?: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string | null;
  gateway?: string | null;
  gateway_payment_id?: string | null;
  paid_at: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
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
    low_stock_threshold: number;
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

export type TeamMemberDetails = OrganizationMember & {
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  is_current_user?: boolean;
};

export type SubscriptionPlan = 'free' | 'growth' | 'enterprise';

export type SubscriptionInfo = {
  id?: string;
  plan: SubscriptionPlan;
  plan_name: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  billing_cycle: 'monthly' | 'yearly';
  current_period_end?: string | null;
  max_invoices_per_month: number;
  max_team_members: number;
  current_invoice_count: number;
  current_member_count: number;
};

export type SettingsData = {
  organization: Organization;
  gstProfile?: GstProfile | null;
  userProfile?: UserProfile | null;
  currentUser: {
    id: string;
    email?: string | null;
    phone?: string | null;
    role: OrganizationMember['role'];
  };
  members: TeamMemberDetails[];
  subscription: SubscriptionInfo;
  whatsappConfig?: {
    is_connected: boolean;
    phone_number?: string | null;
    phone_number_id?: string | null;
    waba_id?: string | null;
    webhook_url?: string | null;
    webhook_verified: boolean;
  };
};
