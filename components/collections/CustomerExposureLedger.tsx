'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  MessageSquare,
  CreditCard,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Building2,
  Phone,
  AlertTriangle,
  ClockAlert,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  AgeingBucketKey,
  CustomerReceivablesSummary,
  ReceivablesInvoiceItem,
} from '@/lib/services/collectionsService';
import { formatINR, formatDate } from '@/lib/utils/formatters';

interface CustomerExposureLedgerProps {
  customerSummaries: CustomerReceivablesSummary[];
  selectedBucket: AgeingBucketKey | 'all';
  onSelectCustomer: (customerId: string) => void;
  onOpenWhatsAppModal: (item: ReceivablesInvoiceItem) => void;
  onOpenRecordPayment: (item: ReceivablesInvoiceItem) => void;
  onOpenCustomerSettlement: (customerId: string, balance: number) => void;
  onOpenInvoiceDetail: (invoiceId: string) => void;
}

export function CustomerExposureLedger({
  customerSummaries,
  selectedBucket,
  onSelectCustomer,
  onOpenWhatsAppModal,
  onOpenRecordPayment,
  onOpenCustomerSettlement,
  onOpenInvoiceDetail,
}: CustomerExposureLedgerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Filter customer summaries
  const filteredSummaries = useMemo(() => {
    return customerSummaries.filter((cust) => {
      // If bucket filter active, only keep customer if they have debt in that bucket
      if (selectedBucket !== 'all') {
        if (selectedBucket === 'current' && cust.current <= 0) return false;
        if (selectedBucket === '1-30' && cust.days1to30 <= 0) return false;
        if (selectedBucket === '31-60' && cust.days31to60 <= 0) return false;
        if (selectedBucket === '61-90' && cust.days61to90 <= 0) return false;
        if (selectedBucket === '90+' && cust.days90Plus <= 0) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = cust.customerName.toLowerCase().includes(q);
        const matchBus = cust.businessName?.toLowerCase().includes(q) || false;
        const matchPhone = cust.phone.includes(q);
        const matchGst = cust.gstin?.toLowerCase().includes(q) || false;

        if (!matchName && !matchBus && !matchPhone && !matchGst) {
          return false;
        }
      }

      return true;
    });
  }, [customerSummaries, selectedBucket, searchTerm]);

  const toggleExpand = (customerId: string) => {
    setExpandedCustomerId((prev) => (prev === customerId ? null : customerId));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="customer-exposure-ledger-container">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Customer Credit Exposure Ledger</h3>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {filteredSummaries.length} {filteredSummaries.length === 1 ? 'party' : 'parties'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated receivables, credit limit monitoring, and ageing debt distribution by party
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search party name, phone, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            id="customer-ledger-search"
          />
        </div>
      </div>

      {filteredSummaries.length === 0 ? (
        <div className="p-12 text-center" id="empty-customer-ledger">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900">No Customer Receivables Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm || selectedBucket !== 'all'
              ? 'No customer records match the current filter.'
              : 'All customers are fully settled with zero pending balances.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" id="customer-exposure-table">
            <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-8"></th>
                <th className="py-3 px-4">Customer / Business</th>
                <th className="py-3 px-4 text-right">Current</th>
                <th className="py-3 px-4 text-right">1–30d</th>
                <th className="py-3 px-4 text-right">31–60d</th>
                <th className="py-3 px-4 text-right">61–90d</th>
                <th className="py-3 px-4 text-right">90+d</th>
                <th className="py-3 px-4 text-right">Total Outstanding</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSummaries.map((cust) => {
                const isExpanded = expandedCustomerId === cust.customerId;
                const creditUtilization =
                  cust.creditLimit > 0
                    ? Math.round((cust.totalOutstanding / cust.creditLimit) * 100)
                    : null;

                return (
                  <React.Fragment key={cust.customerId}>
                    <tr
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isExpanded ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      {/* Expand Chevron */}
                      <td
                        onClick={() => toggleExpand(cust.customerId)}
                        className="py-3 px-3 text-slate-400 hover:text-slate-900"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4" onClick={() => onSelectCustomer(cust.customerId)}>
                        <div className="font-bold text-slate-900 hover:text-emerald-700 hover:underline">
                          {cust.customerName}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          {cust.businessName && <span>{cust.businessName} • </span>}
                          <span className="font-mono">{cust.phone || 'No phone'}</span>
                          {cust.gstin && <span> • GST: {cust.gstin}</span>}
                        </div>

                        {/* Credit Limit Badge if configured */}
                        {cust.creditLimit > 0 && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">
                              Limit: {formatINR(cust.creditLimit)}
                            </span>
                            {creditUtilization !== null && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  creditUtilization > 100
                                    ? 'bg-red-100 text-red-800'
                                    : creditUtilization > 80
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {creditUtilization}% utilized
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Current */}
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">
                        {cust.current > 0 ? formatINR(cust.current) : '—'}
                      </td>

                      {/* 1-30d */}
                      <td className="py-3 px-4 text-right text-amber-700 font-mono">
                        {cust.days1to30 > 0 ? formatINR(cust.days1to30) : '—'}
                      </td>

                      {/* 31-60d */}
                      <td className="py-3 px-4 text-right text-orange-700 font-mono font-semibold">
                        {cust.days31to60 > 0 ? formatINR(cust.days31to60) : '—'}
                      </td>

                      {/* 61-90d */}
                      <td className="py-3 px-4 text-right text-rose-600 font-mono font-semibold">
                        {cust.days61to90 > 0 ? formatINR(cust.days61to90) : '—'}
                      </td>

                      {/* 90+d */}
                      <td className="py-3 px-4 text-right text-red-700 font-mono font-black">
                        {cust.days90Plus > 0 ? formatINR(cust.days90Plus) : '—'}
                      </td>

                      {/* Total Outstanding */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-black text-sm text-slate-900 block">
                          {formatINR(cust.totalOutstanding)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {cust.invoicesCount} {cust.invoicesCount === 1 ? 'bill' : 'bills'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Settle / Pay CTA */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCustomerSettlement(cust.customerId, cust.totalOutstanding);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-2xs cursor-pointer"
                            title="Record payment for this party"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                            <span>Settle</span>
                          </button>

                          {/* Full Drill-down */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCustomer(cust.customerId);
                            }}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition border border-emerald-200 cursor-pointer"
                            title="Inspect complete party ledger"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable nested table of open invoices for this customer */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={9} className="p-4 pl-12">
                          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                              <h4 className="text-xs font-bold text-slate-900">
                                Unsettled Invoices for {cust.customerName} ({cust.invoices.length})
                              </h4>
                              <button
                                onClick={() => onSelectCustomer(cust.customerId)}
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Open Full Customer Ledger</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>

                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                                <tr>
                                  <th className="py-2 px-3">Invoice #</th>
                                  <th className="py-2 px-3">Issue Date</th>
                                  <th className="py-2 px-3">Due Date</th>
                                  <th className="py-2 px-3">Ageing Status</th>
                                  <th className="py-2 px-3 text-right">Invoice Total</th>
                                  <th className="py-2 px-3 text-right">Paid</th>
                                  <th className="py-2 px-3 text-right">Balance Due</th>
                                  <th className="py-2 px-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {cust.invoices.map((inv) => (
                                  <tr key={inv.id} className="hover:bg-slate-50/70">
                                    <td className="py-2.5 px-3">
                                      <button
                                        onClick={() => onOpenInvoiceDetail(inv.id)}
                                        className="font-mono font-bold text-slate-900 hover:text-emerald-700 hover:underline cursor-pointer"
                                      >
                                        {inv.invoiceNumber}
                                      </button>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600">
                                      {formatDate(inv.issueDate, 'short')}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600">
                                      {formatDate(inv.dueDate, 'short')}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {inv.daysOverdue > 0 ? (
                                        <span className="text-rose-600 font-bold">
                                          {inv.daysOverdue}d overdue ({inv.bucket})
                                        </span>
                                      ) : (
                                        <span className="text-emerald-600 font-medium">
                                          On Schedule
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono">
                                      {formatINR(inv.total)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                                      {formatINR(inv.amountPaid)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                      {formatINR(inv.balanceDue)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          onClick={() => onOpenWhatsAppModal(inv)}
                                          className="p-1 px-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition cursor-pointer"
                                        >
                                          WhatsApp
                                        </button>
                                        <button
                                          onClick={() => onOpenRecordPayment(inv)}
                                          className="p-1 px-2 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                                        >
                                          Pay
                                        </button>
                                      </div>
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
          </table>
        </div>
      )}
    </div>
  );
}
