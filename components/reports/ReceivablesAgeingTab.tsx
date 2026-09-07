'use client';

import React, { useState } from 'react';
import {
  ClockAlert,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Building2,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import {
  AgeingCustomerRow,
  FullReportsData,
  ReceivablesAgeingReportData,
} from '@/lib/services/reportsService';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { exportReceivablesAgeingToCSV } from '@/lib/utils/reportExport';

interface ReceivablesAgeingTabProps {
  data: FullReportsData;
}

export function ReceivablesAgeingTab({ data }: ReceivablesAgeingTabProps) {
  const { receivablesAgeing, dateRange } = data;
  const { totalOutstanding, bucketTotals, bucketCounts, customerRows } = receivablesAgeing;

  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRows = customerRows.filter((row) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      row.customerName.toLowerCase().includes(q) ||
      row.businessName?.toLowerCase().includes(q) ||
      row.phone.includes(q) ||
      row.gstin?.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (customerId: string) => {
    setExpandedCustomerId((prev) => (prev === customerId ? null : customerId));
  };

  const handleExportCSV = () => {
    exportReceivablesAgeingToCSV(receivablesAgeing, dateRange.label);
  };

  const getPercent = (amount: number) => {
    if (!totalOutstanding || totalOutstanding === 0) return 0;
    return Math.round((amount / totalOutstanding) * 100);
  };

  return (
    <div className="space-y-6" id="receivables-ageing-tab-content">
      {/* Header & Export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Receivables Ageing Analysis</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              Debt Aging Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic ageing brackets based on agreed credit terms and due dates across active invoices.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={customerRows.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          id="export-ageing-csv-btn"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Ageing CSV</span>
        </button>
      </div>

      {/* Ageing Bucket Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Outstanding */}
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs col-span-2 sm:col-span-1 lg:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Outstanding
          </span>
          <span className="text-lg font-black text-amber-400 mt-1 block">
            {formatINR(totalOutstanding)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block font-medium">
            {customerRows.length} credit parties
          </span>
        </div>

        {/* Current (Not Due) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Current
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
              {getPercent(bucketTotals.current)}%
            </span>
          </div>
          <span className="text-base font-black text-slate-900 mt-1 block">
            {formatINR(bucketTotals.current)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {bucketCounts.current} invoices not due
          </span>
        </div>

        {/* 1 - 30 Days */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
              1–30 Days
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700">
              {getPercent(bucketTotals.days1to30)}%
            </span>
          </div>
          <span className="text-base font-black text-slate-900 mt-1 block">
            {formatINR(bucketTotals.days1to30)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {bucketCounts.days1to30} overdue invoices
          </span>
        </div>

        {/* 31 - 60 Days */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              31–60 Days
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700">
              {getPercent(bucketTotals.days31to60)}%
            </span>
          </div>
          <span className="text-base font-black text-slate-900 mt-1 block">
            {formatINR(bucketTotals.days31to60)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {bucketCounts.days31to60} overdue invoices
          </span>
        </div>

        {/* 61 - 90 Days */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
              61–90 Days
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700">
              {getPercent(bucketTotals.days61to90)}%
            </span>
          </div>
          <span className="text-base font-black text-rose-600 mt-1 block">
            {formatINR(bucketTotals.days61to90)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {bucketCounts.days61to90} overdue invoices
          </span>
        </div>

        {/* 90+ Days */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              90+ Days
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
              {getPercent(bucketTotals.days90Plus)}%
            </span>
          </div>
          <span className="text-base font-black text-rose-700 mt-1 block">
            {formatINR(bucketTotals.days90Plus)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {bucketCounts.days90Plus} overdue invoices
          </span>
        </div>
      </div>

      {/* Customer Ageing Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Customer Ageing Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any customer row to expand and inspect specific overdue invoices.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              id="ageing-search-input"
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50" id="ageing-empty-state">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Outstanding Debts</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              All issued invoices are fully settled or no active balances exist.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3">Customer / Party</th>
                  <th className="py-3 px-3 text-right">Current (Not Due)</th>
                  <th className="py-3 px-3 text-right">1–30 Days</th>
                  <th className="py-3 px-3 text-right">31–60 Days</th>
                  <th className="py-3 px-3 text-right">61–90 Days</th>
                  <th className="py-3 px-3 text-right">90+ Days</th>
                  <th className="py-3 px-3 text-right">Total Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRows.map((row) => {
                  const isExpanded = expandedCustomerId === row.customerId;
                  return (
                    <React.Fragment key={row.customerId}>
                      <tr
                        onClick={() => toggleExpand(row.customerId)}
                        className={`hover:bg-slate-50/90 transition cursor-pointer ${
                          isExpanded ? 'bg-slate-50/80' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{row.customerName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {row.businessName && <span>{row.businessName} • </span>}
                            <span>{row.phone}</span>
                            {row.gstin && <span> • GST: {row.gstin}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">
                          {row.current > 0 ? formatINR(row.current) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-amber-700">
                          {row.days1to30 > 0 ? formatINR(row.days1to30) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-amber-800 font-semibold">
                          {row.days31to60 > 0 ? formatINR(row.days31to60) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-rose-600 font-semibold">
                          {row.days61to90 > 0 ? formatINR(row.days61to90) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right text-rose-700 font-bold">
                          {row.days90Plus > 0 ? formatINR(row.days90Plus) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          {formatINR(row.totalOutstanding)}
                        </td>
                      </tr>

                      {/* Nested Expanded Invoice Breakdown */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={8} className="p-4 pl-11">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                              <h4 className="text-xs font-bold text-slate-900 mb-2">
                                Unsettled Invoices for {row.customerName} ({row.invoices.length})
                              </h4>
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                                  <tr>
                                    <th className="py-2 px-3">Invoice #</th>
                                    <th className="py-2 px-3">Issue Date</th>
                                    <th className="py-2 px-3">Due Date</th>
                                    <th className="py-2 px-3">Days Overdue</th>
                                    <th className="py-2 px-3">Bracket</th>
                                    <th className="py-2 px-3 text-right">Total</th>
                                    <th className="py-2 px-3 text-right">Paid</th>
                                    <th className="py-2 px-3 text-right">Balance Due</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {row.invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/60">
                                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                        {inv.invoiceNumber}
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        {formatDate(inv.issueDate, 'short')}
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        {inv.dueDate ? (
                                          formatDate(inv.dueDate, 'short')
                                        ) : (
                                          <span className="text-slate-400 italic">No due date set</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3">
                                        {inv.daysOverdue > 0 ? (
                                          <span className="text-rose-600 font-bold">
                                            {inv.daysOverdue} days overdue
                                          </span>
                                        ) : (
                                          <span className="text-emerald-600 font-medium">
                                            Not overdue
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                          {inv.bucket}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-right">{formatINR(inv.total)}</td>
                                      <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                                        {formatINR(inv.amountPaid)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-black text-slate-900">
                                        {formatINR(inv.balanceDue)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/90 font-black text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={2} className="py-3 px-3 uppercase text-[11px]">
                    Total Receivables
                  </td>
                  <td className="py-3 px-3 text-right">{formatINR(bucketTotals.current)}</td>
                  <td className="py-3 px-3 text-right text-amber-700">{formatINR(bucketTotals.days1to30)}</td>
                  <td className="py-3 px-3 text-right text-amber-800">{formatINR(bucketTotals.days31to60)}</td>
                  <td className="py-3 px-3 text-right text-rose-600">{formatINR(bucketTotals.days61to90)}</td>
                  <td className="py-3 px-3 text-right text-rose-700">{formatINR(bucketTotals.days90Plus)}</td>
                  <td className="py-3 px-3 text-right text-slate-900">{formatINR(totalOutstanding)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
