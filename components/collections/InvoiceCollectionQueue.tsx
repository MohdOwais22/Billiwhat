'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  MessageSquare,
  CreditCard,
  Copy,
  Check,
  Eye,
  ArrowUpDown,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building2,
  Phone,
  Calendar,
} from 'lucide-react';
import {
  AgeingBucketKey,
  PriorityLevel,
  ReceivablesInvoiceItem,
} from '@/lib/services/collectionsService';
import { formatINR, formatDate } from '@/lib/utils/formatters';

interface InvoiceCollectionQueueProps {
  queue: ReceivablesInvoiceItem[];
  selectedBucket: AgeingBucketKey | 'all';
  onSelectBucket: (bucket: AgeingBucketKey | 'all') => void;
  onOpenWhatsAppModal: (item: ReceivablesInvoiceItem) => void;
  onOpenRecordPayment: (item: ReceivablesInvoiceItem) => void;
  onOpenInvoiceDetail: (invoiceId: string) => void;
  onSelectCustomer: (customerId: string) => void;
}

type SortField = 'days_overdue' | 'balance_due' | 'due_date' | 'invoice_number' | 'customer_name';
type SortOrder = 'asc' | 'desc';

export function InvoiceCollectionQueue({
  queue,
  selectedBucket,
  onSelectBucket,
  onOpenWhatsAppModal,
  onOpenRecordPayment,
  onOpenInvoiceDetail,
  onSelectCustomer,
}: InvoiceCollectionQueueProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');
  const [sortField, setSortField] = useState<SortField>('days_overdue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter queue
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      // 1. Bucket filter
      if (selectedBucket !== 'all' && item.bucket !== selectedBucket) {
        return false;
      }

      // 2. Priority filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }

      // 3. Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchInvoice = item.invoiceNumber.toLowerCase().includes(q);
        const matchCust = item.customerName.toLowerCase().includes(q);
        const matchBus = item.customerBusinessName?.toLowerCase().includes(q) || false;
        const matchPhone = item.phone.includes(q);
        const matchGst = item.gstin?.toLowerCase().includes(q) || false;

        if (!matchInvoice && !matchCust && !matchBus && !matchPhone && !matchGst) {
          return false;
        }
      }

      return true;
    });
  }, [queue, selectedBucket, priorityFilter, searchTerm]);

  // Sort queue
  const sortedQueue = useMemo(() => {
    const list = [...filteredQueue];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'days_overdue':
          comparison = a.daysOverdue - b.daysOverdue;
          break;
        case 'balance_due':
          comparison = a.balanceDue - b.balanceDue;
          break;
        case 'due_date':
          comparison = a.dueDate.localeCompare(b.dueDate);
          break;
        case 'invoice_number':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case 'customer_name':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    return list;
  }, [filteredQueue, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCopyReminder = (item: ReceivablesInvoiceItem) => {
    const text = `Namaste ${item.customerName} ji, payment reminder for Invoice #${item.invoiceNumber}. Pending balance: ${formatINR(item.balanceDue)} (Due: ${formatDate(item.dueDate, 'short')}). Kindly settle soon. Thank you!`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            Medium
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-700">
            Normal
          </span>
        );
    }
  };

  const getOverdueBadge = (days: number, dueDate: string) => {
    if (days === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dueDate === todayStr) {
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Due Today</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Due on {formatDate(dueDate, 'short')}</span>
        </span>
      );
    }

    if (days > 60) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-red-800 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
          <AlertCircle className="w-3 h-3 text-red-600" />
          <span>{days} days overdue</span>
        </span>
      );
    }

    if (days > 30) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-500" />
          <span>{days} days overdue</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
        <Clock className="w-3 h-3 text-amber-500" />
        <span>{days} days overdue</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="invoice-collection-queue-container">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Collections Work Queue</h3>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {sortedQueue.length} {sortedQueue.length === 1 ? 'bill' : 'bills'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritized list of open invoices with single-click WhatsApp reminders and settlements
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search party, invoice #, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              id="collection-queue-search"
            />
          </div>
        </div>

        {/* Priority Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
          </span>

          {(['all', 'critical', 'high', 'medium', 'normal'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                priorityFilter === p
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p === 'all' ? 'All Priorities' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      {sortedQueue.length === 0 ? (
        <div className="p-12 text-center" id="empty-collection-queue">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900">No Invoices in Collection Queue</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm || priorityFilter !== 'all' || selectedBucket !== 'all'
              ? 'No open invoices match your current search and filter criteria.'
              : 'All issued invoices have been fully paid. Excellent cashflow health!'}
          </p>
          {(searchTerm || priorityFilter !== 'all' || selectedBucket !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPriorityFilter('all');
                onSelectBucket('all');
              }}
              className="mt-4 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="collection-queue-table">
            <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th
                  onClick={() => toggleSort('invoice_number')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('customer_name')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer / Party</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('due_date')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Due Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Invoice Total</th>
                <th
                  onClick={() => toggleSort('balance_due')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Balance Due</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Priority / Action</th>
                <th className="py-3 px-4 text-right">Quick Follow-Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sortedQueue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  {/* Invoice Number */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onOpenInvoiceDetail(item.id)}
                      className="font-mono font-bold text-slate-900 hover:text-emerald-700 hover:underline cursor-pointer block text-left"
                    >
                      {item.invoiceNumber}
                    </button>
                    <span className="text-[11px] text-slate-400 block font-sans">
                      {formatDate(item.issueDate, 'short')}
                    </span>
                  </td>

                  {/* Customer / Party */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectCustomer(item.customerId)}
                      className="font-bold text-slate-900 hover:text-emerald-700 hover:underline text-left cursor-pointer block"
                    >
                      {item.customerName}
                    </button>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      {item.customerBusinessName && (
                        <span className="truncate max-w-[140px]">{item.customerBusinessName} • </span>
                      )}
                      <span className="font-mono">{item.phone || 'No phone'}</span>
                    </div>
                  </td>

                  {/* Due Status */}
                  <td className="py-3 px-4">
                    {getOverdueBadge(item.daysOverdue, item.dueDate)}
                  </td>

                  {/* Invoice Total */}
                  <td className="py-3 px-4 text-right text-slate-600 font-mono">
                    <div>{formatINR(item.total)}</div>
                    {item.amountPaid > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        Paid: {formatINR(item.amountPaid)}
                      </span>
                    )}
                  </td>

                  {/* Balance Due */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono font-black text-sm text-slate-900 block">
                      {formatINR(item.balanceDue)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {item.bucket} bucket
                    </span>
                  </td>

                  {/* Priority & Suggested Action */}
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div>{getPriorityBadge(item.priority)}</div>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[160px]" title={item.suggestedAction}>
                        {item.suggestedAction}
                      </span>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {/* WhatsApp Reminder CTA */}
                      <button
                        onClick={() => onOpenWhatsAppModal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition shadow-2xs cursor-pointer"
                        title="Send WhatsApp Payment Reminder"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      {/* Record Payment CTA */}
                      <button
                        onClick={() => onOpenRecordPayment(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-2xs cursor-pointer"
                        title="Record Payment Settlement"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">Pay</span>
                      </button>

                      {/* Quick Copy Reminder Text */}
                      <button
                        onClick={() => handleCopyReminder(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Copy payment reminder text"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* View Invoice Details */}
                      <button
                        onClick={() => onOpenInvoiceDetail(item.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="View invoice details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
