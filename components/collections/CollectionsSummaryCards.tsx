'use client';

import React from 'react';
import {
  ClockAlert,
  CreditCard,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Users,
  Percent,
} from 'lucide-react';
import { ReceivablesMetricsSummary } from '@/lib/services/collectionsService';
import { formatINR } from '@/lib/utils/formatters';

interface CollectionsSummaryCardsProps {
  summary: ReceivablesMetricsSummary;
}

export function CollectionsSummaryCards({ summary }: CollectionsSummaryCardsProps) {
  const overduePercent =
    summary.totalOutstanding > 0
      ? Math.round((summary.overdueAmount / summary.totalOutstanding) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="collections-summary-grid">
      {/* 1. Total Outstanding */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Outstanding
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1 tracking-tight">
              {formatINR(summary.totalOutstanding)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ClockAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{summary.activeDebtorsCount} credit parties</span>
          </div>
          <span className="font-semibold text-slate-300">
            {summary.openInvoicesCount} open bills
          </span>
        </div>
      </div>

      {/* 2. Overdue Receivables */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Overdue Debt
              </span>
              {overduePercent > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100">
                  {overduePercent}% of total
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1 tracking-tight">
              {formatINR(summary.overdueAmount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-rose-600 font-semibold">
            {summary.overdueCount} invoices past due
          </span>
          {summary.criticalAmount > 0 ? (
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
              {formatINR(summary.criticalAmount)} in 60d+
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">No 60d+ debts</span>
          )}
        </div>
      </div>

      {/* 3. Due Today & This Week */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Due Today / This Week
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {formatINR(summary.dueTodayAmount + summary.dueThisWeekAmount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            Due Today:{' '}
            <strong className="text-slate-900">
              {summary.dueTodayCount > 0 ? formatINR(summary.dueTodayAmount) : '₹0'}
            </strong>
          </span>
          <span className="text-slate-500 font-medium">
            {summary.dueThisWeekCount} bills this week
          </span>
        </div>
      </div>

      {/* 4. Collection Efficiency Rate */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Collection Efficiency
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1 tracking-tight flex items-baseline gap-1">
              <span>{summary.collectionRate}%</span>
              <span className="text-xs font-semibold text-slate-500">realized</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            Collected: <strong className="text-emerald-700">{formatINR(summary.totalCollected)}</strong>
          </span>
          <span className="text-slate-400 text-[11px]">
            of {formatINR(summary.totalInvoiced)}
          </span>
        </div>
      </div>
    </div>
  );
}
