import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  ClockAlert,
  AlertTriangle,
  CheckCircle2,
  ReceiptText,
  CreditCard,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  CollectionQueueItem,
  Customer,
  DashboardData,
  InvoiceWithDetails,
  PeriodType,
  Product,
} from '../../types/database';
import { fetchDashboardData, calculateDateRange } from '../../services/dashboardService';
import { DashboardHeader } from '../layout/DashboardHeader';
import { QuickActions } from './QuickActions';
import { PeriodFilter } from './PeriodFilter';
import { MetricCard } from './MetricCard';
import { SalesTrendChart } from './SalesTrendChart';
import { CollectionQueue } from './CollectionQueue';
import { RecentInvoices } from './RecentInvoices';
import { RecentPayments } from './RecentPayments';
import { QuickInsights } from './QuickInsights';
import { DashboardSkeleton } from '../common/LoadingSkeleton';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';

// Modals
import { InvoiceDetailModal } from '../modals/InvoiceDetailModal';
import { RecordPaymentModal } from '../modals/RecordPaymentModal';
import { CreateInvoiceModal } from '../modals/CreateInvoiceModal';
import { AddCustomerModal } from '../modals/AddCustomerModal';
import { AddProductModal } from '../modals/AddProductModal';
import { WhatsAppReminderModal } from '../modals/WhatsAppReminderModal';
import { SEED_CUSTOMERS, SEED_PRODUCTS } from '../../data/seedData';
import { NavRoute } from '../layout/Sidebar';

interface DashboardPageProps {
  onOpenMobileMenu: () => void;
  onNavigate: (route: NavRoute) => void;
}

export function DashboardPage({ onOpenMobileMenu, onNavigate }: DashboardPageProps) {
  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string } | undefined>();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentInitialInvoice, setPaymentInitialInvoice] = useState<InvoiceWithDetails | null>(null);
  const [paymentInitialCustomerId, setPaymentInitialCustomerId] = useState<string | undefined>();
  const [paymentInitialAmount, setPaymentInitialAmount] = useState<number | undefined>();

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const [whatsAppItem, setWhatsAppItem] = useState<
    CollectionQueueItem | (InvoiceWithDetails & { customerName?: string; outstandingAmount?: number }) | null
  >(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const dateRange = calculateDateRange(period, customRange);

  // Fetch Dashboard Data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDashboardData(period, customRange);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err?.message || 'Unable to retrieve dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  }, [period, customRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePeriodChange = (newPeriod: PeriodType, range?: { startDate: string; endDate: string }) => {
    setPeriod(newPeriod);
    if (range) {
      setCustomRange(range);
    }
  };

  // Quick Action Triggers
  const handleOpenCreateInvoice = () => setIsCreateInvoiceOpen(true);
  const handleOpenAddCustomer = () => setIsAddCustomerOpen(true);
  const handleOpenAddProduct = () => setIsAddProductOpen(true);

  const handleOpenRecordPayment = (inv?: InvoiceWithDetails, customerId?: string, amount?: number) => {
    setPaymentInitialInvoice(inv || null);
    setPaymentInitialCustomerId(customerId);
    setPaymentInitialAmount(amount);
    setIsRecordPaymentOpen(true);
  };

  // Queue item actions
  const handleQueueWhatsApp = (item: CollectionQueueItem) => {
    setWhatsAppItem(item);
    setIsWhatsAppOpen(true);
  };

  const handleQueueRecordPayment = (item: CollectionQueueItem) => {
    const matchingInv = dashboardData?.recentInvoices.find((i) => i.id === item.invoiceId) || null;
    handleOpenRecordPayment(matchingInv, item.customerId, item.outstandingAmount);
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const inv = dashboardData?.recentInvoices.find((i) => i.id === invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      setIsInvoiceDetailOpen(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen" id="dashboard-page-container">
      {/* Top Main Header */}
      <DashboardHeader
        organization={dashboardData?.organization}
        gstProfile={dashboardData?.gstProfile}
        onOpenMobileMenu={onOpenMobileMenu}
        onSearch={(query) => console.log('Global search query:', query)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Loading State */}
        {isLoading && !dashboardData ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState
            title="Failed to Load Financial Ledger"
            message={error}
            onRetry={loadData}
          />
        ) : dashboardData ? (
          <>
            {/* Quick Actions Row */}
            <QuickActions
              onCreateInvoice={handleOpenCreateInvoice}
              onAddCustomer={handleOpenAddCustomer}
              onAddProduct={handleOpenAddProduct}
              onRecordPayment={() => handleOpenRecordPayment()}
            />

            {/* Reporting Period Filter & Refresh Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Executive Financial Overview</span>
                  <button
                    onClick={loadData}
                    disabled={isLoading}
                    title="Refresh data"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition disabled:opacity-50"
                    id="refresh-dashboard-btn"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </h2>
                <p className="text-xs text-slate-500">
                  Calculated from invoices, payments & verified ledger balances
                </p>
              </div>

              <PeriodFilter
                selectedPeriod={period}
                currentDateRange={dateRange}
                onPeriodChange={handlePeriodChange}
                isLoading={isLoading}
              />
            </div>

            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4.5" id="summary-metrics-grid">
              {/* 1. Total Sales */}
              <MetricCard
                id="metric-total-sales"
                title="Total Sales"
                amount={dashboardData.metrics.totalSales}
                countLabel="invoices issued"
                countValue={dashboardData.metrics.totalSalesCount}
                icon={ReceiptText}
                variant="primary"
                trendPercent={dashboardData.metrics.comparisonPeriod?.salesChangePercent}
                trendLabel="vs last month"
                tooltipText="Sum of all issued invoice totals in the selected reporting period (excluding cancelled)"
              />

              {/* 2. Outstanding */}
              <MetricCard
                id="metric-total-outstanding"
                title="Total Outstanding"
                amount={dashboardData.metrics.outstanding}
                countLabel="unpaid invoices"
                countValue={dashboardData.metrics.outstandingCount}
                icon={DollarSign}
                variant="warning"
                tooltipText="Total invoices minus successfully cleared payments across all credit parties"
              />

              {/* 3. Overdue */}
              <MetricCard
                id="metric-total-overdue"
                title="Overdue Debt"
                amount={dashboardData.metrics.overdue}
                countLabel="past due bills"
                countValue={dashboardData.metrics.overdueCount}
                icon={AlertTriangle}
                variant="danger"
                tooltipText="Outstanding balance for invoices whose due date has passed"
              />

              {/* 4. Collected */}
              <MetricCard
                id="metric-total-collected"
                title="Collected (Receipts)"
                amount={dashboardData.metrics.collected}
                countLabel="settlements"
                countValue={dashboardData.metrics.collectedCount}
                icon={CheckCircle2}
                variant="success"
                trendPercent={dashboardData.metrics.comparisonPeriod?.collectedChangePercent}
                trendLabel="vs last month"
                tooltipText="Successful payments recorded via UPI, Bank Transfer, Cash & Cheque in the selected period"
              />
            </div>

            {/* Quick Insights Operational Row */}
            <QuickInsights
              insights={dashboardData.quickInsights}
              onNavigateToReceivables={() => onNavigate('receivables')}
              onNavigateToInventory={() => onNavigate('inventory')}
            />

            {/* Main Middle Row: Sales Trend (Left 60%) & AI Collection Queue (Right 40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <SalesTrendChart
                  data={dashboardData.salesTrend}
                  totalSalesInPeriod={dashboardData.metrics.totalSales}
                  totalCollectedInPeriod={dashboardData.metrics.collected}
                />
              </div>

              <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                <CollectionQueue
                  items={dashboardData.collectionQueue}
                  onTriggerWhatsApp={handleQueueWhatsApp}
                  onRecordPaymentForQueue={handleQueueRecordPayment}
                  onSelectInvoice={handleSelectInvoice}
                />
              </div>
            </div>

            {/* Bottom Row: Recent Invoices & Recent Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentInvoices
                invoices={dashboardData.recentInvoices}
                onSelectInvoice={handleSelectInvoice}
                onViewAllInvoices={() => onNavigate('sales')}
              />

              <RecentPayments
                payments={dashboardData.recentPayments}
                onViewAllPayments={() => onNavigate('payments')}
                onRecordNewPayment={() => handleOpenRecordPayment()}
              />
            </div>
          </>
        ) : null}
      </main>

      {/* Modals & Slide-overs */}
      {isInvoiceDetailOpen && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={isInvoiceDetailOpen}
          onClose={() => {
            setIsInvoiceDetailOpen(false);
            setSelectedInvoice(null);
          }}
          onRecordPayment={(inv) => handleOpenRecordPayment(inv, inv.customer_id, inv.balance_due)}
          onSendWhatsAppReminder={(inv) => {
            setWhatsAppItem(inv);
            setIsWhatsAppOpen(true);
          }}
        />
      )}

      {isRecordPaymentOpen && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => {
            setIsRecordPaymentOpen(false);
            setPaymentInitialInvoice(null);
            setPaymentInitialCustomerId(undefined);
            setPaymentInitialAmount(undefined);
          }}
          onSuccess={loadData}
          customers={SEED_CUSTOMERS}
          initialInvoice={paymentInitialInvoice}
          initialCustomerId={paymentInitialCustomerId}
          initialAmount={paymentInitialAmount}
        />
      )}

      {isCreateInvoiceOpen && (
        <CreateInvoiceModal
          isOpen={isCreateInvoiceOpen}
          onClose={() => setIsCreateInvoiceOpen(false)}
          onSuccess={loadData}
          customers={SEED_CUSTOMERS}
          products={SEED_PRODUCTS}
        />
      )}

      {isAddCustomerOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          onSuccess={loadData}
        />
      )}

      {isAddProductOpen && (
        <AddProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          onSuccess={loadData}
        />
      )}

      {isWhatsAppOpen && (
        <WhatsAppReminderModal
          item={whatsAppItem}
          isOpen={isWhatsAppOpen}
          onClose={() => {
            setIsWhatsAppOpen(false);
            setWhatsAppItem(null);
          }}
          onSent={loadData}
        />
      )}
    </div>
  );
}
