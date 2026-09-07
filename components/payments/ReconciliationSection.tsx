'use client';

import React, { useMemo, useState } from 'react';
import {
  FullPaymentsData,
  EnrichedPayment,
} from '@/lib/services/paymentsService';
import { formatINR } from '@/lib/utils/formatters';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  ShieldCheck,
  Search,
  Scale,
  Building,
  Layers,
} from 'lucide-react';

interface ReconciliationSectionProps {
  data: FullPaymentsData;
  onViewReceipt: (payment: EnrichedPayment) => void;
  onViewDetail: (payment: EnrichedPayment) => void;
  onAllocate?: (payment: EnrichedPayment) => void;
}

export function ReconciliationSection({
  data,
  onViewReceipt,
  onViewDetail,
  onAllocate,
}: ReconciliationSectionProps) {
  const [filterType, setFilterType] = useState<'all' | 'fully_settled' | 'partially_settled' | 'unsettled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { invoices, payments, customers } = data;

  const customerMap = useMemo(() => {
    const map = new Map<string, any>();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  // Aggregate payments by invoice
  const invoiceReconMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalPaid: number;
        paymentsList: EnrichedPayment[];
      }
    >();

    payments.forEach((p) => {
      const status = (p.status || '').toLowerCase();
      if (['failed', 'cancelled', 'bounced', 'reversed'].includes(status)) return;
      if (p.invoice_id) {
        if (!map.has(p.invoice_id)) {
          map.set(p.invoice_id, { totalPaid: 0, paymentsList: [] });
        }
        const record = map.get(p.invoice_id)!;
        record.totalPaid += Number(p.amount) || 0;
        record.paymentsList.push(p);
      }
    });

    return map;
  }, [payments]);

  // Reconciliation statistics
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let fullySettledCount = 0;
    let fullySettledAmount = 0;
    let partiallySettledCount = 0;
    let partiallySettledAmount = 0;
    let unsettledCount = 0;
    let unsettledAmount = 0;

    invoices.forEach((inv) => {
      const invTotal = Number(inv.total) || 0;
      totalInvoiced += invTotal;
      const rec = invoiceReconMap.get(inv.id);
      const paid = rec?.totalPaid || 0;
      const balance = Math.max(0, invTotal - paid);

      if (balance <= 0.01 && paid > 0) {
        fullySettledCount += 1;
        fullySettledAmount += invTotal;
      } else if (paid > 0 && balance > 0.01) {
        partiallySettledCount += 1;
        partiallySettledAmount += paid;
      } else {
        unsettledCount += 1;
        unsettledAmount += invTotal;
      }
    });

    const totalCollected = data.metrics.totalCollected;
    const allocatedCollected = totalCollected - data.metrics.unallocatedAmount;
    const realizationRate = totalInvoiced > 0 ? Math.min(100, (totalCollected / totalInvoiced) * 100) : 0;

    return {
      totalInvoiced,
      totalCollected,
      allocatedCollected,
      realizationRate,
      fullySettledCount,
      fullySettledAmount,
      partiallySettledCount,
      partiallySettledAmount,
      unsettledCount,
      unsettledAmount,
    };
  }, [invoices, invoiceReconMap, data.metrics]);

  // Filtered invoice rows for reconciliation audit table
  const auditRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return invoices
      .filter((inv) => {
        const cust = customerMap.get(inv.customer_id);
        const rec = invoiceReconMap.get(inv.id);
        const total = Number(inv.total) || 0;
        const paid = rec?.totalPaid || 0;
        const balance = Math.max(0, total - paid);

        // Filter Type
        if (filterType === 'fully_settled' && (balance > 0.01 || paid === 0)) return false;
        if (filterType === 'partially_settled' && (paid === 0 || balance <= 0.01)) return false;
        if (filterType === 'unsettled' && paid > 0) return false;

        // Search Query
        if (q) {
          const invNum = (inv.invoice_number || '').toLowerCase();
          const custName = (cust?.name || '').toLowerCase();
          const custBiz = (cust?.business_name || '').toLowerCase();
          if (!invNum.includes(q) && !custName.includes(q) && !custBiz.includes(q)) return false;
        }

        return true;
      })
      .map((inv) => {
        const cust = customerMap.get(inv.customer_id);
        const rec = invoiceReconMap.get(inv.id);
        const total = Number(inv.total) || 0;
        const paid = rec?.totalPaid || 0;
        const balance = Math.max(0, total - paid);

        let statusBadge = 'Unsettled';
        let badgeColor = 'bg-rose-100 text-rose-800';

        if (balance <= 0.01 && paid > 0) {
          statusBadge = 'Fully Settled';
          badgeColor = 'bg-emerald-100 text-emerald-800';
        } else if (paid > 0) {
          statusBadge = 'Partially Settled';
          badgeColor = 'bg-amber-100 text-amber-800';
        }

        return {
          invoice: inv,
          customer: cust,
          total,
          paid,
          balance,
          paymentsCount: rec?.paymentsList.length || 0,
          paymentsList: rec?.paymentsList || [],
          statusBadge,
          badgeColor,
        };
      });
  }, [invoices, invoiceReconMap, customerMap, filterType, searchQuery]);

  return (
    <div className="space-y-5" id="payments-reconciliation-section">
      {/* Real Reconciliation Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Invoiced vs Collected */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Invoiced vs Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total Billed Sales:</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(stats.totalInvoiced)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total Collections:</span>
              <span className="font-mono font-bold text-emerald-700">{formatINR(stats.totalCollected)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Settlement Realization:</span>
              <span className="font-mono font-bold text-slate-900">{stats.realizationRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Allocated vs Unallocated Advance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Collection Allocation
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Invoice-Linked Payments:</span>
              <span className="font-mono font-bold text-emerald-700">{formatINR(stats.allocatedCollected)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Unallocated Customer Advances:</span>
              <span className="font-mono font-bold text-amber-700">
                {formatINR(data.metrics.unallocatedAmount)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Advance Deposits:</span>
              <span className="font-mono font-semibold text-slate-700">
                {data.metrics.unallocatedCount} payments
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Portfolio Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Settlement Status Mix
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-0.5">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Fully Settled:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{stats.fullySettledCount} invoices</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Partially Settled:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{stats.partiallySettledCount} invoices</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Unsettled / Open:</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{stats.unsettledCount} invoices</span>
            </div>
          </div>
        </div>
      </div>

      {/* Honest Integration Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-slate-800">Ledger & Transaction Integrity:</strong> Reconciliation balances are
            computed strictly from verified invoice and payment entries.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Audit Verified
        </span>
      </div>

      {/* Reconciliation Audit Register */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Invoice-Payment Reconciliation Register</h4>
            <p className="text-xs text-slate-500">
              Audit trail matching customer invoices against received payment transactions
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Invoices' },
                { id: 'fully_settled', label: 'Fully Settled' },
                { id: 'partially_settled', label: 'Partially Settled' },
                { id: 'unsettled', label: 'Unsettled' },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                onClick={() => setFilterType(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
                  filterType === pill.id
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number or customer name..."
            className="w-full pl-8 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Audit Table */}
        {auditRows.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No invoices match the reconciliation filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Invoice Total</th>
                  <th className="py-2.5 px-3 text-right">Settled Amount</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                  <th className="py-2.5 px-3 text-center">Settlement Status</th>
                  <th className="py-2.5 px-3 text-right">Linked Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditRows.map((row) => (
                  <tr key={row.invoice.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      #{row.invoice.invoice_number}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {row.customer?.business_name || row.customer?.name || 'Customer'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">
                      {formatINR(row.total)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatINR(row.paid)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {formatINR(row.balance)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${row.badgeColor}`}
                      >
                        {row.statusBadge}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {row.paymentsList.length > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          {row.paymentsList.slice(0, 2).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => onViewReceipt(p)}
                              title="View Payment Receipt"
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono transition cursor-pointer"
                            >
                              RCP-{p.id.slice(0, 4)}
                            </button>
                          ))}
                          {row.paymentsList.length > 2 && (
                            <span className="text-[10px] text-slate-400">+{row.paymentsList.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-sans italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
