import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const RetailCompactTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-sans p-4 text-[11px] leading-tight border border-slate-300 ${
        isPrintMode ? 'print:p-0 print:border-none' : ''
      }`}
    >
      {/* Compact Store Header */}
      <div className="text-center border-b pb-2 mb-2">
        <h1 className="text-base font-black uppercase text-slate-900">{seller.name}</h1>
        <p className="text-[10px] text-slate-600">{seller.formattedAddress}</p>
        <p className="text-[10px] font-mono text-slate-800 font-bold mt-0.5">
          GSTIN: {seller.gstin || 'Unregistered'} | Ph: {seller.phone || 'N/A'}
        </p>
      </div>

      {/* Meta Row */}
      <div className="flex justify-between border-b pb-2 mb-2 font-mono text-[10px] bg-slate-50 p-1.5 rounded">
        <div>
          <span>INV: <strong>{meta.invoiceNumber}</strong></span>
          <span className="ml-3">Date: {formatDate(meta.issueDate)}</span>
        </div>
        <div>
          <span>Customer: <strong>{buyer.name}</strong></span>
          {buyer.gstin && <span className="ml-2 font-bold">({buyer.gstin})</span>}
        </div>
      </div>

      {/* High Density Table */}
      <table className="w-full text-left text-[11px] border-collapse mb-2">
        <thead>
          <tr className="bg-slate-800 text-white font-bold uppercase text-[9px]">
            <th className="py-1 px-1">Item</th>
            <th className="py-1 px-1 text-center">Qty</th>
            <th className="py-1 px-1 text-right">Rate</th>
            <th className="py-1 px-1 text-right">Tax%</th>
            <th className="py-1 px-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-1 px-1 font-semibold">{item.description}</td>
              <td className="py-1 px-1 text-center font-mono">{item.quantity}</td>
              <td className="py-1 px-1 text-right font-mono">{formatINR(item.unitPrice, { showSymbol: false })}</td>
              <td className="py-1 px-1 text-right font-mono text-slate-600">{item.taxRate}%</td>
              <td className="py-1 px-1 text-right font-mono font-bold">{formatINR(item.lineTotal, { showSymbol: false })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Total Bar */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-2 rounded font-mono">
        <span className="text-[10px] uppercase font-bold tracking-wider">Total Amount:</span>
        <span className="text-base font-black text-amber-300">{formatINR(totals.grandTotal)}</span>
      </div>
      <p className="text-center text-[9px] text-slate-500 mt-2 italic">Thank you for shopping with us!</p>
    </div>
  );
};
