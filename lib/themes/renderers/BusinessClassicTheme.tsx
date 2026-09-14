import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const BusinessClassicTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails, termsAndConditions } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-800 font-sans p-8 text-xs leading-normal ${
        isPrintMode ? 'print:p-0' : ''
      }`}
    >
      {/* Top Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{seller.legalName || seller.name}</h1>
          <p className="text-slate-600 font-medium max-w-md mt-1">{seller.formattedAddress}</p>
          <div className="flex gap-3 text-slate-600 font-medium mt-1">
            {seller.phone && <span>Ph: {seller.phone}</span>}
            {seller.email && <span>Email: {seller.email}</span>}
          </div>
          {seller.gstin && <p className="font-mono text-slate-900 font-bold mt-1">GSTIN: {seller.gstin}</p>}
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest rounded mb-2">
            INVOICE
          </span>
          <p className="text-sm font-mono font-bold text-slate-900">{meta.invoiceNumber}</p>
          <p className="text-slate-500 text-[11px] mt-1">Date: {formatDate(meta.issueDate)}</p>
          <p className="text-slate-500 text-[11px]">Due: {formatDate(meta.dueDate)}</p>
        </div>
      </div>

      {/* Billed To Box */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mb-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Billed To:</p>
          <p className="font-bold text-slate-900 text-sm">{buyer.businessName || buyer.name}</p>
          {buyer.businessName && <p className="text-slate-600 font-medium">Attn: {buyer.name}</p>}
          <p className="text-slate-600 mt-1 whitespace-pre-line">{buyer.billingAddress}</p>
          {buyer.gstin && <p className="font-mono text-slate-900 font-semibold mt-1">GSTIN: {buyer.gstin}</p>}
        </div>

        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Payment Status:</p>
          <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase bg-slate-200 text-slate-800">
            {meta.status}
          </span>
          <p className="text-slate-600 text-[11px] pt-2">Place of Supply: <strong className="text-slate-800">{meta.placeOfSupply}</strong></p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left text-xs border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-slate-800 text-slate-900 font-bold uppercase text-[10px]">
            <th className="py-2 px-2 text-center w-8">#</th>
            <th className="py-2 px-3">Description</th>
            <th className="py-2 px-2 text-center">HSN/SAC</th>
            <th className="py-2 px-2 text-center">Qty</th>
            <th className="py-2 px-2 text-right">Price</th>
            <th className="py-2 px-2 text-right">Tax</th>
            <th className="py-2 px-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-3 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>
              <td className="py-3 px-3 font-semibold text-slate-900">{item.description}</td>
              <td className="py-3 px-2 text-center font-mono text-slate-600">{item.hsnSac || '—'}</td>
              <td className="py-3 px-2 text-center font-mono">{item.quantity} {item.unit}</td>
              <td className="py-3 px-2 text-right font-mono">{formatINR(item.unitPrice)}</td>
              <td className="py-3 px-2 text-right font-mono text-slate-600">{item.taxRate}%</td>
              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatINR(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="grid grid-cols-2 gap-6 border-t-2 border-slate-800 pt-4">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Amount in Words:</p>
            <p className="font-semibold text-slate-900 capitalize italic text-xs">{totals.amountInWords}</p>
          </div>
          {bankDetails && (
            <div className="text-[11px] text-slate-600 space-y-0.5 font-mono bg-slate-50 p-3 rounded border border-slate-200">
              <p className="font-bold text-slate-800">BANK ACCOUNT DETAILS</p>
              <p>Bank: {bankDetails.bankName}</p>
              <p>A/C: {bankDetails.accountNumber}</p>
              <p>IFSC: {bankDetails.ifscCode}</p>
            </div>
          )}
        </div>

        <div className="space-y-2 font-mono text-right">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          {totals.discountTotal > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Discount:</span>
              <span>-{formatINR(totals.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Tax Amount:</span>
            <span>{formatINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between text-lg font-black text-slate-900 border-t-2 border-slate-800 pt-2">
            <span>Total:</span>
            <span>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
