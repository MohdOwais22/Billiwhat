'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, Banknote, CheckCircle2, Share2, Copy, Check, FileText, Building2 } from 'lucide-react';
import { Customer, InvoiceWithDetails, PaymentMethod } from '@/types/database';
import { recordNewPayment } from '@/lib/services/dashboardService';
import { formatINR, getPaymentMethodConfig } from '@/lib/utils/formatters';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
  initialInvoice?: InvoiceWithDetails | null;
  initialCustomerId?: string;
  initialAmount?: number;
}

interface CustomerOpenInvoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  total: number;
  amount_paid: number;
  balance_due: number;
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
    initialInvoice?.customer_id || initialCustomerId || ''
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    initialInvoice?.id || ''
  );

  const [customerInvoices, setCustomerInvoices] = useState<CustomerOpenInvoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  const [amount, setAmount] = useState<string>(
    initialAmount !== undefined
      ? String(initialAmount)
      : initialInvoice?.balance_due
      ? String(initialInvoice.balance_due)
      : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
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

  // Fetch open invoices when customer changes
  useEffect(() => {
    if (!isOpen || !selectedCustomerId) {
      setCustomerInvoices([]);
      return;
    }

    // If initialInvoice was passed for this customer, no need to refetch
    if (initialInvoice && initialInvoice.customer_id === selectedCustomerId) {
      setCustomerInvoices([
        {
          id: initialInvoice.id,
          invoice_number: initialInvoice.invoice_number,
          issue_date: initialInvoice.issue_date,
          due_date: initialInvoice.due_date || null,
          total: Number(initialInvoice.total),
          amount_paid: initialInvoice.amount_paid || 0,
          balance_due: initialInvoice.balance_due || Number(initialInvoice.total),
        },
      ]);
      setSelectedInvoiceId(initialInvoice.id);
      return;
    }

    let isMounted = true;
    async function loadCustomerInvoices() {
      try {
        setIsLoadingInvoices(true);
        const supabase = createBrowserClient();
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .limit(1)
          .maybeSingle();

        if (!memberData?.organization_id) return;

        // Fetch invoices and payments in parallel for this customer
        const [invRes, payRes] = await Promise.all([
          supabase
            .from('invoices')
            .select('id, invoice_number, issue_date, due_date, total, status')
            .eq('customer_id', selectedCustomerId)
            .eq('organization_id', memberData.organization_id)
            .neq('status', 'cancelled')
            .order('issue_date', { ascending: false }),
          supabase
            .from('payments')
            .select('invoice_id, amount, status')
            .eq('customer_id', selectedCustomerId)
            .eq('organization_id', memberData.organization_id),
        ]);

        if (!isMounted) return;

        const paymentsByInv = new Map<string, number>();
        (payRes.data || []).forEach((p: any) => {
          if (['failed', 'cancelled', 'bounced', 'reversed'].includes((p.status || '').toLowerCase())) return;
          if (p.invoice_id) {
            paymentsByInv.set(p.invoice_id, (paymentsByInv.get(p.invoice_id) || 0) + Number(p.amount));
          }
        });

        const openInvs: CustomerOpenInvoice[] = [];
        (invRes.data || []).forEach((inv: any) => {
          const tot = Number(inv.total) || 0;
          const paid = paymentsByInv.get(inv.id) || 0;
          const bal = Math.max(0, tot - paid);

          if (bal > 0.01) {
            openInvs.push({
              id: inv.id,
              invoice_number: inv.invoice_number,
              issue_date: inv.issue_date,
              due_date: inv.due_date,
              total: tot,
              amount_paid: paid,
              balance_due: bal,
            });
          }
        });

        setCustomerInvoices(openInvs);

        // If there's only 1 open invoice and none selected, pre-select it
        if (openInvs.length === 1 && !selectedInvoiceId) {
          setSelectedInvoiceId(openInvs[0].id);
        }
      } catch (err) {
        console.error('Failed to load customer open invoices:', err);
      } finally {
        if (isMounted) setIsLoadingInvoices(false);
      }
    }

    loadCustomerInvoices();

    return () => {
      isMounted = false;
    };
  }, [selectedCustomerId, isOpen, initialInvoice]);

  if (!isOpen) return null;

  const ALL_PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
    { id: 'upi', label: 'UPI' },
    { id: 'bank_transfer', label: 'Bank Transfer' },
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Card' },
    { id: 'cheque', label: 'Cheque' },
    { id: 'payment_gateway', label: 'Gateway' },
    { id: 'other', label: 'Other' },
  ];

  const selectedInvoice = customerInvoices.find((i) => i.id === selectedInvoiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!selectedCustomerId || isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please select a valid customer and specify an amount greater than 0.');
      return;
    }

    if (selectedInvoice && amountNum > selectedInvoice.balance_due + 0.01) {
      setErrorMsg(
        `Payment amount (${formatINR(amountNum)}) cannot exceed the invoice remaining balance (${formatINR(selectedInvoice.balance_due)}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await recordNewPayment({
        customerId: selectedCustomerId,
        invoiceId: selectedInvoiceId || undefined,
        amount: amountNum,
        method: paymentMethod,
        paymentMethod,
        reference: referenceNumber || (paymentMethod === 'cash' ? `CASH-${Date.now().toString().slice(-6)}` : undefined),
        referenceNumber: referenceNumber || (paymentMethod === 'cash' ? `CASH-${Date.now().toString().slice(-6)}` : undefined),
        paidAt: paymentDate,
        paymentDate,
        notes: notes || (selectedInvoice ? `Payment for Invoice #${selectedInvoice.invoice_number}` : 'Direct Customer Account Settlement'),
      });

      const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);
      const custName = selectedCustomerObj?.business_name || selectedCustomerObj?.name || 'Customer';

      setReceiptResult({
        receiptSummary: res.receipt_summary,
        invoiceNumber: selectedInvoice?.invoice_number || res.invoice_number,
        customerName: custName,
        amountPaid: amountNum,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      id="record-payment-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {receiptResult ? 'Payment Recorded & Settled' : 'Record Customer Payment'}
              </h3>
              <p className="text-xs text-slate-500">
                {receiptResult ? 'Ledger balance and invoice status updated' : 'Direct collection entry & invoice reconciliation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            id="record-payment-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {receiptResult ? (
          /* Receipt Screen */
          <div className="p-6 space-y-5" id="payment-receipt-view">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center font-bold shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-emerald-950">Payment Settled Successfully</h4>
              <p className="text-xs text-emerald-800 font-mono">
                {receiptResult.receiptSummary}
              </p>
            </div>

            <div className="space-y-2 text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{receiptResult.customerName}</span>
              </div>
              {receiptResult.invoiceNumber && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Allocated Invoice:</span>
                  <span className="font-mono font-bold text-slate-900">{receiptResult.invoiceNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-900 capitalize">{getPaymentMethodConfig(receiptResult.method as any).label}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Amount Received:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{formatINR(receiptResult.amountPaid)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Invoice Remaining Balance:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(receiptResult.newOutstanding)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                id="copy-receipt-btn"
              >
                {copiedReceipt ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedReceipt ? 'Copied' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                id="share-whatsapp-receipt-btn"
              >
                <Share2 className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Customer Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Account *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedInvoiceId('');
                }}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                id="payment-customer-select"
              >
                <option value="">-- Select Customer Account * --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name ? `${c.business_name} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Selector */}
            {selectedCustomerId && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Allocate to Invoice
                  </label>
                  {isLoadingInvoices && (
                    <span className="text-[10px] text-slate-400">Loading open invoices...</span>
                  )}
                </div>

                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    const invId = e.target.value;
                    setSelectedInvoiceId(invId);
                    if (invId) {
                      const match = customerInvoices.find((i) => i.id === invId);
                      if (match && !amount) {
                        setAmount(String(match.balance_due));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  id="payment-invoice-select"
                >
                  <option value="">-- Direct Customer Settlement (Unallocated Advance) --</option>
                  {customerInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      #{inv.invoice_number} (Total: {formatINR(inv.total)} | Remaining: {formatINR(inv.balance_due)})
                    </option>
                  ))}
                </select>

                {selectedInvoice && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Invoice Total:</span>
                      <span className="font-mono font-medium text-slate-700">{formatINR(selectedInvoice.total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Previously Paid:</span>
                      <span className="font-mono text-emerald-700 font-medium">{formatINR(selectedInvoice.amount_paid)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-bold">
                      <span className="text-slate-900">Current Outstanding Balance:</span>
                      <span className="font-mono text-rose-700">{formatINR(selectedInvoice.balance_due)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Amount Received (₹) *
                  </label>
                  {selectedInvoice && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(selectedInvoice.balance_due))}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                    >
                      Settle Full
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  id="payment-amount-input"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  id="payment-date-input"
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Mode / Channel *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {ALL_PAYMENT_METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition text-center cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number */}
            {paymentMethod !== 'cash' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / UTR / Cheque Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR / Bank Ref / Cheque No."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  id="payment-ref-input"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes & Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bank IMPS transfer from party account"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                id="payment-notes-input"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                id="payment-submit-btn"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSubmitting ? 'Recording...' : 'Record Payment'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
