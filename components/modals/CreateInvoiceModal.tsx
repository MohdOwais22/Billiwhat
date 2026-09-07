'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ReceiptText,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  User,
  Package,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Customer, GstProfile, InvoiceStatus, Organization, Product } from '@/types/database';
import { createNewInvoice, getNextSequentialInvoiceNumber } from '@/lib/services/dashboardService';
import { formatINR } from '@/lib/utils/formatters';
import { INDIAN_STATES, getStateNameByCode, getStateCodeByName } from '@/lib/constants/indianStates';

interface LineItemForm {
  id: string;
  productId: string;
  productName: string;
  hsnSac: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string;
  taxRate: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
  products: Product[];
  organization?: Organization;
  gstProfile?: GstProfile | null;
  onOpenAddCustomer?: () => void;
  onOpenAddProduct?: () => void;
}

const COMMON_UNITS = ['PCS', 'BOX', 'KGS', 'MTR', 'LTR', 'NOS', 'PKT', 'SET', 'SQFT', 'DOZ'];

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
  products,
  organization,
  gstProfile,
  onOpenAddCustomer,
  onOpenAddProduct,
}: CreateInvoiceModalProps) {
  const [customerId, setCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [nextSeqPreview, setNextSeqPreview] = useState('INV-0001');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('27');
  const [invoiceType, setInvoiceType] = useState('tax_invoice');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('1. Goods once sold will not be taken back or exchanged.\n2. Interest @18% p.a. will be charged if payment is not made within credit term.');
  const [items, setItems] = useState<LineItemForm[]>([
    {
      id: 'item-1',
      productId: '',
      productName: '',
      hsnSac: '',
      quantity: '1',
      unit: 'PCS',
      unitPrice: '',
      discount: '0',
      taxRate: 18,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize sequential invoice preview and place of supply
  useEffect(() => {
    if (isOpen) {
      getNextSequentialInvoiceNumber().then((seq) => {
        setNextSeqPreview(seq);
      });

      const defaultStateCode = gstProfile?.state_code || organization?.state_code || '27';
      setPlaceOfSupply(defaultStateCode);
    }
  }, [isOpen, gstProfile, organization]);

  if (!isOpen) return null;

  const sellerStateCode = gstProfile?.state_code || organization?.state_code || '27';
  const isInterState = placeOfSupply !== sellerStateCode;

  // Derive due date & place of supply when customer is selected
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    const selectedCust = customers.find((c) => c.id === newCustId);
    if (selectedCust) {
      if (selectedCust.credit_days && selectedCust.credit_days > 0) {
        const baseDate = invoiceDate ? new Date(invoiceDate) : new Date();
        baseDate.setDate(baseDate.getDate() + selectedCust.credit_days);
        setDueDate(baseDate.toISOString().split('T')[0]);
      } else {
        setDueDate(invoiceDate);
      }

      // Auto-detect customer's state from GSTIN
      if (selectedCust.gstin && selectedCust.gstin.length >= 2) {
        const custStateCode = selectedCust.gstin.substring(0, 2);
        if (INDIAN_STATES.some((s) => s.code === custStateCode)) {
          setPlaceOfSupply(custStateCode);
        }
      }
    } else {
      setDueDate('');
    }
  };

  // Line item product picker handler
  const handleItemProductSelect = (index: number, selectedProdId: string) => {
    const updated = [...items];
    const prod = products.find((p) => p.id === selectedProdId);
    if (prod) {
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productName: prod.name,
        hsnSac: prod.hsn_sac || '',
        unit: prod.unit || 'PCS',
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

  const handleItemFieldChange = (index: number, field: keyof LineItemForm, value: any) => {
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
        quantity: '1',
        unit: 'PCS',
        unitPrice: '',
        discount: '0',
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
          quantity: '1',
          unit: 'PCS',
          unitPrice: '',
          discount: '0',
          taxRate: 18,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Deterministic Line Item Computations
  const computedItems = items.map((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.unitPrice) || 0;
    const disc = parseFloat(item.discount) || 0;
    const gross = qty * rate;
    const taxable = Math.max(0, gross - disc);
    const taxRate = item.taxRate || 0;
    const taxAmount = (taxable * taxRate) / 100;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = taxAmount;
    } else {
      cgst = taxAmount / 2;
      sgst = taxAmount / 2;
    }

    const lineTotal = taxable + taxAmount;

    return {
      ...item,
      qty,
      rate,
      disc,
      gross,
      taxable,
      taxRate,
      cgst,
      sgst,
      igst,
      taxAmount,
      lineTotal,
    };
  });

  const totalGross = computedItems.reduce((acc, it) => acc + it.gross, 0);
  const totalDiscount = computedItems.reduce((acc, it) => acc + it.disc, 0);
  const totalTaxable = computedItems.reduce((acc, it) => acc + it.taxable, 0);
  const totalCgst = computedItems.reduce((acc, it) => acc + it.cgst, 0);
  const totalSgst = computedItems.reduce((acc, it) => acc + it.sgst, 0);
  const totalIgst = computedItems.reduce((acc, it) => acc + it.igst, 0);
  const totalTax = isInterState ? totalIgst : totalCgst + totalSgst;
  const grandTotal = Math.round(totalTaxable + totalTax);

  const handleSubmit = async (submitStatus: InvoiceStatus = 'issued') => {
    if (!customerId) {
      setErrorMsg('Please select a customer for this invoice.');
      return;
    }

    if (!dueDate) {
      setErrorMsg('Please specify a valid payment due date.');
      return;
    }

    const validItems = computedItems.filter(
      (it) => it.productName.trim() && it.qty > 0 && it.rate >= 0
    );

    if (validItems.length === 0) {
      setErrorMsg('Please enter at least one line item with a description, quantity, and unit price.');
      return;
    }

    if (grandTotal <= 0) {
      setErrorMsg('Invoice grand total must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const placeOfSupplyName = getStateNameByCode(placeOfSupply) || 'Same State';

      await createNewInvoice({
        customerId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceType,
        status: submitStatus,
        issueDate: invoiceDate,
        invoiceDate,
        dueDate,
        placeOfSupply: placeOfSupplyName,
        subtotal: totalGross,
        discountTotal: totalDiscount,
        taxableAmount: totalTaxable,
        cgst: Math.round(totalCgst * 100) / 100,
        sgst: Math.round(totalSgst * 100) / 100,
        igst: Math.round(totalIgst * 100) / 100,
        cess: 0,
        totalAmount: grandTotal,
        items: validItems.map((item) => ({
          productId: item.productId || undefined,
          productName: item.productName.trim(),
          hsnSac: item.hsnSac.trim() || undefined,
          quantity: item.qty,
          unit: item.unit || 'PCS',
          unitPrice: item.rate,
          discount: item.disc,
          taxRate: item.taxRate,
          taxableAmount: item.taxable,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          cess: 0,
          lineTotal: item.lineTotal,
        })),
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
      id="create-invoice-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-2xs">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">New Sales Invoice</h3>
              <p className="text-xs text-slate-500">
                GST-compliant B2B wholesale billing with deterministic tax calculation
              </p>
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit('issued');
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        >
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Party & Metadata Grid */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Selection */}
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Billed Customer / Firm *
                  </label>
                  {onOpenAddCustomer && (
                    <button
                      type="button"
                      onClick={onOpenAddCustomer}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      + Add New Customer
                    </button>
                  )}
                </div>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  id="create-invoice-cust-select"
                >
                  <option value="">-- Select Registered Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name ? `${c.business_name} (${c.name})` : c.name}
                      {c.gstin ? ` • ${c.gstin}` : ''}
                      {c.credit_days ? ` • ${c.credit_days}d credit` : ''}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    No customers found in ledger. Please add a customer first.
                  </p>
                )}
              </div>

              {/* Invoice Number */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder={`Auto: ${nextSeqPreview}`}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  id="create-invoice-num-input"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Sequential next in sequence: <span className="font-mono font-bold text-slate-700">{nextSeqPreview}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Invoice Date */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  id="create-invoice-date-input"
                />
              </div>

              {/* Due Date */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  id="create-invoice-due-date"
                />
              </div>

              {/* Place of Supply */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Place of Supply (GST State) *
                </label>
                <select
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.code} - {st.name}
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                  {isInterState ? (
                    <span className="text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Inter-State (IGST Applicable)
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Intra-State (CGST + SGST Applicable)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Line Items ({items.length})
              </span>
              <div className="flex items-center gap-3">
                {onOpenAddProduct && (
                  <button
                    type="button"
                    onClick={onOpenAddProduct}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    + New Product
                  </button>
                )}
                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  id="add-invoice-line-item-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </div>

            <div className="p-3 overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                    <th className="pb-2 w-[34%]">Product / Description</th>
                    <th className="pb-2 w-[10%]">HSN/SAC</th>
                    <th className="pb-2 w-[10%] text-right">Qty</th>
                    <th className="pb-2 w-[10%] text-center">Unit</th>
                    <th className="pb-2 w-[12%] text-right">Rate (₹)</th>
                    <th className="pb-2 w-[10%] text-right">Disc (₹)</th>
                    <th className="pb-2 w-[10%] text-center">GST %</th>
                    <th className="pb-2 w-[4%]"></th>
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
                            className="w-full mb-1 px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700"
                          >
                            <option value="">-- Catalog Item or Custom Description --</option>
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
                          placeholder="Item name / description"
                          required
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </td>

                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => handleItemFieldChange(idx, 'hsnSac', e.target.value)}
                          placeholder="8544"
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-center"
                        />
                      </td>

                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                          placeholder="1"
                          required
                          className="w-full px-2 py-1.5 text-xs text-right border border-slate-200 rounded bg-slate-50 text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-2 pr-2">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value)}
                          className="w-full px-1.5 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 text-slate-800 text-center font-medium"
                        >
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
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
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => handleItemFieldChange(idx, 'discount', e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1.5 text-xs text-right border border-slate-200 rounded bg-slate-50 text-slate-700 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="py-2 pr-2">
                        <select
                          value={item.taxRate}
                          onChange={(e) => handleItemFieldChange(idx, 'taxRate', Number(e.target.value))}
                          className="w-full px-1.5 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 text-center font-medium"
                        >
                          <option value={18}>18%</option>
                          <option value={12}>12%</option>
                          <option value={28}>28%</option>
                          <option value={5}>5%</option>
                          <option value={0}>0% (Exempt)</option>
                        </select>
                      </td>

                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
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

          {/* Deterministic Tax Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Remarks & Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dispatched via express transport, LR #49281"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-sans"
                />
              </div>
            </div>

            {/* Calculated Breakdown Card */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs font-sans">
              <div className="flex justify-between text-slate-300">
                <span>Taxable Value (Subtotal):</span>
                <span className="font-mono font-bold">{formatINR(totalTaxable)}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Total Discount Applied:</span>
                  <span className="font-mono font-bold">-{formatINR(totalDiscount)}</span>
                </div>
              )}

              {isInterState ? (
                <div className="flex justify-between text-slate-300">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-mono font-bold">+{formatINR(totalIgst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-300">
                    <span>Central GST (CGST):</span>
                    <span className="font-mono font-bold">+{formatINR(totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>State GST (SGST):</span>
                    <span className="font-mono font-bold">+{formatINR(totalSgst)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono text-base">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting || grandTotal <= 0}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition cursor-pointer"
              >
                Save as Draft
              </button>

              <button
                type="submit"
                disabled={isSubmitting || grandTotal <= 0}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition shadow-xs cursor-pointer"
                id="submit-create-invoice-btn"
              >
                {isSubmitting
                  ? 'Issuing Invoice...'
                  : grandTotal > 0
                  ? `Issue Tax Invoice (${formatINR(grandTotal)})`
                  : 'Issue Tax Invoice'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
