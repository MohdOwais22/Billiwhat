'use client';

import React from 'react';
import { CreditCard, CheckCircle2, ChevronRight } from 'lucide-react';
import { PaymentWithCustomer } from '@/types/database';
import { formatDate, formatINR, getPaymentMethodConfig, getPaymentStatusConfig } from '@/lib/utils/formatters';

interface RecentPaymentsProps {
  payments: PaymentWithCustomer[];
  onViewAllPayments?: () => void;
  onRecordNewPayment?: () => void;
}

export function RecentPayments({
  payments,
  onViewAllPayments,
  onRecordNewPayment,
}: RecentPaymentsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs" id="recent-payments-section">
      <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Recent Collections & Receipts
            </h2>
            <p className="text-[11px] text-slate-500">Payments collected across all channels</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRecordNewPayment && (
            <button
              onClick={onRecordNewPayment}
              className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
              id="recent-payments-record-btn"
            >
              + Record
            </button>
          )}
          {onViewAllPayments && (
            <button
              onClick={onViewAllPayments}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
              id="view-all-payments-btn"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left text-xs border-collapse min-w-[500px]" id="recent-payments-table">
          <thead>
            <tr className="border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Payment Method</th>
              <th className="py-2.5 px-3">Reference / Txn ID</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No payment collections recorded in this period.
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const methodConfig = getPaymentMethodConfig(p.payment_method);
                const statusConfig = getPaymentStatusConfig(p.status);
                const customerName = p.customer?.company_name || p.customer?.name || 'Customer';

                return (
                  <tr key={p.id} id={`payment-row-${p.id}`} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 truncate max-w-[170px]">
                        {customerName}
                      </div>
                      {p.invoice?.invoice_number && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Inv #{p.invoice.invoice_number}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(p.payment_date, 'short')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${methodConfig.badgeClass}`}
                      >
                        {methodConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[150px]">
                      {p.reference_number || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700">
                      +{formatINR(p.amount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${statusConfig.badgeClass}`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
