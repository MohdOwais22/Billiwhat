'use client';

import React, { useState } from 'react';
import { X, CreditCard, AlertCircle, Banknote, CheckCircle2, Share2, Copy, Check } from 'lucide-react';
import { Customer, InvoiceWithDetails, PaymentMethod } from '@/types/database';
import { recordNewPayment } from '@/lib/services/dashboardService';
import { formatINR, getPaymentMethodConfig } from '@/lib/utils/formatters';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
  initialInvoice?: InvoiceWithDetails | null;
  initialCustomerId?: string;
  initialAmount?: number;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
  initialInvoice,
  initialCustomerId,
  initialAmount,
}: RecordPaymentModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialInvoice?.customer_id || initialCustomerId || customers[0]?.id || ''
  );
  const [amount, setAmount] = useState<number>(
    initialAmount || (initialInvoice?.balance_due ? initialInvoice.balance_due : 10000)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Receipt State
  const [receiptResult, setReceiptResult] = useState<{
    receiptSummary: string;
    invoiceNumber?: string;
    customerName: string;
    amountPaid: number;
    newOutstanding: number;
    method: string;
  } | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  if (!isOpen) return null;

  const ALL_PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
    { id: 'cash', label: 'Cash' },
    { id: 'upi', label: 'UPI' },
    { id: 'bank_transfer', label: 'Bank Transfer' },
    { id: 'card', label: 'Card' },
    { id: 'payment_gateway', label: 'Payment Gateway' },
    { id: 'cheque', label: 'Cheque' },
    { id: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || amount <= 0) {
      setErrorMsg('Please select a valid customer and specify an amount greater than 0.');
      return;
    }

    if (initialInvoice && amount > initialInvoice.balance_due) {
      setErrorMsg(
        `Payment amount (${formatINR(amount)}) cannot exceed the invoice remaining balance (${formatINR(initialInvoice.balance_due)}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await recordNewPayment({
        customerId: selectedCustomerId,
        invoiceId: initialInvoice?.id || undefined,
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber || (paymentMethod === 'cash' ? `CASH-${Date.now().toString().slice(-6)}` : undefined),
        paymentDate,
        notes: notes || (initialInvoice ? `Payment for Invoice ${initialInvoice.invoice_number}` : 'Direct Customer Settlement'),
      });

      const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);
      const custName = selectedCustomerObj?.company_name || selectedCustomerObj?.name || 'Customer';

      setReceiptResult({
        receiptSummary: res.receipt_summary,
        invoiceNumber: initialInvoice?.invoice_number || res.invoice_number,
        customerName: custName,
        amountPaid: Number(amount),
        newOutstanding: res.new_outstanding ?? 0,
        method: paymentMethod,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to record payment. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReceipt = () => {
    if (!receiptResult) return;
    navigator.clipboard.writeText(receiptResult.receiptSummary);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!receiptResult) return;
    const text = encodeURIComponent(receiptResult.receiptSummary);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs" id="record-payment-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {receiptResult ? 'Payment Receipt Generated' : 'Record Payment'}
              </h3>
              <p className="text-xs text-slate-500">
                {receiptResult ? 'Transaction saved to ledger & audit trail' : 'Cash & Manual Collection Register'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
            id="record-payment-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {receiptResult ? (
          /* Receipt Screen */
          <div className="p-6 space-y-5" id="payment-receipt-view">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-emerald-950">Payment Recorded Successfully!</h4>
              <p className="text-xs text-emerald-800 font-mono">
                {receiptResult.receiptSummary}
              </p>
            </div>

            <div className="space-y-2 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{receiptResult.customerName}</span>
              </div>
              {receiptResult.invoiceNumber && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Invoice #:</span>
                  <span className="font-mono font-bold text-slate-900">{receiptResult.invoiceNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-900 capitalize">{getPaymentMethodConfig(receiptResult.method as any).label}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Amount Received:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{formatINR(receiptResult.amountPaid)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(receiptResult.newOutstanding)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                id="copy-receipt-btn"
              >
                {copiedReceipt ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedReceipt ? 'Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                id="share-whatsapp-receipt-btn"
              >
                <Share2 className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Done & Return
            </button>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {initialInvoice && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Allocated Invoice</span>
                <div className="flex justify-between items-center font-mono mt-0.5">
                  <span className="font-bold text-slate-900">{initialInvoice.invoice_number}</span>
                  <span className="text-rose-700 font-semibold">Balance: {formatINR(initialInvoice.balance_due)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Credit Account *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                id="payment-customer-select"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name ? `${c.company_name} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  id="payment-amount-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  id="payment-date-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode / Method *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {ALL_PAYMENT_METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition text-center ${
                      paymentMethod === m.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod !== 'cash' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Txn ID / Cheque #
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR / Bank Ref / Cheque No."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  id="payment-ref-input"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Reference Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Cash collected at store counter"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                id="payment-notes-input"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition shadow-xs flex items-center gap-1.5"
                id="payment-submit-btn"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Recording...' : 'Record Payment & Save'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
