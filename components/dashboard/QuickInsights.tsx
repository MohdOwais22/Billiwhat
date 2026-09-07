'use client';

import React from 'react';
import { AlertCircle, Users, Boxes, CheckCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { QuickInsightsData } from '@/types/database';

interface QuickInsightsProps {
  insights: QuickInsightsData;
  onNavigateToReceivables?: () => void;
  onNavigateToInventory?: () => void;
}

export function QuickInsights({
  insights,
  onNavigateToReceivables,
  onNavigateToInventory,
}: QuickInsightsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs" id="quick-insights-section">
      <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
            <CheckCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Operational Insights & Risk Guard
            </h2>
            <p className="text-[11px] text-slate-500">Derived from ledger, aging, and inventory balances</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={onNavigateToReceivables}
          className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 hover:bg-rose-50 transition cursor-pointer flex flex-col justify-between group"
          id="insight-overdue-card"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Overdue Invoices
            </span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold text-rose-950 font-mono">
              {insights.overdueInvoicesCount}
            </span>
            <span className="text-xs text-rose-700 ml-1 font-medium">bills past due</span>
          </div>
          <div className="text-[11px] font-semibold text-rose-800 group-hover:underline flex items-center gap-1">
            <span>Review Aging Bills</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        <div
          onClick={onNavigateToReceivables}
          className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 transition cursor-pointer flex flex-col justify-between group"
          id="insight-followups-card"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Follow-ups Pending
            </span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold text-amber-950 font-mono">
              {insights.customersNeedingFollowupCount}
            </span>
            <span className="text-xs text-amber-700 ml-1 font-medium">credit parties</span>
          </div>
          <div className="text-[11px] font-semibold text-amber-800 group-hover:underline flex items-center gap-1">
            <span>Open Collection Queue</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        <div
          onClick={onNavigateToInventory}
          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 transition cursor-pointer flex flex-col justify-between group"
          id="insight-low-stock-card"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <Boxes className="w-4 h-4 text-slate-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {insights.lowStockProductsCount}
            </span>
            <span className="text-xs text-slate-500 ml-1 font-medium">SKUs near zero</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-700 group-hover:underline flex items-center gap-1">
            <span>Manage Inventory</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        <div
          className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 flex flex-col justify-between"
          id="insight-efficiency-card"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Collection Recovery
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold text-emerald-950 font-mono">
              {insights.collectionEfficiencyRate}%
            </span>
            <span className="text-xs text-emerald-700 ml-1 font-medium">settlement rate</span>
          </div>
          <div className="text-[11px] font-medium text-emerald-800">
            Healthy credit discipline
          </div>
        </div>
      </div>

      {insights.lowStockItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Items Requiring Urgent Reorder:
          </p>
          <div className="flex flex-wrap gap-2">
            {insights.lowStockItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-xs font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                <span>{item.name}:</span>
                <span className="font-bold font-mono text-rose-950">
                  {item.stock_quantity} {item.unit || 'units'}
                </span>
                <span className="text-[10px] text-rose-600">(min {item.low_stock_threshold})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
