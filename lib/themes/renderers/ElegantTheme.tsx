import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const ElegantTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-serif p-8 text-xs leading-normal border border-amber-200 shadow-md ${
        isPrintMode ? 'print:p-0 print:border-none print:shadow-none' : ''
      }`}
    >
      {/* Top Banner */}
      <div className="text-center border-b-2 border-amber-600 pb-4 mb-6">
        <span className="text-[10px] font-sans font-bold tracking-widest text-amber-700 uppercase block mb-1">
          TAX INVOICE
        </span>
        <h1 className="text-2xl font-normal text-slate-900 tracking-wide font-serif">
          {seller.legalName || seller.name}
        </h1>
        <p className="text-[11px] font-sans text-slate-600 max-w-lg mx-auto mt-1">{seller.formattedAddress}</p>
        {seller.gstin && <p className="font-sans font-bold text-amber-800 text-[11px] mt-1">GSTIN: {seller.gstin}</p>}
      </div>

      {/* Info Bar */}
      <div className="flex justify-between items-start font-sans mb-6 bg-amber-50/50 p-4 rounded-lg border border-amber-200 text-xs">
        <div>
          <p className="text-[10px] font-bold uppercase text-amber-900 tracking-wider mb-1">Prepared For:</p>
          <p className="font-bold text-slate-900 text-sm">{buyer.businessName || buyer.name}</p>
          <p className="text-slate-600">{buyer.billingAddress}</p>
          {buyer.gstin && <p className="font-mono font-semibold text-slate-900 mt-1">GSTIN: {buyer.gstin}</p>}
        </div>

        <div className="text-right font-mono space-y-1">
          <p className="text-sm font-bold text-amber-950">{meta.invoiceNumber}</p>
          <p className="text-slate-600">Date: {formatDate(meta.issueDate)}</p>
          <p className="text-slate-600">Due: {formatDate(meta.dueDate)}</p>
        </div>
      </div>

      {/* Elegant Table */}
      <table className="w-full text-left text-xs mb-6 font-sans border-collapse">
        <thead>
          <tr className="border-b-2 border-amber-600 text-amber-950 font-bold uppercase text-[10px] tracking-wider">
            <th className="py-2.5 px-2 text-center w-8">#</th>
            <th className="py-2.5 px-3">Description</th>
            <th className="py-2.5 px-2 text-center">HSN</th>
            <th className="py-2.5 px-2 text-center">Qty</th>
            <th className="py-2.5 px-2 text-right">Price</th>
            <th className="py-2.5 px-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-3 px-2 text-center font-mono text-slate-400">{idx + 1}</td>
              <td className="py-3 px-3 font-semibold text-slate-900">{item.description}</td>
              <td className="py-3 px-2 text-center font-mono text-slate-500">{item.hsnSac || '—'}</td>
              <td className="py-3 px-2 text-center font-mono">{item.quantity}</td>
              <td className="py-3 px-2 text-right font-mono">{formatINR(item.unitPrice)}</td>
              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatINR(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-6 border-t-2 border-amber-600 pt-4 font-sans">
        <div>
          <p className="text-[10px] font-bold text-amber-900 uppercase">Total Amount in Words:</p>
          <p className="font-serif italic font-bold text-slate-900 text-xs mt-0.5">{totals.amountInWords}</p>
          {bankDetails && (
            <p className="text-[10px] font-mono text-slate-600 mt-3">
              Bank: {bankDetails.bankName} | A/C: {bankDetails.accountNumber} | IFSC: {bankDetails.ifscCode}
            </p>
          )}
        </div>

        <div className="space-y-2 font-mono text-right">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST:</span>
            <span>{formatINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-amber-950 bg-amber-100/60 p-2 rounded border border-amber-300">
            <span>Grand Total:</span>
            <span>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
