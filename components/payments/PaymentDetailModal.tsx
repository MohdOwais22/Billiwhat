'use client';

import React from 'react';
import { X, Receipt, Building2, User, FileText, ArrowUpRight, CheckCircle2, Clock, AlertCircle, Share2, Layers } from 'lucide-react';
import { EnrichedPayment } from '@/lib/services/paymentsService';
import { formatINR, getPaymentMethodConfig } from '@/lib/utils/formatters';

interface PaymentDetailModalProps {
  payment: EnrichedPayment | null;
  onClose: () => void;
  onViewReceipt: (payment: EnrichedPayment) => void;
  onAllocate?: (payment: EnrichedPayment) => void;
}

export function PaymentDetailModal({
  payment,
  onClose,
  onViewReceipt,
  onAllocate,
}: PaymentDetailModalProps) {
  if (!payment) return null;

  const cust = payment.customer;
  const inv = payment.invoice;
  const methodConfig = getPaymentMethodConfig((payment.method as any) || 'cash');

  const formattedDate = new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      id="payment-detail-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full my-8 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Payment Details</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {payment.id.slice(0, 13)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Amount and Status Hero */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Settled Amount
              </span>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-0.5">
                {formatINR(Number(payment.amount) || 0)}
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full uppercase font-mono bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>{payment.status}</span>
              </span>
              <div className="text-xs text-slate-500">{formattedDate}</div>
            </div>
          </div>

          {/* Payment Method & Transaction Reference */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Transaction Details
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block">Payment Mode</span>
                <span className="font-semibold text-slate-900 capitalize">{methodConfig.label}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Settlement Channel</span>
                <span className="font-semibold text-slate-900">{payment.gateway || 'Manual / Direct'}</span>
              </div>
            </div>

            {payment.reference && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block">UTR / Cheque / Ref Number</span>
                <span className="font-mono font-bold text-slate-900">{payment.reference}</span>
              </div>
            )}

            {payment.gateway_payment_id && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block">Gateway Payment ID</span>
                <span className="font-mono text-slate-700">{payment.gateway_payment_id}</span>
              </div>
            )}

            {payment.metadata?.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block">Remarks & Notes</span>
                <span className="text-slate-700">{payment.metadata.notes}</span>
              </div>
            )}
          </div>

          {/* Customer Profile */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Customer Account
            </span>

            {cust ? (
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  {cust.business_name || cust.name}
                </div>
                {cust.business_name && cust.name && (
                  <div className="text-slate-600">Contact: {cust.name}</div>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 pt-1">
                  {cust.phone && <span>Phone: {cust.phone}</span>}
                  {cust.gstin && <span className="font-mono">GSTIN: {cust.gstin}</span>}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic">Customer details unavailable</div>
            )}
          </div>

          {/* Linked Invoice */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Allocation Status
            </span>

            {inv ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    Invoice #{inv.invoice_number}
                  </span>
                  <span className="text-slate-500">Issued: {inv.issue_date}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-lg text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Invoice Total</span>
                    <span className="font-mono font-semibold text-slate-800">{formatINR(inv.total)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Payment Applied</span>
                    <span className="font-mono font-bold text-emerald-700">{formatINR(payment.amount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Current Balance</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatINR(payment.invoiceBalanceRemaining ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-200/60">
                <div className="flex items-center gap-2 text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Unallocated Customer Advance</span>
                </div>
                {onAllocate && (
                  <button
                    onClick={() => {
                      onClose();
                      onAllocate(payment);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md text-xs transition cursor-pointer"
                  >
                    Allocate Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewReceipt(payment);
            }}
            className="px-4 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-600" />
            <span>View Official Receipt</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
