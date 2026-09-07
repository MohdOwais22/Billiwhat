'use client';

import React from 'react';
import { PaymentSummaryMetrics } from '@/lib/services/paymentsService';
import { formatINR } from '@/lib/utils/formatters';
import {
  Banknote,
  Calendar,
  AlertCircle,
  ClockAlert,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  QrCode,
  Building,
} from 'lucide-react';

interface PaymentsSummaryCardsProps {
  metrics: PaymentSummaryMetrics;
  onFilterUnallocated?: () => void;
  onFilterMonth?: () => void;
}

export function PaymentsSummaryCards({
  metrics,
  onFilterUnallocated,
  onFilterMonth,
}: PaymentsSummaryCardsProps) {
  return (
    <div className="space-y-4" id="payments-summary-section">
      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Total Collected */}
        <div
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between"
          id="metric-total-collected"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatINR(metrics.totalCollected)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{metrics.totalPaymentsCount}</span>
              <span>total completed transactions</span>
            </div>
          </div>
        </div>

        {/* 2. Payments This Month */}
        <div
          onClick={onFilterMonth}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition cursor-pointer"
          id="metric-payments-this-month"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Collected This Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatINR(metrics.paymentsThisMonth)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{metrics.paymentsThisMonthCount}</span>
              <span>payments in current calendar cycle</span>
            </div>
          </div>
        </div>

        {/* 3. Unallocated Payments */}
        <div
          onClick={onFilterUnallocated}
          className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between transition cursor-pointer ${
            metrics.unallocatedCount > 0
              ? 'border-amber-200/90 bg-amber-50/20 hover:border-amber-300'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
          id="metric-unallocated-payments"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unallocated Advances
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                metrics.unallocatedCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <ClockAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatINR(metrics.unallocatedAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span
                className={`font-semibold ${
                  metrics.unallocatedCount > 0 ? 'text-amber-700' : 'text-slate-700'
                }`}
              >
                {metrics.unallocatedCount} unlinked deposits
              </span>
              <span>to reconcile</span>
            </div>
          </div>
        </div>

        {/* 4. Failed / Bounced Payments */}
        <div
          className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between ${
            metrics.failedCount > 0
              ? 'border-rose-200 bg-rose-50/20'
              : 'border-slate-200/80'
          }`}
          id="metric-failed-payments"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Failed / Bounced
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                metrics.failedCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatINR(metrics.failedAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span
                className={`font-semibold ${
                  metrics.failedCount > 0 ? 'text-rose-700' : 'text-slate-700'
                }`}
              >
                {metrics.failedCount} recorded failures
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Channels Mini Breakdown */}
      <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <span>Payment Channel Breakdown:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-slate-500 font-sans">UPI:</span>
            <span className="font-bold text-slate-800">{formatINR(metrics.upiAmount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-500 font-sans">Bank:</span>
            <span className="font-bold text-slate-800">{formatINR(metrics.bankTransferAmount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-500 font-sans">Cash:</span>
            <span className="font-bold text-slate-800">{formatINR(metrics.cashAmount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-slate-500 font-sans">Card & Other:</span>
            <span className="font-bold text-slate-800">{formatINR(metrics.cardAmount + metrics.otherAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
