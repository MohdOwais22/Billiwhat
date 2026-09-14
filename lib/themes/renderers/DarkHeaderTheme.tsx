import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const DarkHeaderTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-sans p-6 text-xs leading-normal shadow-sm ${
        isPrintMode ? 'print:p-0 print:shadow-none' : ''
      }`}
    >
      {/* Dark Slate Top Block */}
      <div className="bg-slate-950 text-white p-6 rounded-xl mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">{seller.legalName || seller.name}</h1>
          <p className="text-slate-400 text-[11px] mt-1 max-w-sm">{seller.formattedAddress}</p>
          {seller.gstin && <p className="text-emerald-400 font-mono text-[11px] font-bold mt-1">GSTIN: {seller.gstin}</p>}
        </div>

        <div className="text-right font-mono">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
            TAX INVOICE
          </span>
          <p className="text-lg font-black text-amber-400">{meta.invoiceNumber}</p>
          <p className="text-slate-300 text-[11px] mt-1">Date: {formatDate(meta.issueDate)}</p>
        </div>
      </div>

      {/* Customer Box */}
      <div className="grid grid-cols-2 gap-4 mb-4 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Billed To:</p>
          <p className="font-bold text-slate-900">{buyer.businessName || buyer.name}</p>
          <p className="text-slate-600">{buyer.billingAddress}</p>
          {buyer.gstin && <p className="font-mono font-bold text-slate-900 mt-1">GSTIN: {buyer.gstin}</p>}
        </div>

        <div className="text-right font-mono space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Invoice Details:</p>
          <p className="text-slate-700">Due Date: <strong>{formatDate(meta.dueDate)}</strong></p>
          <p className="text-slate-700">Place of Supply: <strong>{meta.placeOfSupply}</strong></p>
        </div>
      </div>

      {/* Crisp White Table */}
      <table className="w-full text-left text-xs mb-4 border border-slate-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
            <th className="p-2.5 text-center w-8">#</th>
            <th className="p-2.5">Item Particulars</th>
            <th className="p-2.5 text-center">HSN</th>
            <th className="p-2.5 text-center">Qty</th>
            <th className="p-2.5 text-right">Rate</th>
            <th className="p-2.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
              <td className="p-2.5 font-bold text-slate-900">{item.description}</td>
              <td className="p-2.5 text-center font-mono text-slate-600">{item.hsnSac || '—'}</td>
              <td className="p-2.5 text-center font-mono">{item.quantity} {item.unit}</td>
              <td className="p-2.5 text-right font-mono">{formatINR(item.unitPrice)}</td>
              <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatINR(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom Totals */}
      <div className="grid grid-cols-2 gap-4 border-t-2 border-slate-950 pt-3">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total Amount in Words:</p>
          <p className="font-bold text-slate-900 text-[11px] capitalize">{totals.amountInWords}</p>
        </div>

        <div className="space-y-1 font-mono text-right">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Taxes:</span>
            <span>{formatINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-white bg-slate-950 p-2 rounded mt-2">
            <span>Grand Total:</span>
            <span className="text-amber-400">{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
