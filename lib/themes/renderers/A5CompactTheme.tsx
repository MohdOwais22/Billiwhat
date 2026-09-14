import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const A5CompactTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails } = data;

  return (
    <div
      className={`w-full max-w-[580px] mx-auto bg-white text-slate-900 font-sans p-4 border border-slate-400 text-[11px] leading-tight ${
        isPrintMode ? 'print:p-0 print:border-none' : ''
      }`}
      style={{ minHeight: '148mm' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-2">
        <div>
          <h1 className="text-sm font-black uppercase text-slate-900">{seller.legalName || seller.name}</h1>
          <p className="text-[10px] text-slate-600 max-w-xs">{seller.formattedAddress}</p>
          {seller.gstin && <p className="font-mono text-[10px] font-bold text-slate-900">GSTIN: {seller.gstin}</p>}
        </div>
        <div className="text-right font-mono text-[10px]">
          <span className="font-extrabold uppercase bg-slate-900 text-white px-1.5 py-0.5 rounded text-[9px] block mb-0.5">
            TAX INVOICE (A5)
          </span>
          <p className="font-bold text-slate-900">{meta.invoiceNumber}</p>
          <p className="text-slate-500">{formatDate(meta.issueDate)}</p>
        </div>
      </div>

      {/* Buyer */}
      <div className="border border-slate-300 rounded p-1.5 mb-2 bg-slate-50 text-[10px] grid grid-cols-2 gap-2">
        <div>
          <span className="font-bold text-slate-500 uppercase block">Buyer:</span>
          <p className="font-bold text-slate-900">{buyer.businessName || buyer.name}</p>
          <p className="text-slate-600 truncate">{buyer.billingAddress}</p>
        </div>
        <div className="text-right">
          {buyer.gstin && <p className="font-mono font-bold text-slate-900">GSTIN: {buyer.gstin}</p>}
          <p className="text-slate-600">POS: {meta.placeOfSupply}</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left text-[10px] border-collapse mb-2 border border-slate-300">
        <thead>
          <tr className="bg-slate-200 text-slate-900 font-bold uppercase border-b border-slate-300">
            <th className="py-1 px-1 border-r border-slate-300 w-6 text-center">#</th>
            <th className="py-1 px-1.5 border-r border-slate-300">Item</th>
            <th className="py-1 px-1 border-r border-slate-300 text-center">Qty</th>
            <th className="py-1 px-1 border-r border-slate-300 text-right">Rate</th>
            <th className="py-1 px-1 text-right">Amt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-1 px-1 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
              <td className="py-1 px-1.5 border-r border-slate-300 font-medium text-slate-900">{item.description}</td>
              <td className="py-1 px-1 border-r border-slate-300 text-center font-mono">{item.quantity}</td>
              <td className="py-1 px-1 border-r border-slate-300 text-right font-mono">{formatINR(item.unitPrice, { showSymbol: false })}</td>
              <td className="py-1 px-1 text-right font-mono font-bold">{formatINR(item.lineTotal, { showSymbol: false })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-between items-end border-t-2 border-slate-900 pt-2 text-[10px]">
        <div>
          {bankDetails && (
            <p className="font-mono text-[9px] text-slate-600">
              Bank: {bankDetails.bankName} | A/C: {bankDetails.accountNumber} | IFSC: {bankDetails.ifscCode}
            </p>
          )}
        </div>
        <div className="font-mono text-right">
          <div className="text-slate-600">Tax: {formatINR(totals.cgst + totals.sgst + totals.igst)}</div>
          <div className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded mt-0.5 border border-slate-300">
            TOTAL: {formatINR(totals.grandTotal)}
          </div>
        </div>
      </div>
    </div>
  );
};
