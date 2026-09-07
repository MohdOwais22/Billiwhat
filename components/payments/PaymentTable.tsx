'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Receipt,
  Eye,
  Layers,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  Building,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Plus,
} from 'lucide-react';
import { EnrichedPayment } from '@/lib/services/paymentsService';
import { formatINR, getPaymentMethodConfig } from '@/lib/utils/formatters';

interface PaymentTableProps {
  payments: EnrichedPayment[];
  onViewReceipt: (payment: EnrichedPayment) => void;
  onViewDetail: (payment: EnrichedPayment) => void;
  onAllocate?: (payment: EnrichedPayment) => void;
  onOpenRecordPayment: () => void;
  initialAllocationFilter?: 'all' | 'allocated' | 'unallocated';
}

type DateFilterType = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';

export function PaymentTable({
  payments,
  onViewReceipt,
  onViewDetail,
  onAllocate,
  onOpenRecordPayment,
  initialAllocationFilter = 'all',
}: PaymentTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [allocationFilter, setAllocationFilter] = useState<'all' | 'allocated' | 'unallocated'>(
    initialAllocationFilter
  );
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Compute filtered payments
  const filteredPayments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Calculate start of this week (Monday)
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    // Start of this month
    const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    return payments.filter((p) => {
      // 1. Search Query
      if (query) {
        const custName = (p.customer?.name || '').toLowerCase();
        const custBiz = (p.customer?.business_name || '').toLowerCase();
        const custPhone = (p.customer?.phone || '').toLowerCase();
        const invNum = (p.invoice?.invoice_number || '').toLowerCase();
        const ref = (p.reference || '').toLowerCase();
        const gtw = (p.gateway_payment_id || '').toLowerCase();
        const pId = p.id.toLowerCase();

        const matchesQuery =
          custName.includes(query) ||
          custBiz.includes(query) ||
          custPhone.includes(query) ||
          invNum.includes(query) ||
          ref.includes(query) ||
          gtw.includes(query) ||
          pId.includes(query);

        if (!matchesQuery) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const pStatus = (p.status || '').toLowerCase();
        if (statusFilter === 'completed' && pStatus !== 'completed' && pStatus !== 'recorded') return false;
        if (statusFilter === 'failed' && !['failed', 'bounced', 'cancelled', 'reversed'].includes(pStatus)) return false;
      }

      // 3. Method Filter
      if (methodFilter !== 'all') {
        if ((p.method || '').toLowerCase() !== methodFilter.toLowerCase()) return false;
      }

      // 4. Allocation Filter
      if (allocationFilter === 'allocated' && !p.invoice_id) return false;
      if (allocationFilter === 'unallocated' && p.invoice_id) return false;

      // 5. Date Filter
      const pDate = (p.paid_at || p.created_at).split('T')[0];
      if (dateFilter === 'today' && pDate !== todayStr) return false;
      if (dateFilter === 'this_week' && pDate < startOfWeekStr) return false;
      if (dateFilter === 'this_month' && pDate < startOfMonthStr) return false;
      if (dateFilter === 'custom') {
        if (customStartDate && pDate < customStartDate) return false;
        if (customEndDate && pDate > customEndDate) return false;
      }

      return true;
    });
  }, [
    payments,
    searchQuery,
    statusFilter,
    methodFilter,
    allocationFilter,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setMethodFilter('all');
    setAllocationFilter('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== 'all' ||
    methodFilter !== 'all' ||
    allocationFilter !== 'all' ||
    dateFilter !== 'all';

  const getMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'upi':
        return <QrCode className="w-3.5 h-3.5 text-indigo-600" />;
      case 'bank_transfer':
        return <Building className="w-3.5 h-3.5 text-blue-600" />;
      case 'cash':
        return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
      case 'card':
        return <CreditCard className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4" id="payments-table-container">
      {/* Search & Filter Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, invoice #, UTR reference, or gateway ID..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              id="payments-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
                { id: 'custom', label: 'Custom' },
              ] as { id: DateFilterType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
                  dateFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium cursor-pointer"
            id="payment-status-filter"
          >
            <option value="all">Status: All</option>
            <option value="completed">Completed / Settled</option>
            <option value="failed">Failed / Bounced</option>
          </select>

          {/* Payment Method Selector */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium cursor-pointer"
            id="payment-method-filter"
          >
            <option value="all">Method: All Channels</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer (IMPS/NEFT)</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>

          {/* Allocation Selector */}
          <select
            value={allocationFilter}
            onChange={(e) => setAllocationFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 font-medium cursor-pointer"
            id="payment-allocation-filter"
          >
            <option value="all">Allocation: All</option>
            <option value="allocated">Allocated to Invoice</option>
            <option value="unallocated">Unallocated Advances</option>
          </select>

          {/* Custom Date Range Pickers */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs bg-transparent border-0 text-slate-800 font-medium focus:outline-hidden"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs bg-transparent border-0 text-slate-800 font-medium focus:outline-hidden"
              />
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-900">{filteredPayments.length}</span> of{' '}
            {payments.length} payments
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {filteredPayments.length === 0 ? (
        /* Empty State */
        <div
          className="bg-white rounded-2xl border border-slate-200/80 p-10 sm:p-14 text-center shadow-xs space-y-4"
          id="payments-empty-state"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold">
            <CreditCard className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">
              {payments.length === 0 ? 'No payments recorded yet' : 'No matching payments found'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {payments.length === 0
                ? 'Record customer payments against invoices or unallocated account deposits to maintain audit-ready ledgers and reconciliation.'
                : 'Try adjusting your search query, date range, payment method, or allocation filters.'}
            </p>
          </div>

          <div className="pt-2">
            {payments.length === 0 ? (
              <button
                onClick={onOpenRecordPayment}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
                id="empty-record-payment-btn"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Record First Payment</span>
              </button>
            ) : (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" id="payments-desktop-table">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Allocated Invoice</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Method & Channel</th>
                    <th className="py-3 px-4">Reference / UTR</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => {
                    const cust = p.customer;
                    const inv = p.invoice;
                    const methodConfig = getPaymentMethodConfig((p.method as any) || 'cash');
                    const isFailed = ['failed', 'bounced', 'cancelled', 'reversed'].includes(
                      (p.status || '').toLowerCase()
                    );

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition group">
                        {/* Payment Date */}
                        <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {new Date(p.paid_at || p.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{cust?.business_name || cust?.name || 'Customer'}</div>
                          {cust?.business_name && cust?.name && (
                            <div className="text-[11px] text-slate-500">{cust.name}</div>
                          )}
                          {cust?.phone && <div className="text-[10px] text-slate-400">{cust.phone}</div>}
                        </td>

                        {/* Invoice */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {inv ? (
                            <div>
                              <span className="font-mono font-bold text-slate-900 block">
                                #{inv.invoice_number}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Total: {formatINR(inv.total)}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                              <ArrowDownLeft className="w-3 h-3 text-amber-600" />
                              <span>Unallocated Advance</span>
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="font-mono font-bold text-sm text-emerald-700">
                            {formatINR(Number(p.amount) || 0)}
                          </div>
                        </td>

                        {/* Method & Channel */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {getMethodIcon(p.method)}
                            <span className="font-semibold text-slate-800 capitalize">
                              {methodConfig.label}
                            </span>
                          </div>
                          {p.gateway && (
                            <span className="text-[10px] text-slate-400 block">{p.gateway}</span>
                          )}
                        </td>

                        {/* Reference / UTR */}
                        <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {p.reference || p.gateway_payment_id || (
                            <span className="text-slate-300 font-sans italic">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                              isFailed
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isFailed ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>{p.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!p.invoice_id && onAllocate && (
                              <button
                                onClick={() => onAllocate(p)}
                                title="Allocate to Invoice"
                                className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => onViewReceipt(p)}
                              title="View Payment Receipt"
                              className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onViewDetail(p)}
                              title="Inspect Details"
                              className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Payment Cards */}
          <div className="md:hidden space-y-3" id="payments-mobile-cards">
            {filteredPayments.map((p) => {
              const cust = p.customer;
              const inv = p.invoice;
              const methodConfig = getPaymentMethodConfig((p.method as any) || 'cash');
              const isFailed = ['failed', 'bounced', 'cancelled', 'reversed'].includes(
                (p.status || '').toLowerCase()
              );

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3"
                >
                  {/* Top Bar: Date & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(p.paid_at || p.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                        isFailed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Customer & Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {cust?.business_name || cust?.name || 'Customer'}
                      </h4>
                      {cust?.phone && <span className="text-xs text-slate-400">{cust.phone}</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black font-mono text-emerald-700">
                        {formatINR(Number(p.amount) || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Allocation & Method */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Allocated Invoice</span>
                      {inv ? (
                        <span className="font-mono font-bold text-slate-900">#{inv.invoice_number}</span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Unallocated Deposit</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Method</span>
                      <div className="flex items-center gap-1 font-semibold text-slate-800 capitalize">
                        {getMethodIcon(p.method)}
                        <span>{methodConfig.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    {!p.invoice_id && onAllocate && (
                      <button
                        onClick={() => onAllocate(p)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Allocate</span>
                      </button>
                    )}

                    <button
                      onClick={() => onViewReceipt(p)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>

                    <button
                      onClick={() => onViewDetail(p)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
