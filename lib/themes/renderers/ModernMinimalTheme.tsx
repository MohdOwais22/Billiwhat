import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const ModernMinimalTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-800 font-sans p-8 text-xs leading-relaxed ${
        isPrintMode ? 'print:p-0' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-baseline mb-8 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{seller.name}</h1>
          <p className="text-slate-500 text-[11px] mt-0.5">{seller.formattedAddress}</p>
          {seller.gstin && <p className="text-slate-500 font-mono text-[10px] mt-0.5">GSTIN: {seller.gstin}</p>}
        </div>
        <div className="text-right font-mono">
          <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase">INVOICE</p>
          <p className="text-base font-bold text-slate-900">{meta.invoiceNumber}</p>
          <p className="text-slate-500 text-[10px] mt-1">{formatDate(meta.issueDate)}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
          <p className="font-bold text-slate-900 text-sm">{buyer.businessName || buyer.name}</p>
          {buyer.businessName && <p className="text-slate-500 font-medium">Attn: {buyer.name}</p>}
          <p className="text-slate-500 mt-1">{buyer.billingAddress}</p>
          {buyer.gstin && <p className="font-mono text-slate-700 text-[11px] mt-1">GSTIN: {buyer.gstin}</p>}
        </div>
        <div className="text-right space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Details</span>
          <p className="text-slate-600">Due Date: <span className="font-medium font-mono text-slate-900">{formatDate(meta.dueDate)}</span></p>
          <p className="text-slate-600">Place of Supply: <span className="font-medium text-slate-900">{meta.placeOfSupply}</span></p>
        </div>
      </div>

      {/* Minimal Table */}
      <table className="w-full text-left text-xs mb-8">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400 font-medium text-[10px] uppercase tracking-wider">
            <th className="py-2">Item</th>
            <th className="py-2 text-center">HSN</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-3 font-medium text-slate-900">{item.description}</td>
              <td className="py-3 text-center font-mono text-slate-500">{item.hsnSac || '—'}</td>
              <td className="py-3 text-center font-mono">{item.quantity}</td>
              <td className="py-3 text-right font-mono text-slate-600">{formatINR(item.unitPrice)}</td>
              <td className="py-3 text-right font-mono font-semibold text-slate-900">{formatINR(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom Totals */}
      <div className="flex justify-between items-start border-t border-slate-200 pt-6">
        <div className="max-w-xs text-slate-500 space-y-2">
          <p className="text-[11px]"><strong className="text-slate-700">In Words:</strong> {totals.amountInWords}</p>
          {bankDetails && (
            <p className="text-[10px] font-mono text-slate-400">
              Pay via Bank: {bankDetails.bankName} | A/C: {bankDetails.accountNumber} | IFSC: {bankDetails.ifscCode}
            </p>
          )}
        </div>

        <div className="w-60 font-mono text-right space-y-1.5">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tax</span>
            <span>{formatINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total</span>
            <span>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
