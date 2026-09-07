'use client';

import React from 'react';
import {
  TrendingUp,
  ReceiptText,
  ClockAlert,
  CreditCard,
  Building2,
  FileCheck2,
  AlertCircle,
  PackageX,
  Info,
  Layers,
} from 'lucide-react';
import { FullReportsData } from '@/lib/services/reportsService';
import { formatINR } from '@/lib/utils/formatters';

interface FinancialOverviewTabProps {
  data: FullReportsData;
  onNavigateTab: (tabKey: string) => void;
}

export function FinancialOverviewTab({ data, onNavigateTab }: FinancialOverviewTabProps) {
  const { overview, dateRange, gstProfile, organization } = data;

  const collectionRate =
    overview.totalSales > 0
      ? Math.min(100, Math.round((overview.totalCollected / overview.totalSales) * 100))
      : 0;

  const averageInvoice =
    overview.invoiceCount > 0 ? overview.totalSales / overview.invoiceCount : 0;

  return (
    <div className="space-y-6" id="financial-overview-tab-content">
      {/* Top Banner with Org Context */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {organization.name}
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {dateRange.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Financial ledger overview and GST outward tax analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            GSTIN: <span className="font-mono font-bold text-emerald-400">{organization.gstin || gstProfile?.gstin || 'Not configured'}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            State: <span className="font-semibold text-white">{organization.state || 'India'}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition" id="card-report-total-sales">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            {formatINR(overview.totalSales)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{overview.invoiceCount} invoices issued</span>
            <button
              onClick={() => onNavigateTab('sales')}
              className="font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              View Sales &rarr;
            </button>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition" id="card-report-collected">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            {formatINR(overview.totalCollected)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{collectionRate}% collection rate</span>
            <span className="text-slate-400 font-medium">{dateRange.label}</span>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition" id="card-report-outstanding">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Outstanding
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClockAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">
            {formatINR(overview.totalOutstanding)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Active receivable book</span>
            <button
              onClick={() => onNavigateTab('ageing')}
              className="font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
            >
              Ageing &rarr;
            </button>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition" id="card-report-overdue">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overdue Amount
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-3">
            {formatINR(overview.totalOverdue)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Past payment terms</span>
            <button
              onClick={() => onNavigateTab('ageing')}
              className="font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Inspect &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Honest Purchases & Tax Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Honest Purchases Note Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Purchases & ITC
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                Vendor Catalog
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Total Purchases</h3>
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Purchase data not available yet in current organization database. Outward sales and outward GST are fully active.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Input Tax Credit (ITC) calculations will activate when vendor purchase bills are logged.
          </div>
        </div>

        {/* GST Output Breakdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                GST Outward Tax
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Tax Liability Summary
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('gst')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              Full GST Report &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Taxable Value</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {formatINR(overview.totalTaxable)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Total GST</span>
              <span className="text-base font-bold text-emerald-700 mt-1 block">
                {formatINR(overview.totalTax)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Avg Invoice Value</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {formatINR(averageInvoice)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Total Invoiced</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {formatINR(overview.totalSales)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              {overview.paidInvoiceCount} Fully Paid • {overview.partiallyPaidCount} Partially Paid • {overview.unpaidCount} Unpaid
            </span>
            {overview.cancelledCount > 0 && (
              <span className="text-slate-400">
                ({overview.cancelledCount} cancelled invoices excluded from revenue)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
