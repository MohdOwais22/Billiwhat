'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Download,
  Layers,
  Receipt,
  Scale,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import {
  FullPaymentsData,
  EnrichedPayment,
  fetchPaymentsData,
  computePaymentsData,
} from '@/lib/services/paymentsService';
import { exportPaymentRegisterToCSV } from '@/lib/utils/reportExport';
import { PaymentsSummaryCards } from './PaymentsSummaryCards';
import { PaymentTable } from './PaymentTable';
import { ReconciliationSection } from './ReconciliationSection';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { PaymentDetailModal } from './PaymentDetailModal';
import { AllocatePaymentModal } from './AllocatePaymentModal';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';

export function PaymentsPage() {
  const { dashboardData, loadData } = useDashboard();

  const [paymentsData, setPaymentsData] = useState<FullPaymentsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'all' | 'unallocated' | 'reconciliation'>('all');

  // Modals state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<EnrichedPayment | null>(null);
  const [selectedPaymentForDetail, setSelectedPaymentForDetail] = useState<EnrichedPayment | null>(null);
  const [selectedPaymentForAllocate, setSelectedPaymentForAllocate] = useState<EnrichedPayment | null>(null);

  // Load Payments Data
  const loadPayments = useCallback(async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMsg(null);

      const data = await fetchPaymentsData();
      setPaymentsData(data);
    } catch (err: any) {
      console.error('Failed to load payments data:', err);
      setErrorMsg(err?.message || 'Failed to load payments and reconciliation data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleRefresh = async () => {
    await Promise.all([loadPayments(true), loadData()]);
  };

  const handleRecordPaymentSuccess = async () => {
    setIsRecordPaymentOpen(false);
    await Promise.all([loadPayments(true), loadData()]);
  };

  const handleAllocateSuccess = async () => {
    setSelectedPaymentForAllocate(null);
    await Promise.all([loadPayments(true), loadData()]);
  };

  const handleExportCSV = () => {
    if (!paymentsData) return;
    exportPaymentRegisterToCSV(paymentsData.payments, paymentsData.metrics.totalCollected);
  };

  if (isLoading && !paymentsData) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading Payment Settlements...</p>
      </div>
    );
  }

  if (errorMsg && !paymentsData) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-rose-950">Failed to Load Payments</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMsg}</p>
          <button
            onClick={() => loadPayments()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!paymentsData) return null;

  const { organization, payments, customers, metrics, openInvoicesByCustomer } = paymentsData;

  const unallocatedPayments = payments.filter((p) => !p.invoice_id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" id="payments-page-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Payment Settlements
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Record, track and reconcile customer payments.
              </p>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            id="refresh-payments-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={payments.length === 0}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            id="export-payments-csv-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            id="primary-record-payment-btn"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Record Payment</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <PaymentsSummaryCards
        metrics={metrics}
        onFilterUnallocated={() => setActiveTab('unallocated')}
        onFilterMonth={() => setActiveTab('all')}
      />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="tab-all-payments"
        >
          <Receipt className="w-4 h-4" />
          <span>All Payment Settlements</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('unallocated')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'unallocated'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="tab-unallocated-payments"
        >
          <Layers className="w-4 h-4" />
          <span>Unallocated Advances</span>
          {metrics.unallocatedCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
              {metrics.unallocatedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'reconciliation'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="tab-reconciliation"
        >
          <Scale className="w-4 h-4" />
          <span>Reconciliation Audit</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && (
        <PaymentTable
          payments={payments}
          onViewReceipt={(p) => setSelectedPaymentForReceipt(p)}
          onViewDetail={(p) => setSelectedPaymentForDetail(p)}
          onAllocate={(p) => setSelectedPaymentForAllocate(p)}
          onOpenRecordPayment={() => setIsRecordPaymentOpen(true)}
          initialAllocationFilter="all"
        />
      )}

      {activeTab === 'unallocated' && (
        <PaymentTable
          payments={unallocatedPayments}
          onViewReceipt={(p) => setSelectedPaymentForReceipt(p)}
          onViewDetail={(p) => setSelectedPaymentForDetail(p)}
          onAllocate={(p) => setSelectedPaymentForAllocate(p)}
          onOpenRecordPayment={() => setIsRecordPaymentOpen(true)}
          initialAllocationFilter="unallocated"
        />
      )}

      {activeTab === 'reconciliation' && (
        <ReconciliationSection
          data={paymentsData}
          onViewReceipt={(p) => setSelectedPaymentForReceipt(p)}
          onViewDetail={(p) => setSelectedPaymentForDetail(p)}
          onAllocate={(p) => setSelectedPaymentForAllocate(p)}
        />
      )}

      {/* Modals */}
      {/* 1. Record Payment Modal */}
      {isRecordPaymentOpen && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          onSuccess={handleRecordPaymentSuccess}
          customers={customers}
        />
      )}

      {/* 2. Official Payment Receipt Modal */}
      {selectedPaymentForReceipt && (
        <PaymentReceiptModal
          payment={selectedPaymentForReceipt}
          organization={organization}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}

      {/* 3. Payment Detail Inspector */}
      {selectedPaymentForDetail && (
        <PaymentDetailModal
          payment={selectedPaymentForDetail}
          onClose={() => setSelectedPaymentForDetail(null)}
          onViewReceipt={(p) => setSelectedPaymentForReceipt(p)}
          onAllocate={(p) => setSelectedPaymentForAllocate(p)}
        />
      )}

      {/* 4. Allocate Payment Modal */}
      {selectedPaymentForAllocate && (
        <AllocatePaymentModal
          payment={selectedPaymentForAllocate}
          openInvoices={openInvoicesByCustomer[selectedPaymentForAllocate.customer_id] || []}
          onClose={() => setSelectedPaymentForAllocate(null)}
          onSuccess={handleAllocateSuccess}
        />
      )}
    </div>
  );
}
