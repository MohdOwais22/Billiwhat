import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const MultiBranchTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-sans p-6 border-2 border-slate-900 text-xs leading-normal ${
        isPrintMode ? 'print:p-0 print:border-none' : ''
      }`}
    >
      {/* Header with Head Office & Branch Address */}
      <div className="border-b-2 border-slate-900 pb-3 mb-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase text-slate-900">{seller.legalName || seller.name}</h1>
            <p className="font-mono text-xs font-bold text-slate-900">GSTIN: {seller.gstin}</p>
          </div>
          <div className="text-right font-mono">
            <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
              MULTI-BRANCH TAX INVOICE
            </span>
            <p className="text-sm font-black text-slate-900 mt-1">{meta.invoiceNumber}</p>
            <p className="text-slate-600 text-[10px]">{formatDate(meta.issueDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-200 text-[11px]">
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[9px] font-bold uppercase text-slate-500 block">Registered Head Office:</span>
            <p className="text-slate-800 font-medium">{seller.formattedAddress}</p>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[9px] font-bold uppercase text-slate-500 block">Dispatch Branch / Godown:</span>
            <p className="text-slate-800 font-medium">{seller.branchAddress || seller.formattedAddress}</p>
          </div>
        </div>
      </div>

      {/* Buyer */}
      <div className="p-3 border border-slate-900 mb-3 bg-slate-50/30 text-xs">
        <span className="text-[10px] font-bold uppercase text-slate-500 block">Billed Customer / Branch:</span>
        <p className="font-bold text-slate-900 text-sm">{buyer.businessName || buyer.name}</p>
        <p className="text-slate-700">{buyer.billingAddress}</p>
        {buyer.gstin && <p className="font-mono font-bold text-slate-900 mt-1">GSTIN: {buyer.gstin}</p>}
      </div>

      {/* Items */}
      <table className="w-full text-left text-xs border-collapse border-2 border-slate-900 mb-3">
        <thead>
          <tr className="bg-slate-900 text-white font-bold uppercase text-[9px]">
            <th className="p-2 border-r border-slate-700 text-center w-8">#</th>
            <th className="p-2 border-r border-slate-700">Item Description</th>
            <th className="p-2 border-r border-slate-700 text-center">HSN</th>
            <th className="p-2 border-r border-slate-700 text-center">Qty</th>
            <th className="p-2 border-r border-slate-700 text-right">Price</th>
            <th className="p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
              <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{item.description}</td>
              <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-600">{item.hsnSac || '—'}</td>
              <td className="p-2 border-r border-slate-300 text-center font-mono">{item.quantity} {item.unit}</td>
              <td className="p-2 border-r border-slate-300 text-right font-mono">{formatINR(item.unitPrice, { showSymbol: false })}</td>
              <td className="p-2 text-right font-mono font-bold text-slate-900">{formatINR(item.lineTotal, { showSymbol: false })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 border-2 border-slate-900 p-3">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Amount in Words:</p>
          <p className="font-bold text-slate-900 text-[11px] capitalize">{totals.amountInWords}</p>
        </div>

        <div className="space-y-1 font-mono text-right">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST Total:</span>
            <span>{formatINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-white bg-slate-900 p-2 rounded mt-1">
            <span>Grand Total:</span>
            <span>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
