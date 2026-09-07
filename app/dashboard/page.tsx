'use client';

import React from 'react';
import { ReceiptText, CreditCard, ClockAlert, BarChart3 } from 'lucide-react';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { CollectionQueue } from '@/components/dashboard/CollectionQueue';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { RecentPayments } from '@/components/dashboard/RecentPayments';
import { QuickInsights } from '@/components/dashboard/QuickInsights';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { ModulePlaceholder } from '@/components/placeholder/ModulePlaceholder';
import { SettingsView } from '@/components/settings/SettingsView';
import { InvoicesPage } from '@/components/invoices/InvoicesPage';
import { useDashboard } from '@/context/DashboardContext';
import { calculateDateRange } from '@/lib/services/dashboardService';

export default function DashboardPage() {
  const {
    currentRoute,
    handleNavigate,
    period,
    customRange,
    handlePeriodChange,
    dashboardData,
    isLoading,
    error,
    loadData,
    setIsCreateInvoiceOpen,
    setIsAddCustomerOpen,
    setIsAddProductOpen,
    handleOpenRecordPayment,
    handleQueueWhatsApp,
    setSelectedInvoice,
    setIsInvoiceDetailOpen,
  } = useDashboard();

  const dateRange = calculateDateRange(period, customRange);

  if (currentRoute === 'settings') {
    return (
      <SettingsView
        onBackToDashboard={() => handleNavigate('dashboard')}
      />
    );
  }

  if (currentRoute === 'sales') {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" id="invoices-sales-view-wrapper">
        <InvoicesPage />
      </div>
    );
  }

  if (currentRoute !== 'dashboard') {
    return (
      <ModulePlaceholder
        route={currentRoute}
        onBackToDashboard={() => handleNavigate('dashboard')}
      />
    );
  }

  const handleSelectInvoice = (invoiceId: string) => {
    const inv = dashboardData?.recentInvoices.find((i) => i.id === invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      setIsInvoiceDetailOpen(true);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6" id="dashboard-page-container">
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
            onCreateInvoice={() => setIsCreateInvoiceOpen(true)}
            onRecordPayment={() => handleOpenRecordPayment()}
            onAddCustomer={() => setIsAddCustomerOpen(true)}
            onAddProduct={() => setIsAddProductOpen(true)}
          />

          {/* Period Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Financial Performance & Receivables</h2>
              <p className="text-xs text-slate-500">Live GST billing, collection queue, and cashflow ledger</p>
            </div>
            <PeriodFilter
              selectedPeriod={period}
              currentDateRange={dateRange}
              onPeriodChange={handlePeriodChange}
              isLoading={isLoading}
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              id="metric-sales"
              title="Total B2B Sales"
              amount={dashboardData.metrics.totalSales}
              countLabel="Invoices"
              countValue={dashboardData.metrics.totalSalesCount}
              icon={ReceiptText}
              variant="primary"
              trendPercent={dashboardData.metrics.comparisonPeriod?.salesChangePercent}
              trendLabel="vs last period"
            />
            <MetricCard
              id="metric-collected"
              title="Collections Received"
              amount={dashboardData.metrics.collected}
              countLabel="Payments"
              countValue={dashboardData.metrics.collectedCount}
              icon={CreditCard}
              variant="success"
              trendPercent={dashboardData.metrics.comparisonPeriod?.collectedChangePercent}
              trendLabel="vs last period"
            />
            <MetricCard
              id="metric-overdue"
              title="Overdue Receivables"
              amount={dashboardData.metrics.overdue}
              countLabel="Overdue"
              countValue={dashboardData.metrics.overdueCount}
              icon={ClockAlert}
              variant="danger"
            />
            <MetricCard
              id="metric-outstanding"
              title="Total Outstanding"
              amount={dashboardData.metrics.outstanding}
              countLabel="Pending"
              countValue={dashboardData.metrics.outstandingCount}
              icon={BarChart3}
              variant="warning"
            />
          </div>

          {/* Sales Trend Chart & Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SalesTrendChart
                data={dashboardData.salesTrend || []}
                totalSalesInPeriod={dashboardData.metrics.totalSales}
                totalCollectedInPeriod={dashboardData.metrics.collected}
              />
            </div>
            <div>
              <QuickInsights
                insights={
                  dashboardData.quickInsights || {
                    overdueInvoicesCount: 0,
                    customersNeedingFollowupCount: 0,
                    lowStockProductsCount: 0,
                    lowStockItems: [],
                    collectionEfficiencyRate: 100,
                  }
                }
                onNavigateToReceivables={() => handleNavigate('receivables')}
                onNavigateToInventory={() => handleNavigate('inventory')}
              />
            </div>
          </div>

          {/* Collection Queue & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CollectionQueue
                items={dashboardData.collectionQueue || []}
                onTriggerWhatsApp={handleQueueWhatsApp}
                onRecordPaymentForQueue={(item) => {
                  const matchingInv = dashboardData?.recentInvoices.find((i) => i.id === item.invoiceId) || null;
                  handleOpenRecordPayment(matchingInv, item.customerId, item.outstandingAmount);
                }}
                onSelectInvoice={handleSelectInvoice}
              />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <RecentInvoices
                invoices={dashboardData.recentInvoices || []}
                onSelectInvoice={handleSelectInvoice}
                onViewAllInvoices={() => handleNavigate('sales')}
              />
              <RecentPayments payments={dashboardData.recentPayments || []} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
