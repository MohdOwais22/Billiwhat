import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const ExecutiveTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-800 font-sans p-6 text-xs leading-normal shadow-sm ${
        isPrintMode ? 'print:p-0 print:shadow-none' : ''
      }`}
    >
      {/* Executive Dark Slate Header */}
      <div className="bg-slate-900 text-white p-6 rounded-t-xl mb-4 relative overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 via-indigo-400 to-amber-400 absolute top-0 left-0 right-0"></div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">{seller.legalName || seller.name}</h1>
            <p className="text-slate-300 text-[11px] mt-1 max-w-sm">{seller.formattedAddress}</p>
            {seller.gstin && <p className="text-amber-300 font-mono text-[11px] font-bold mt-1">GSTIN: {seller.gstin}</p>}
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase block mb-1">
              TAX INVOICE
            </span>
            <p className="text-lg font-extrabold text-amber-300">{meta.invoiceNumber}</p>
            <p className="text-slate-300 text-[11px] mt-1">Date: {formatDate(meta.issueDate)}</p>
          </div>
        </div>
      </div>

      {/* Corporate Metadata Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-slate-50 border-l-4 border-slate-900 rounded-r-lg space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Billed To Client:</p>
          <p className="font-bold text-slate-900 text-sm">{buyer.businessName || buyer.name}</p>
          <p className="text-slate-600 text-[11px]">{buyer.billingAddress}</p>
          {buyer.gstin && <p className="font-mono text-slate-900 font-bold text-[11px]">GSTIN: {buyer.gstin}</p>}
        </div>

        <div className="p-3 bg-slate-50 border-r-4 border-indigo-600 rounded-l-lg space-y-1 font-mono text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Invoice Specs:</p>
          <p className="text-slate-700">Due Date: <strong className="text-slate-900">{formatDate(meta.dueDate)}</strong></p>
          <p className="text-slate-700">Place of Supply: <strong className="text-slate-900">{meta.placeOfSupply}</strong></p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left text-xs mb-4 border border-slate-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
            <th className="p-2.5 text-center w-8">#</th>
            <th className="p-2.5">Item Description</th>
            <th className="p-2.5 text-center">HSN</th>
            <th className="p-2.5 text-center">Qty</th>
            <th className="p-2.5 text-right">Rate</th>
            <th className="p-2.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, idx) => (
            <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
              <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
              <td className="p-2.5 font-semibold text-slate-900">{item.description}</td>
              <td className="p-2.5 text-center font-mono text-slate-600">{item.hsnSac || '—'}</td>
              <td className="p-2.5 text-center font-mono">{item.quantity} {item.unit}</td>
              <td className="p-2.5 text-right font-mono">{formatINR(item.unitPrice)}</td>
              <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatINR(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Signature */}
      <div className="grid grid-cols-2 gap-4 border-t-2 border-slate-900 pt-3">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Amount in Words:</p>
          <p className="font-bold text-slate-900 text-[11px] capitalize">{totals.amountInWords}</p>
          {bankDetails && (
            <div className="mt-3 p-2 bg-indigo-50/50 border border-indigo-200 rounded text-[10px] font-mono text-indigo-950">
              <p className="font-bold uppercase">Corporate Settlement Details</p>
              <p>Bank: {bankDetails.bankName} | A/C: {bankDetails.accountNumber}</p>
              <p>IFSC: {bankDetails.ifscCode} | UPI: {bankDetails.upiId}</p>
            </div>
          )}
        </div>

        <div className="space-y-1.5 font-mono text-right">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST Total:</span>
            <span>{formatINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-slate-900 bg-slate-100 p-2 rounded border border-slate-300 mt-2">
            <span>Amount Payable:</span>
            <span className="text-indigo-950">{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
