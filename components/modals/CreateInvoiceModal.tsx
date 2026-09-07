'use client';

import React, { useState } from 'react';
import { X, ReceiptText, AlertCircle } from 'lucide-react';
import { Customer, Product } from '@/types/database';
import { createNewInvoice } from '@/lib/services/dashboardService';
import { formatINR } from '@/lib/utils/formatters';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
  products: Product[];
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
  products,
}: CreateInvoiceModalProps) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [subtotal, setSubtotal] = useState(50000);
  const [gstRate, setGstRate] = useState(18);
  const [notes, setNotes] = useState('Standard credit terms. Payment due in 15 days.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const taxTotal = Math.round((subtotal * gstRate) / 100);
  const totalAmount = subtotal + taxTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || totalAmount <= 0) {
      setErrorMsg('Please select a customer and enter a valid taxable amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await createNewInvoice({
        customerId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        issueDate: invoiceDate,
        invoiceDate,
        dueDate,
        subtotal,
        taxTotal,
        totalAmount,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs" id="create-invoice-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Tax Invoice</h3>
              <p className="text-xs text-slate-500">GST-compliant wholesale billing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Number <span className="text-slate-400 font-normal">(Leave blank for sequential auto-gen)</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. WB/26-27/001"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                id="create-invoice-num-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Firm *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                id="create-invoice-cust-select"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name ? `${c.business_name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                id="create-invoice-due-date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taxable Value (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={subtotal}
                onChange={(e) => setSubtotal(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                id="create-invoice-subtotal"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              >
                <option value={18}>18% GST (9% CGST + 9% SGST)</option>
                <option value={12}>12% GST</option>
                <option value={28}>28% GST</option>
                <option value={5}>5% GST</option>
                <option value={0}>0% (Exempt)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Taxable Value:</span>
              <span className="font-mono">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>GST Amount:</span>
              <span className="font-mono">+{formatINR(taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-emerald-400 pt-1.5 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="font-mono">{formatINR(totalAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terms & Delivery Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dispatched via Express Logistics"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs"
              id="submit-create-invoice-btn"
            >
              {isSubmitting ? 'Creating...' : `Issue Invoice (${formatINR(totalAmount)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
