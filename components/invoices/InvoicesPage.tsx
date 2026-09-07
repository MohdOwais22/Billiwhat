'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  ReceiptText,
  CreditCard,
  Send,
  Printer,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
  Building2,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  TrendingUp,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { InvoiceStatus, InvoiceWithDetails } from '@/types/database';
import { formatINR, formatDate, getInvoiceStatusConfig } from '@/lib/utils/formatters';
import { cancelInvoice } from '@/lib/services/dashboardService';
import { PrintInvoiceModal } from '@/components/invoices/PrintInvoiceModal';

type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'due_date';
type DateFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export function InvoicesPage() {
  const {
    dashboardData,
    isLoading,
    loadData,
    setIsCreateInvoiceOpen,
    handleOpenRecordPayment,
    handleQueueWhatsApp,
    setSelectedInvoice,
    setIsInvoiceDetailOpen,
    organization,
    gstProfile,
  } = useDashboard();

  if (isLoading && !dashboardData) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-pulse" id="invoices-loading-skeleton">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  // Search, filtering, and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Print modal state
  const [printingInvoice, setPrintingInvoice] = useState<InvoiceWithDetails | null>(null);

  // Cancellation state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const allInvoices = dashboardData?.recentInvoices || [];

  // Summary Metrics calculated from all loaded invoices
  const summaryMetrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let draftCount = 0;
    let paidCount = 0;

    allInvoices.forEach((inv) => {
      if (inv.status === 'cancelled') return;

      totalInvoiced += inv.total || 0;
      totalCollected += inv.amount_paid || 0;
      totalOutstanding += inv.balance_due || 0;

      if (inv.status === 'overdue' || (inv.balance_due > 0 && inv.days_overdue > 0)) {
        overdueCount += 1;
        overdueAmount += inv.balance_due || 0;
      }
      if (inv.status === 'draft') draftCount += 1;
      if (inv.status === 'paid') paidCount += 1;
    });

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      overdueCount,
      overdueAmount,
      draftCount,
      paidCount,
      totalCount: allInvoices.length,
    };
  }, [allInvoices]);

  // Status Counts for Tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allInvoices.length,
      draft: 0,
      issued: 0,
      partially_paid: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    allInvoices.forEach((inv) => {
      if (counts[inv.status] !== undefined) {
        counts[inv.status] += 1;
      }
    });

    return counts;
  }, [allInvoices]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return allInvoices
      .filter((inv) => {
        // 1. Status Filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'overdue') {
            if (inv.status !== 'overdue' && !(inv.balance_due > 0 && inv.days_overdue > 0)) {
              return false;
            }
          } else if (inv.status !== statusFilter) {
            return false;
          }
        }

        // 2. Search Term Filter
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase().trim();
          const invNum = (inv.invoice_number || '').toLowerCase();
          const custName = (inv.customer?.name || '').toLowerCase();
          const bizName = (inv.customer?.business_name || '').toLowerCase();
          const gstin = (inv.customer?.gstin || '').toLowerCase();
          const phone = (inv.customer?.phone || '').toLowerCase();

          if (
            !invNum.includes(query) &&
            !custName.includes(query) &&
            !bizName.includes(query) &&
            !gstin.includes(query) &&
            !phone.includes(query)
          ) {
            return false;
          }
        }

        // 3. Date Filter
        if (dateFilter !== 'all' && inv.issue_date) {
          const invDate = new Date(inv.issue_date);
          const now = new Date();

          if (dateFilter === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            if (!inv.issue_date.startsWith(todayStr)) return false;
          } else if (dateFilter === 'this_week') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            if (invDate < sevenDaysAgo) return false;
          } else if (dateFilter === 'this_month') {
            if (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
          } else if (dateFilter === 'last_month') {
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            if (invDate.getMonth() !== lastMonth || invDate.getFullYear() !== year) {
              return false;
            }
          } else if (dateFilter === 'custom') {
            if (customStartDate && invDate < new Date(customStartDate)) return false;
            if (customEndDate && invDate > new Date(customEndDate + 'T23:59:59')) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.issue_date || 0).getTime() - new Date(a.issue_date || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.issue_date || 0).getTime() - new Date(b.issue_date || 0).getTime();
        }
        if (sortBy === 'amount_high') {
          return (b.total || 0) - (a.total || 0);
        }
        if (sortBy === 'amount_low') {
          return (a.total || 0) - (b.total || 0);
        }
        if (sortBy === 'due_date') {
          return new Date(a.due_date || '9999-12-31').getTime() - new Date(b.due_date || '9999-12-31').getTime();
        }
        return 0;
      });
  }, [allInvoices, statusFilter, searchTerm, dateFilter, customStartDate, customEndDate, sortBy]);

  // Handle Cancel Invoice Action
  const handleCancelInvoice = async (invoiceId: string, invoiceNum: string) => {
    if (!window.confirm(`Are you sure you want to cancel Invoice ${invoiceNum}? This will update its status to cancelled.`)) {
      return;
    }

    try {
      setCancellingId(invoiceId);
      setActionError(null);
      await cancelInvoice(invoiceId);
      setActionSuccess(`Invoice ${invoiceNum} has been cancelled.`);
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to cancel invoice.');
    } finally {
      setCancellingId(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="invoices-sales-module">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Invoices & Sales
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage GST tax invoices, track buyer receivables, and record settlements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData()}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
            id="create-invoice-top-cta"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Action Notifications */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Invoiced
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-slate-900 font-mono">
              {formatINR(summaryMetrics.totalInvoiced)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {summaryMetrics.totalCount} total invoice{summaryMetrics.totalCount === 1 ? '' : 's'} issued
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-emerald-700 font-mono">
              {formatINR(summaryMetrics.totalCollected)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {summaryMetrics.paidCount} fully paid invoice{summaryMetrics.paidCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Due
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-amber-800 font-mono">
              {formatINR(summaryMetrics.totalOutstanding)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pending buyer clearance
            </p>
          </div>
        </div>

        {/* Overdue Receivables */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overdue Receivables
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-rose-700 font-mono">
              {formatINR(summaryMetrics.overdueAmount)}
            </h3>
            <p className="text-xs text-rose-600 mt-0.5 font-medium">
              {summaryMetrics.overdueCount} invoice{summaryMetrics.overdueCount === 1 ? '' : 's'} past due date
            </p>
          </div>
        </div>
      </div>

      {/* Main List & Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="px-4 pt-3 border-b border-slate-200 bg-slate-50/60 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max pb-3">
            {[
              { id: 'all', label: 'All Invoices', count: statusCounts.all },
              { id: 'issued', label: 'Issued / Open', count: statusCounts.issued },
              { id: 'partially_paid', label: 'Partially Paid', count: statusCounts.partially_paid },
              { id: 'overdue', label: 'Overdue', count: statusCounts.overdue },
              { id: 'paid', label: 'Paid', count: statusCounts.paid },
              { id: 'draft', label: 'Draft', count: statusCounts.draft },
              { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                  id={`invoice-tab-${tab.id}`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Date Filter & Sort Controls */}
        <div className="p-4 border-b border-slate-200/80 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice #, customer name, GSTIN, phone..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
              id="invoice-search-input"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Dropdown */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                id="invoice-date-filter"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="this_week">Past 7 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Inputs if selected */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                />
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                id="invoice-sort-by"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Highest Amount</option>
                <option value="amount_low">Lowest Amount</option>
                <option value="due_date">Due Date (Urgent)</option>
              </select>
            </div>

            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-slate-900 underline px-1 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Invoice Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse" id="invoices-table">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer / Buyer</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4 text-right">Taxable (₹)</th>
                <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-slate-100 rounded w-24"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 bg-slate-200 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-slate-100 rounded w-16"></div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 bg-slate-200 rounded-full w-16 mx-auto"></div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-7 bg-slate-200 rounded w-20 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : allInvoices.length === 0 ? (
                // Empty Database State
                <tr>
                  <td colSpan={8} className="py-16 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                        <ReceiptText className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        No Invoices Created Yet
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Your sales ledger is currently empty. Issue your first B2B GST tax invoice to start tracking buyer accounts and collections.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreateInvoiceOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer mt-2"
                        id="empty-state-create-invoice-btn"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Invoice</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                // No Filter Match State
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        No Matching Invoices Found
                      </h4>
                      <p className="text-xs text-slate-500">
                        No sales records match your current search terms or filters.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-semibold text-emerald-700 hover:underline pt-1 cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // Actual Invoice Rows
                filteredInvoices.map((inv) => {
                  const statusConf = getInvoiceStatusConfig(inv.status);
                  const isOverdue = inv.balance_due > 0 && inv.days_overdue > 0;
                  const customer = inv.customer;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition group"
                      id={`invoice-row-${inv.id}`}
                    >
                      {/* Invoice Number */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsInvoiceDetailOpen(true);
                          }}
                          className="font-mono font-bold text-slate-900 hover:text-emerald-700 transition flex items-center gap-1.5 cursor-pointer text-left"
                        >
                          <span>{inv.invoice_number}</span>
                          <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                        <span className="text-[10px] text-slate-400 block mt-0.5 capitalize">
                          {inv.invoice_type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {customer?.business_name || customer?.name || 'Customer'}
                        </div>
                        {customer?.business_name && customer.name && (
                          <div className="text-[11px] text-slate-500">
                            {customer.name}
                          </div>
                        )}
                        {customer?.gstin && (
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            GSTIN: {customer.gstin}
                          </div>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          {formatDate(inv.issue_date, 'short')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Due: {formatDate(inv.due_date, 'short')}
                        </div>
                        {isOverdue && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                            {inv.days_overdue}d overdue
                          </span>
                        )}
                      </td>

                      {/* Taxable Amount */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatINR(inv.taxable_amount || inv.subtotal)}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(inv.total)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span
                          className={`font-bold ${
                            inv.balance_due > 0
                              ? isOverdue
                                ? 'text-rose-700'
                                : 'text-slate-900'
                              : 'text-emerald-700'
                          }`}
                        >
                          {formatINR(inv.balance_due)}
                        </span>
                        {inv.amount_paid > 0 && inv.balance_due > 0 && (
                          <span className="block text-[10px] text-emerald-700">
                            Paid: {formatINR(inv.amount_paid)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConf.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dotClass}`}></span>
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print Invoice Button */}
                          <button
                            type="button"
                            onClick={() => setPrintingInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Print / Save Tax Invoice PDF"
                            id={`print-invoice-btn-${inv.id}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Reminder Button */}
                          {inv.balance_due > 0 && inv.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleQueueWhatsApp(inv as any)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Send WhatsApp Payment Reminder"
                              id={`whatsapp-btn-${inv.id}`}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Record Payment Button */}
                          {inv.balance_due > 0 && inv.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleOpenRecordPayment(inv, inv.customer_id, inv.balance_due)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition cursor-pointer"
                              title="Record Payment Receipt"
                              id={`collect-payment-btn-${inv.id}`}
                            >
                              <CreditCard className="w-3 h-3" />
                              <span className="hidden sm:inline">Pay</span>
                            </button>
                          )}

                          {/* Cancel Invoice Action (if not already cancelled/paid) */}
                          {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => handleCancelInvoice(inv.id, inv.invoice_number)}
                              disabled={cancellingId === inv.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Cancel Invoice"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Tax Invoice Modal */}
      <PrintInvoiceModal
        invoice={printingInvoice}
        organization={organization || dashboardData?.organization}
        gstProfile={gstProfile || dashboardData?.gstProfile}
        isOpen={Boolean(printingInvoice)}
        onClose={() => setPrintingInvoice(null)}
      />
    </div>
  );
}
