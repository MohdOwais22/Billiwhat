'use client';

import React from 'react';
import { ReceiptText, ChevronRight, ArrowUpRight } from 'lucide-react';
import { InvoiceWithDetails } from '@/types/database';
import { formatDate, formatINR, getInvoiceStatusConfig } from '@/lib/utils/formatters';

interface RecentInvoicesProps {
  invoices: InvoiceWithDetails[];
  onSelectInvoice: (invoiceId: string) => void;
  onViewAllInvoices?: () => void;
}

export function RecentInvoices({
  invoices,
  onSelectInvoice,
  onViewAllInvoices,
}: RecentInvoicesProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs" id="recent-invoices-section">
      <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <ReceiptText className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Recent Invoices
            </h2>
            <p className="text-[11px] text-slate-500">Tax invoices issued to credit buyers</p>
          </div>
        </div>

        {onViewAllInvoices && (
          <button
            onClick={onViewAllInvoices}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
            id="view-all-invoices-btn"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left text-xs border-collapse min-w-[500px]" id="recent-invoices-table">
          <thead>
            <tr className="border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Invoice #</th>
              <th className="py-2.5 px-3">Customer / Firm</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3 text-right">Total Amount</th>
              <th className="py-2.5 px-3 text-right">Balance Due</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No invoices recorded yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const statusConfig = getInvoiceStatusConfig(inv.status);
                const customerName = inv.customer?.business_name || inv.customer?.name || 'Customer';

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv.id)}
                    id={`invoice-row-${inv.id}`}
                    className="hover:bg-slate-50/80 cursor-pointer transition group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 group-hover:text-emerald-700">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 truncate max-w-[160px]">
                        {customerName}
                      </div>
                      {inv.customer?.business_name && inv.customer.name && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {inv.customer.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(inv.issue_date, 'short')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(inv.total)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {inv.balance_due > 0 ? (
                        <span className="text-rose-700">{formatINR(inv.balance_due)}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${statusConfig.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`}></span>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-400 group-hover:text-slate-700">
                      <ArrowUpRight className="w-3.5 h-3.5 inline" />
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
