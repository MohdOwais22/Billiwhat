'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Printer, Download, ReceiptText, Building2, User, CheckCircle2 } from 'lucide-react';
import { Customer, GstProfile, InvoiceItem, InvoiceWithDetails, Organization } from '@/types/database';
import { formatDate, formatINR, numberToINRWords, getInvoiceStatusConfig } from '@/lib/utils/formatters';
import { fetchInvoiceItems } from '@/lib/services/dashboardService';
import { APP_NAME } from '@/config/brand';

interface PrintInvoiceModalProps {
  invoice: InvoiceWithDetails | null;
  organization?: Organization;
  gstProfile?: GstProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintInvoiceModal({
  invoice,
  organization,
  gstProfile,
  isOpen,
  onClose,
}: PrintInvoiceModalProps) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && invoice?.id) {
      setLoading(true);
      fetchInvoiceItems(invoice.id)
        .then((data) => setItems(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const customer = invoice.customer;
  const isInterState = Boolean(invoice.igst && invoice.igst > 0);
  const statusConfig = getInvoiceStatusConfig(invoice.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      id="print-invoice-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Control Bar (Hidden on actual print) */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-slate-700" />
            <span className="text-sm font-bold text-slate-900 font-mono">
              Print Preview: {invoice.invoice_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
              id="print-invoice-btn"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Close print preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/50 print:bg-white print:p-0">
          <div
            ref={printContentRef}
            className="max-w-[800px] mx-auto bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900"
            id="printable-tax-invoice-document"
          >
            {/* Header Header & Title */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    {organization?.legal_name || organization?.name || 'B2B Wholesale Merchant'}
                  </h1>
                  {organization?.legal_name && organization.name && organization.name !== organization.legal_name && (
                    <p className="text-xs text-slate-600 font-medium">Trade Name: {organization.name}</p>
                  )}
                  <p className="text-xs text-slate-600 mt-1 max-w-md">
                    {[
                      organization?.address_line1,
                      organization?.address_line2,
                      organization?.city,
                      organization?.state,
                      organization?.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 mt-2 font-medium">
                    {(gstProfile?.gstin || organization?.gstin) && (
                      <p>
                        <span className="font-bold">GSTIN:</span>{' '}
                        <span className="font-mono">{gstProfile?.gstin || organization?.gstin}</span>
                      </p>
                    )}
                    {organization?.phone && (
                      <p>
                        <span className="font-bold">Phone:</span> {organization.phone}
                      </p>
                    )}
                    {organization?.email && (
                      <p>
                        <span className="font-bold">Email:</span> {organization.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block border border-slate-900 px-3 py-1 bg-slate-900 text-white rounded text-xs font-black uppercase tracking-wider mb-2">
                    Tax Invoice
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Original for Recipient</p>
                  <p className="text-base font-black text-slate-900 font-mono mt-1">
                    {invoice.invoice_number}
                  </p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusConfig.badgeClass}`}>
                      {statusConfig.label.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Data & Billed Party Box */}
            <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-3.5 mb-4 text-xs">
              <div className="border-r border-slate-200 pr-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Billed To (Customer / Buyer):
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {customer?.business_name || customer?.name || 'Cash Customer'}
                </p>
                {customer?.business_name && customer.name && (
                  <p className="text-slate-600 font-medium">Attn: {customer.name}</p>
                )}
                {customer?.billing_address && (
                  <p className="text-slate-600 mt-0.5 whitespace-pre-line">{customer.billing_address}</p>
                )}
                <div className="mt-2 space-y-0.5 text-slate-700">
                  {customer?.gstin ? (
                    <p>
                      <span className="font-semibold">GSTIN/UIN:</span>{' '}
                      <span className="font-mono font-bold">{customer.gstin}</span>
                    </p>
                  ) : (
                    <p className="text-slate-500 italic">GSTIN: Unregistered Consumer / Composition</p>
                  )}
                  {customer?.phone && (
                    <p>
                      <span className="font-semibold">Mobile:</span> {customer.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="pl-1 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Invoice Details:
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Date:</span>
                  <span className="font-semibold">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Due Date:</span>
                  <span className="font-semibold">{formatDate(invoice.due_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Place of Supply:</span>
                  <span className="font-semibold">{invoice.place_of_supply || gstProfile?.place_of_supply || 'Same State'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reverse Charge:</span>
                  <span className="font-semibold">No</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Terms:</span>
                  <span className="font-semibold">{customer?.credit_days ? `${customer.credit_days} Days Credit` : 'Immediate'}</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2">Item & Description</th>
                    <th className="py-2 px-2 text-center">HSN/SAC</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Rate (₹)</th>
                    <th className="py-2 px-2 text-right">Discount</th>
                    <th className="py-2 px-2 text-right">Taxable (₹)</th>
                    <th className="py-2 px-2 text-center">GST</th>
                    <th className="py-2 px-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        Loading invoice line items...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td className="py-2.5 px-2 text-center font-mono">1</td>
                      <td className="py-2.5 px-2 font-medium">B2B Goods & Services (Consolidated)</td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-500">—</td>
                      <td className="py-2.5 px-2 text-right font-mono">1.00</td>
                      <td className="py-2.5 px-2 text-right font-mono">{formatINR(invoice.subtotal, { showSymbol: false })}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-400">0.00</td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium">{formatINR(invoice.taxable_amount || invoice.subtotal, { showSymbol: false })}</td>
                      <td className="py-2.5 px-2 text-center">18%</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold">{formatINR(invoice.total, { showSymbol: false })}</td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2 px-2 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-2">
                          <p className="font-semibold text-slate-900">{it.description}</p>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600">{it.hsn_sac || '—'}</td>
                        <td className="py-2 px-2 text-right font-mono">
                          {it.quantity} {it.unit || 'PCS'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">{formatINR(it.unit_price, { showSymbol: false })}</td>
                        <td className="py-2 px-2 text-right font-mono text-slate-500">
                          {it.discount > 0 ? formatINR(it.discount, { showSymbol: false }) : '—'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-medium">
                          {formatINR(it.taxable_amount, { showSymbol: false })}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-700">{it.tax_rate}%</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">
                          {formatINR(it.line_total, { showSymbol: false })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Summary Section */}
            <div className="grid grid-cols-12 gap-4 mb-4">
              {/* Left Column: Bank Details & Amount in Words */}
              <div className="col-span-7 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Amount Chargeable (in words):
                  </span>
                  <p className="font-bold text-slate-900 italic">
                    {numberToINRWords(invoice.total)}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Bank & Payment Instructions:
                  </span>
                  <p><span className="font-semibold">Beneficiary:</span> {organization?.legal_name || organization?.name || APP_NAME}</p>
                  <p><span className="font-semibold">Payment Mode:</span> UPI / NEFT / RTGS / Cheque</p>
                  {invoice.notes && (
                    <p className="pt-1 text-[11px] text-slate-600 border-t border-slate-200 mt-1">
                      <span className="font-semibold">Remarks:</span> {invoice.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Tax Breakdown & Total */}
              <div className="col-span-5 border border-slate-200 rounded-lg p-3 text-xs space-y-2 bg-slate-50/50">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-semibold">{formatINR(invoice.taxable_amount || invoice.subtotal)}</span>
                </div>

                {invoice.discount_total > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Total Discount:</span>
                    <span className="font-mono font-semibold">-{formatINR(invoice.discount_total)}</span>
                  </div>
                )}

                {isInterState ? (
                  <div className="flex justify-between text-slate-700">
                    <span>Integrated Tax (IGST):</span>
                    <span className="font-mono font-semibold">+{formatINR(invoice.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>Central Tax (CGST):</span>
                      <span className="font-mono font-semibold">+{formatINR(invoice.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>State Tax (SGST):</span>
                      <span className="font-mono font-semibold">+{formatINR(invoice.sgst)}</span>
                    </div>
                  </>
                )}

                {invoice.cess > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Cess:</span>
                    <span className="font-mono font-semibold">+{formatINR(invoice.cess)}</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t-2 border-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base">{formatINR(invoice.total)}</span>
                </div>

                <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-200">
                  <span>Amount Paid / Settled:</span>
                  <span className="font-mono font-semibold">-{formatINR(invoice.amount_paid)}</span>
                </div>

                <div className="flex justify-between font-bold text-xs text-rose-700 pt-1">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatINR(invoice.balance_due)}</span>
                </div>
              </div>
            </div>

            {/* Declarations & Signature Seal */}
            <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Declaration:
                </span>
                <p className="text-[10px] leading-relaxed text-slate-500">
                  We declare that this invoice shows the actual price of the goods and services described and that all particulars are true and correct. Standard warranty and return policies apply.
                </p>
              </div>

              <div className="text-right flex flex-col justify-end items-end">
                <p className="font-bold text-slate-800 text-[11px]">
                  For {organization?.legal_name || organization?.name || 'Business'}
                </p>
                <div className="h-14 flex items-end justify-center">
                  <span className="text-[10px] text-slate-400 italic">Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
