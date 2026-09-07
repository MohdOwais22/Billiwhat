'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Download,
  RefreshCw,
  ClockAlert,
  ListOrdered,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import {
  AgeingBucketKey,
  CustomerReceivablesSummary,
  FullCollectionsData,
  ReceivablesInvoiceItem,
  fetchCollectionsData,
  computeCollectionsData,
} from '@/lib/services/collectionsService';
import { CollectionsSummaryCards } from '@/components/collections/CollectionsSummaryCards';
import { AgeingBucketsBar } from '@/components/collections/AgeingBucketsBar';
import { InvoiceCollectionQueue } from '@/components/collections/InvoiceCollectionQueue';
import { CustomerExposureLedger } from '@/components/collections/CustomerExposureLedger';
import { CustomerCollectionDrawer } from '@/components/collections/CustomerCollectionDrawer';
import { exportCollectionsRegisterToCSV } from '@/lib/utils/reportExport';

type ViewMode = 'invoice_queue' | 'customer_exposure';

export function CollectionsPage() {
  const {
    dashboardData,
    organization,
    loadData: reloadDashboardData,
    handleOpenRecordPayment,
    handleQueueWhatsApp,
    setSelectedInvoice,
    setIsInvoiceDetailOpen,
  } = useDashboard();

  const [collectionsData, setCollectionsData] = useState<FullCollectionsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & View State
  const [viewMode, setViewMode] = useState<ViewMode>('invoice_queue');
  const [selectedBucket, setSelectedBucket] = useState<AgeingBucketKey | 'all'>('all');

  // Customer Drawer State
  const [selectedCustomerSummary, setSelectedCustomerSummary] = useState<CustomerReceivablesSummary | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);

  // Load / Compute Collections Data
  const loadCollections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If dashboardData is already present in context, compute instantaneously first
      if (dashboardData && dashboardData.organization) {
        const computed = computeCollectionsData(
          dashboardData.organization,
          dashboardData.customers || [],
          dashboardData.recentInvoices || [],
          dashboardData.recentPayments || []
        );
        setCollectionsData(computed);
      }

      // Also perform authoritative fresh fetch
      const freshData = await fetchCollectionsData();
      setCollectionsData(freshData);
    } catch (err: any) {
      console.error('Failed to load collections data:', err);
      // If we don't have existing computed data, show error
      if (!collectionsData) {
        setError(err?.message || 'Unable to retrieve receivables and debt ageing data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [dashboardData]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleExportRegister = () => {
    if (!collectionsData) return;
    exportCollectionsRegisterToCSV(
      collectionsData.invoiceQueue,
      collectionsData.summary.totalOutstanding
    );
  };

  const handleSelectCustomer = (customerId: string) => {
    if (!collectionsData) return;
    const summary = collectionsData.customerSummaries.find((c) => c.customerId === customerId);
    if (summary) {
      setSelectedCustomerSummary(summary);
      setIsCustomerDrawerOpen(true);
    }
  };

  const handleOpenInvoiceDetailFromQueue = (invoiceId: string) => {
    const inv = dashboardData?.recentInvoices.find((i) => i.id === invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      setIsInvoiceDetailOpen(true);
    }
  };

  const handleOpenWhatsAppFromItem = (item: ReceivablesInvoiceItem) => {
    handleQueueWhatsApp({
      id: item.id,
      invoiceId: item.id,
      invoiceNumber: item.invoiceNumber,
      customerId: item.customerId,
      customerName: item.customerName,
      companyName: item.customerBusinessName,
      phone: item.phone,
      outstandingAmount: item.balanceDue,
      totalAmount: item.total,
      daysOverdue: item.daysOverdue,
      dueDate: item.dueDate,
      suggestedAction: item.suggestedAction,
      priority: item.priority,
    });
  };

  const handleOpenPaymentFromItem = (item: ReceivablesInvoiceItem) => {
    const matchingInv = dashboardData?.recentInvoices.find((i) => i.id === item.id);
    handleOpenRecordPayment(matchingInv, item.customerId, item.balanceDue);
  };

  const handleCustomerSettlement = (customerId: string, balance: number) => {
    handleOpenRecordPayment(undefined, customerId, balance);
  };

  if (isLoading && !collectionsData) {
    return (
      <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6 animate-pulse" id="collections-loading">
        <div className="h-20 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error && !collectionsData) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-xs" id="collections-error">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Failed to Load Collections</h3>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button
          onClick={loadCollections}
          className="mt-4 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-xs cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  if (!collectionsData) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6" id="receivables-collections-page">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Receivables & Collections
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Live Command Center
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time debt ageing, payment follow-up work queue, and customer credit exposure
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenRecordPayment()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-xs cursor-pointer"
            id="collections-record-payment-btn"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={handleExportRegister}
            disabled={collectionsData.invoiceQueue.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            id="collections-export-csv-btn"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              loadCollections();
              reloadDashboardData();
            }}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-2xs cursor-pointer"
            title="Refresh Collections Ledger"
            id="collections-refresh-btn"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <CollectionsSummaryCards summary={collectionsData.summary} />

      {/* Dynamic Ageing Buckets Bar */}
      <AgeingBucketsBar
        ageingBuckets={collectionsData.ageingBuckets}
        totalOutstanding={collectionsData.summary.totalOutstanding}
        selectedBucket={selectedBucket}
        onSelectBucket={setSelectedBucket}
      />

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('invoice_queue')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'invoice_queue'
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            id="view-mode-invoice-queue"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>By Invoice Queue ({collectionsData.invoiceQueue.length})</span>
          </button>

          <button
            onClick={() => setViewMode('customer_exposure')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              viewMode === 'customer_exposure'
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            id="view-mode-customer-exposure"
          >
            <Users className="w-3.5 h-3.5" />
            <span>By Customer Exposure ({collectionsData.customerSummaries.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content: Invoice Queue vs Customer Exposure */}
      {viewMode === 'invoice_queue' ? (
        <InvoiceCollectionQueue
          queue={collectionsData.invoiceQueue}
          selectedBucket={selectedBucket}
          onSelectBucket={setSelectedBucket}
          onOpenWhatsAppModal={handleOpenWhatsAppFromItem}
          onOpenRecordPayment={handleOpenPaymentFromItem}
          onOpenInvoiceDetail={handleOpenInvoiceDetailFromQueue}
          onSelectCustomer={handleSelectCustomer}
        />
      ) : (
        <CustomerExposureLedger
          customerSummaries={collectionsData.customerSummaries}
          selectedBucket={selectedBucket}
          onSelectCustomer={handleSelectCustomer}
          onOpenWhatsAppModal={handleOpenWhatsAppFromItem}
          onOpenRecordPayment={handleOpenPaymentFromItem}
          onOpenCustomerSettlement={handleCustomerSettlement}
          onOpenInvoiceDetail={handleOpenInvoiceDetailFromQueue}
        />
      )}

      {/* Customer Drill-Down Drawer */}
      <CustomerCollectionDrawer
        customerSummary={selectedCustomerSummary}
        organization={organization}
        isOpen={isCustomerDrawerOpen}
        onClose={() => {
          setIsCustomerDrawerOpen(false);
          setSelectedCustomerSummary(null);
        }}
        onOpenRecordPayment={(inv, customerId, amount) => {
          setIsCustomerDrawerOpen(false);
          if (inv) {
            handleOpenPaymentFromItem(inv);
          } else {
            handleOpenRecordPayment(undefined, customerId, amount);
          }
        }}
        onOpenInvoiceDetail={(invoiceId) => {
          setIsCustomerDrawerOpen(false);
          handleOpenInvoiceDetailFromQueue(invoiceId);
        }}
      />
    </div>
  );
}
