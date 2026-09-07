'use client';

import React, { useState, useId } from 'react';
import { X, ReceiptText, AlertCircle, Plus, Trash2, Calendar, User, Package } from 'lucide-react';
import { Customer, Product } from '@/types/database';
import { createNewInvoice } from '@/lib/services/dashboardService';
import { formatINR } from '@/lib/utils/formatters';

interface LineItemForm {
  id: string;
  productId: string;
  productName: string;
  hsnSac: string;
  quantity: string;
  unitPrice: string;
  taxRate: number;
}

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
  const [customerId, setCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItemForm[]>([
    {
      id: 'item-1',
      productId: '',
      productName: '',
      hsnSac: '',
      quantity: '',
      unitPrice: '',
      taxRate: 18,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Derive due date when customer is selected based on their real credit terms
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    const selectedCust = customers.find((c) => c.id === newCustId);
    if (selectedCust && selectedCust.credit_days && selectedCust.credit_days > 0) {
      const baseDate = invoiceDate ? new Date(invoiceDate) : new Date();
      baseDate.setDate(baseDate.getDate() + selectedCust.credit_days);
      setDueDate(baseDate.toISOString().split('T')[0]);
    } else {
      setDueDate('');
    }
  };

  // Line item change handlers
  const handleItemProductSelect = (index: number, selectedProdId: string) => {
    const updated = [...items];
    const prod = products.find((p) => p.id === selectedProdId);
    if (prod) {
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productName: prod.name,
        hsnSac: prod.hsn_sac || '',
        unitPrice: prod.selling_price > 0 ? String(prod.selling_price) : '',
        taxRate: prod.tax_rate ?? 18,
      };
    } else {
      updated[index] = {
        ...updated[index],
        productId: '',
      };
    }
    setItems(updated);
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof LineItemForm,
    value: any
  ) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        productId: '',
        productName: '',
        hsnSac: '',
        quantity: '',
        unitPrice: '',
        taxRate: 18,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      setItems([
        {
          id: `item-${Date.now()}`,
          productId: '',
          productName: '',
          hsnSac: '',
          quantity: '',
          unitPrice: '',
          taxRate: 18,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const calculatedSubtotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return acc + qty * price;
  }, 0);

  const calculatedTaxTotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const rate = item.taxRate || 0;
    return acc + (qty * price * rate) / 100;
  }, 0);

  const calculatedGrandTotal = Math.round(calculatedSubtotal + calculatedTaxTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMsg('Please select a customer for this invoice.');
      return;
    }

    if (!dueDate) {
      setErrorMsg('Please select or specify a valid due date.');
      return;
    }

    const validItems = items.filter(
      (it) => it.productName.trim() && parseFloat(it.quantity) > 0 && parseFloat(it.unitPrice) >= 0
    );

    if (validItems.length === 0) {
      setErrorMsg('Please enter at least one line item with a description, quantity, and unit price.');
      return;
    }

    if (calculatedGrandTotal <= 0) {
      setErrorMsg('Invoice grand total must be greater than zero.');
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
        subtotal: calculatedSubtotal,
        taxTotal: calculatedTaxTotal,
        totalAmount: calculatedGrandTotal,
        items: validItems.map((item) => ({
          productId: item.productId || undefined,
          productName: item.productName.trim(),
          hsnSac: item.hsnSac.trim() || undefined,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          taxRate: item.taxRate,
        })),
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to issue tax invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs"
      id="create-invoice-modal-backdrop"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-2xs">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Tax Invoice</h3>
              <p className="text-xs text-slate-500">GST-compliant B2B wholesale billing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Top Party & Invoice Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billed Customer / Firm *
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                id="create-invoice-cust-select"
              >
                <option value="">-- Select Registered Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name ? `${c.business_name} (${c.name})` : c.name}
                    {c.credit_days ? ` • ${c.credit_days}d credit` : ''}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">
                  No customers found. Please add a customer first to issue an invoice.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Sequential auto-generated if left blank"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                id="create-invoice-num-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                id="create-invoice-date-input"
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
              <p className="text-[10px] text-slate-500 mt-0.5">
                Automatically calculated from customer credit terms when available
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Line Items
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                id="add-invoice-line-item-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="p-3 overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[560px]">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                    <th className="pb-2 w-[40%]">Item / Product</th>
                    <th className="pb-2 w-[12%]">HSN/SAC</th>
                    <th className="pb-2 w-[14%] text-right">Qty</th>
                    <th className="pb-2 w-[16%] text-right">Rate (₹)</th>
                    <th className="pb-2 w-[12%] text-center">GST %</th>
                    <th className="pb-2 w-[6%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-2 pr-2">
                        {products.length > 0 && (
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                            className="w-full mb-1 px-2 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-700"
                          >
                            <option value="">-- Choose from Catalog or Type Below --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.selling_price})
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleItemFieldChange(idx, 'productName', e.target.value)}
                          placeholder="Item or service description"
                          required
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => handleItemFieldChange(idx, 'hsnSac', e.target.value)}
                          placeholder="e.g. 8544"
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                          placeholder="0"
                          required
                          className="w-full px-2 py-1.5 text-xs text-right border border-slate-200 rounded bg-slate-50 text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemFieldChange(idx, 'unitPrice', e.target.value)}
                          placeholder="0.00"
                          required
                          className="w-full px-2 py-1.5 text-xs text-right border border-slate-200 rounded bg-slate-50 text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-2 pr-2">
                        <select
                          value={item.taxRate}
                          onChange={(e) => handleItemFieldChange(idx, 'taxRate', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 text-center"
                        >
                          <option value={18}>18%</option>
                          <option value={12}>12%</option>
                          <option value={28}>28%</option>
                          <option value={5}>5%</option>
                          <option value={0}>0%</option>
                        </select>
                      </td>

                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation Summary Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Taxable Value (Subtotal):</span>
              <span className="font-mono font-bold">{formatINR(calculatedSubtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>GST Total (CGST + SGST / IGST):</span>
              <span className="font-mono font-bold">+{formatINR(calculatedTaxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="font-mono text-base">{formatINR(calculatedGrandTotal)}</span>
            </div>
          </div>

          {/* Terms & Delivery Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terms & Delivery Remarks <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Net 30 payment terms, dispatched via express freight"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedGrandTotal <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition shadow-xs cursor-pointer"
              id="submit-create-invoice-btn"
            >
              {isSubmitting
                ? 'Creating...'
                : calculatedGrandTotal > 0
                ? `Issue Invoice (${formatINR(calculatedGrandTotal)})`
                : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
