'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ReceiptText,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle2,
  ClockAlert,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpDown,
  Building2,
} from 'lucide-react';
import { FullReportsData } from '@/lib/services/reportsService';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { exportSalesReportToCSV } from '@/lib/utils/reportExport';

interface SalesReportTabProps {
  data: FullReportsData;
}

type BreakdownView = 'daily' | 'weekly' | 'monthly';
type StatusFilter = 'all' | 'paid' | 'partially_paid' | 'issued' | 'overdue' | 'cancelled';

export function SalesReportTab({ data }: SalesReportTabProps) {
  const { overview, dailySales, weeklySales, monthlySales, salesInvoices, customers, dateRange } = data;

  const [breakdownView, setBreakdownView] = useState<BreakdownView>('daily');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return salesInvoices.filter((inv) => {
      // Customer filter
      if (selectedCustomerId !== 'all' && inv.customerId !== selectedCustomerId) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'overdue') {
          if (inv.status !== 'overdue' && (!inv.dueDate || new Date(inv.dueDate) >= new Date())) {
            return false;
          }
        } else if (inv.status !== selectedStatus) {
          return false;
        }
      }
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesNumber = inv.invoiceNumber.toLowerCase().includes(query);
        const matchesName = inv.customerName.toLowerCase().includes(query);
        const matchesBusiness = inv.customerBusinessName?.toLowerCase().includes(query) || false;
        const matchesGstin = inv.customerGstin?.toLowerCase().includes(query) || false;
        if (!matchesNumber && !matchesName && !matchesBusiness && !matchesGstin) {
          return false;
        }
      }
      return true;
    });
  }, [salesInvoices, selectedCustomerId, selectedStatus, searchTerm]);

  // Aggregate metrics for filtered data
  const filteredMetrics = useMemo(() => {
    const valid = filteredInvoices.filter((i) => i.status !== 'cancelled');
    const totalSales = valid.reduce((acc, i) => acc + i.total, 0);
    const invoiceCount = valid.length;
    const avgInvoice = invoiceCount > 0 ? totalSales / invoiceCount : 0;
    const taxableTotal = valid.reduce((acc, i) => acc + i.taxableAmount, 0);
    const taxTotal = valid.reduce((acc, i) => acc + i.totalTax, 0);

    return {
      totalSales,
      invoiceCount,
      avgInvoice,
      taxableTotal,
      taxTotal,
    };
  }, [filteredInvoices]);

  const activeBreakdown =
    breakdownView === 'daily'
      ? dailySales
      : breakdownView === 'weekly'
      ? weeklySales
      : monthlySales;

  const handleExportCSV = () => {
    exportSalesReportToCSV(filteredInvoices, activeBreakdown, dateRange.label);
  };

  return (
    <div className="space-y-6" id="sales-report-tab-content">
      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Sales
          </span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {formatINR(filteredMetrics.totalSales)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Invoices Issued
          </span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {filteredMetrics.invoiceCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Avg Invoice Value
          </span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {formatINR(filteredMetrics.avgInvoice)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Taxable Value
          </span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {formatINR(filteredMetrics.taxableTotal)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Tax
          </span>
          <span className="text-lg font-black text-emerald-600 mt-1 block">
            {formatINR(filteredMetrics.taxTotal)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Period Collected
          </span>
          <span className="text-lg font-black text-blue-600 mt-1 block">
            {formatINR(overview.totalCollected)}
          </span>
        </div>
      </div>

      {/* Breakdown Section: Daily / Weekly / Monthly */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sales Trend & Periodic Aggregates</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sales, taxable revenue, and collected payments grouped over time.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setBreakdownView('daily')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                breakdownView === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="sales-breakdown-daily-btn"
            >
              Daily
            </button>
            <button
              onClick={() => setBreakdownView('weekly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                breakdownView === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="sales-breakdown-weekly-btn"
            >
              Weekly
            </button>
            <button
              onClick={() => setBreakdownView('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                breakdownView === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="sales-breakdown-monthly-btn"
            >
              Monthly
            </button>
          </div>
        </div>

        {activeBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No sales or collection records recorded in this date range.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Period / Date</th>
                  <th className="py-3 px-4 text-center">Invoices</th>
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                  <th className="py-3 px-4 text-right">Tax Amount</th>
                  <th className="py-3 px-4 text-right">Total Sales</th>
                  <th className="py-3 px-4 text-right">Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {activeBreakdown.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.label}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {item.invoiceCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{formatINR(item.taxableAmount)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatINR(item.taxAmount)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(item.totalSales)}</td>
                    <td className="py-3 px-4 text-right text-blue-600 font-semibold">{formatINR(item.collectedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Register with Filters & Export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Period Invoice Register</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed list of all sales invoices issued in {dateRange.label}.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredInvoices.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            id="export-sales-csv-btn"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Sales CSV</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice #, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              id="sales-search-input"
            />
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-slate-700 font-medium"
              id="sales-customer-filter"
            >
              <option value="all">All Customers ({customers.length})</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.business_name ? `(${c.business_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-slate-700 font-medium"
              id="sales-status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="issued">Issued / Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Invoice Table or Empty State */}
        {filteredInvoices.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50" id="sales-empty-state">
            <ReceiptText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No sales data yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Create your first invoice to start seeing financial reports and sales ledger analytics.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredInvoices.map((inv) => {
                  const statusStyles: Record<string, string> = {
                    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    partially_paid: 'bg-amber-50 text-amber-700 border-amber-200',
                    issued: 'bg-blue-50 text-blue-700 border-blue-200',
                    overdue: 'bg-rose-50 text-rose-700 border-rose-200',
                    cancelled: 'bg-slate-100 text-slate-500 border-slate-200 line-through',
                    draft: 'bg-slate-100 text-slate-600 border-slate-200',
                  };

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(inv.invoiceDate, 'short')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{inv.customerName}</div>
                        {inv.customerBusinessName && (
                          <div className="text-[11px] text-slate-400">{inv.customerBusinessName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            statusStyles[inv.status] || statusStyles.issued
                          }`}
                        >
                          {inv.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatINR(inv.taxableAmount)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                        {formatINR(inv.totalTax)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatINR(inv.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
