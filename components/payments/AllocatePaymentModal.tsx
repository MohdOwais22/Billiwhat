'use client';

import React, { useState } from 'react';
import { X, Layers, AlertCircle, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { EnrichedPayment, allocatePaymentToInvoice } from '@/lib/services/paymentsService';
import { formatINR } from '@/lib/utils/formatters';

interface AllocatePaymentModalProps {
  payment: EnrichedPayment | null;
  openInvoices: {
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate?: string | null;
    total: number;
    amountPaid: number;
    balanceDue: number;
  }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AllocatePaymentModal({
  payment,
  openInvoices,
  onClose,
  onSuccess,
}: AllocatePaymentModalProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!payment) return null;

  const cust = payment.customer;
  const custName = cust?.business_name || cust?.name || 'Customer Account';
  const paymentAmount = Number(payment.amount) || 0;

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      setErrorMsg('Please select an open invoice to allocate this payment to.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await allocatePaymentToInvoice(payment.id, selectedInvoiceId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to allocate payment to invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      id="allocate-payment-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Allocate Advance Payment</h3>
              <p className="text-xs text-slate-500">Apply unallocated deposit to an open invoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAllocate} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Deposit Info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-900">{custName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Amount:</span>
              <span className="font-mono font-bold text-emerald-700">{formatINR(paymentAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Date:</span>
              <span className="font-medium text-slate-700">
                {new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>

          {/* Invoice Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Open Invoice for Allocation *
            </label>

            {openInvoices.length === 0 ? (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 text-center">
                No open unpaid invoices found for this customer account.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {openInvoices.map((inv) => {
                  const isSelected = selectedInvoiceId === inv.id;
                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoiceId(inv.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold mb-1">
                        <span>#{inv.invoiceNumber}</span>
                        <span className={isSelected ? 'text-amber-300' : 'text-rose-700'}>
                          Due: {formatINR(inv.balanceDue)}
                        </span>
                      </div>
                      <div className={`flex justify-between text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        <span>Issued: {inv.issueDate}</span>
                        <span>Total: {formatINR(inv.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || openInvoices.length === 0 || !selectedInvoiceId}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isSubmitting ? 'Allocating...' : 'Confirm Allocation'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
