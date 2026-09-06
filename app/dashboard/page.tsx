'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
} from '@/types/database';
import { fetchDashboardData, calculateDateRange } from '@/lib/services/dashboardService';
import { Sidebar, NavRoute } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { CollectionQueue } from '@/components/dashboard/CollectionQueue';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { RecentPayments } from '@/components/dashboard/RecentPayments';
import { QuickInsights } from '@/components/dashboard/QuickInsights';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { ModulePlaceholder } from '@/components/placeholder/ModulePlaceholder';

// Modals
import { InvoiceDetailModal } from '@/components/modals/InvoiceDetailModal';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { CreateInvoiceModal } from '@/components/modals/CreateInvoiceModal';
import { AddCustomerModal } from '@/components/modals/AddCustomerModal';
import { AddProductModal } from '@/components/modals/AddProductModal';
import { WhatsAppReminderModal } from '@/components/modals/WhatsAppReminderModal';
import { AuthModal } from '@/components/modals/AuthModal';

import { getSupabaseClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState<NavRoute>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Synchronize route with pathname for nested URLs
  useEffect(() => {
    if (pathname) {
      const slug = pathname.replace('/dashboard', '').replace(/^\//, '');
      if (!slug) {
        setCurrentRoute('dashboard');
      } else if (slug === 'invoices' || slug === 'sales') {
        setCurrentRoute('sales');
      } else if (slug === 'customers') {
        setCurrentRoute('customers');
      } else if (slug === 'inventory' || slug === 'products') {
        setCurrentRoute('inventory');
      } else if (slug === 'receivables') {
        setCurrentRoute('receivables');
      } else if (slug === 'payments') {
        setCurrentRoute('payments');
      } else if (slug === 'reports') {
        setCurrentRoute('reports');
      } else if (slug === 'settings') {
        setCurrentRoute('settings');
      }
    }
  }, [pathname]);

  const handleNavigate = (route: NavRoute) => {
    setCurrentRoute(route);
    if (route === 'dashboard') {
      router.push('/dashboard');
    } else {
      router.push('/dashboard/' + route);
    }
  };

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const dateRange = calculateDateRange(period, customRange);

  // Fetch Dashboard Data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDashboardData(period, customRange);
      if (data.isAuthenticated === false) {
        router.push('/login');
        return;
      }
      if (data.hasOrganization === false) {
        router.push('/onboarding');
        return;
      }
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err?.message || 'Unable to retrieve dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  }, [period, customRange, router]);

  useEffect(() => {
    loadData();

    const client = getSupabaseClient();
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(() => {
        loadData();
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
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

  const availableCustomers = dashboardData?.customers || [];
  const availableProducts = dashboardData?.products || [];

  return (
    <div className="flex h-full min-h-screen bg-slate-50 font-sans antialiased text-slate-900" id="whatsbill-app-root">
      {/* Sidebar Navigation */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={(route) => handleNavigate(route)}
        organization={dashboardData?.organization}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onBackToWebsite={() => {
          router.push('/');
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {currentRoute !== 'dashboard' ? (
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-100 font-semibold text-xs"
              >
                Menu
              </button>
              <span className="font-bold text-slate-900 capitalize">{currentRoute}</span>
            </header>
            <ModulePlaceholder
              route={currentRoute}
              onBackToDashboard={() => handleNavigate('dashboard')}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen" id="dashboard-page-container">
            {/* Top Main Header */}
            <DashboardHeader
              organization={dashboardData?.organization}
              gstProfile={dashboardData?.gstProfile}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              onSearch={(query) => console.log('Global search query:', query)}
              dataSource={dashboardData?.dataSource}
              userEmail={dashboardData?.userEmail}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition disabled:opacity-50 cursor-pointer"
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
                    onNavigateToReceivables={() => setCurrentRoute('receivables')}
                    onNavigateToInventory={() => setCurrentRoute('inventory')}
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
                      onViewAllInvoices={() => setCurrentRoute('sales')}
                    />

                    <RecentPayments
                      payments={dashboardData.recentPayments}
                      onViewAllPayments={() => setCurrentRoute('payments')}
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
                customers={availableCustomers}
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
                customers={availableCustomers}
                products={availableProducts}
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

            {isAuthModalOpen && (
              <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                currentUserEmail={dashboardData?.userEmail}
                isLiveActive={dashboardData?.dataSource === 'supabase_live'}
                onAuthSuccess={loadData}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
