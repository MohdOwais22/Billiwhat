import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const WholesaleProTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails, termsAndConditions } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-sans p-6 border-2 border-indigo-900 text-xs leading-normal ${
        isPrintMode ? 'print:p-0 print:border-none' : ''
      }`}
    >
      {/* Header */}
      <div className="bg-indigo-950 text-white p-4 mb-3 rounded-t flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest block font-bold">
            WHOLESALE B2B BILL OF SUPPLY / TAX INVOICE
          </span>
          <h1 className="text-xl font-black uppercase tracking-tight">{seller.legalName || seller.name}</h1>
          <p className="text-[11px] text-indigo-200 mt-0.5">{seller.formattedAddress}</p>
          <p className="text-[11px] font-mono font-bold text-amber-300 mt-0.5">GSTIN: {seller.gstin}</p>
        </div>
        <div className="text-right font-mono">
          <div className="text-lg font-black text-amber-300">{meta.invoiceNumber}</div>
          <p className="text-xs text-indigo-200">Date: {formatDate(meta.issueDate)}</p>
        </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-2 gap-3 border border-indigo-200 p-3 mb-3 bg-indigo-50/20 rounded">
        <div>
          <p className="text-[10px] font-bold uppercase text-indigo-900 tracking-wider">Wholesale Buyer / Merchant:</p>
          <p className="font-bold text-sm text-slate-900">{buyer.businessName || buyer.name}</p>
          <p className="text-slate-600 whitespace-pre-line">{buyer.billingAddress}</p>
          {buyer.gstin && <p className="font-mono font-bold text-indigo-900 mt-1">GSTIN: {buyer.gstin}</p>}
        </div>

        <div className="text-right space-y-1 font-mono text-[11px]">
          <p className="text-[10px] font-bold uppercase text-indigo-900 tracking-wider">Supply & Terms:</p>
          <p>Payment Term: <strong>Due in 15 Days</strong></p>
          <p>Place of Supply: <strong>{meta.placeOfSupply}</strong></p>
          <p>Due Date: <strong>{formatDate(meta.dueDate)}</strong></p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-3">
        <thead>
          <tr className="bg-indigo-900 text-white font-bold uppercase text-[10px]">
            <th className="p-2 border-r border-indigo-800 text-center w-8">#</th>
            <th className="p-2 border-r border-indigo-800">Product Particulars</th>
            <th className="p-2 border-r border-indigo-800 text-center">HSN</th>
            <th className="p-2 border-r border-indigo-800 text-center">Qty / UOM</th>
            <th className="p-2 border-r border-indigo-800 text-right">Wholesale Rate</th>
            <th className="p-2 border-r border-indigo-800 text-right">Disc</th>
            <th className="p-2 border-r border-indigo-800 text-right">Tax%</th>
            <th className="p-2 text-right">Net Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, idx) => (
            <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-indigo-50/30' : ''}>
              <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
              <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{item.description}</td>
              <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600">{item.hsnSac || '—'}</td>
              <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">{item.quantity} {item.unit}</td>
              <td className="p-2 border-r border-slate-200 text-right font-mono">{formatINR(item.unitPrice, { showSymbol: false })}</td>
              <td className="p-2 border-r border-slate-200 text-right font-mono text-rose-700">{item.discount > 0 ? formatINR(item.discount, { showSymbol: false }) : '—'}</td>
              <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-600">{item.taxRate}%</td>
              <td className="p-2 text-right font-mono font-bold text-indigo-950">{formatINR(item.lineTotal, { showSymbol: false })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 border-t-2 border-indigo-900 pt-3">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Amount in Words:</p>
          <p className="font-bold text-slate-900 capitalize text-[11px]">{totals.amountInWords}</p>
          {bankDetails && (
            <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[10px] space-y-0.5">
              <p className="font-bold text-indigo-900 uppercase">NEFT / RTGS Transfer Details</p>
              <p>Bank: {bankDetails.bankName} | A/C: {bankDetails.accountNumber}</p>
              <p>IFSC: {bankDetails.ifscCode} | UPI: {bankDetails.upiId}</p>
            </div>
          )}
        </div>

        <div className="space-y-1 font-mono text-right">
          <div className="flex justify-between text-slate-600">
            <span>Wholesale Subtotal:</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST Amount:</span>
            <span>{formatINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-white bg-indigo-950 p-2 rounded mt-2">
            <span>Net Payable:</span>
            <span className="text-amber-300">{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
