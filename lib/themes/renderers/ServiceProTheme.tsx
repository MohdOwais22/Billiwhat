import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const ServiceProTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails, termsAndConditions } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-800 font-sans p-8 text-xs leading-relaxed ${
        isPrintMode ? 'print:p-0' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">{seller.legalName || seller.name}</h1>
          <p className="text-slate-500 font-medium text-[11px] mt-0.5">Professional Services & Consulting</p>
          <p className="text-slate-600 text-[11px] mt-1">{seller.formattedAddress}</p>
          {seller.gstin && <p className="font-mono text-slate-900 font-bold text-[11px] mt-0.5">GSTIN: {seller.gstin}</p>}
        </div>

        <div className="text-right font-mono">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">
            SERVICE INVOICE
          </span>
          <p className="text-lg font-extrabold text-slate-900">{meta.invoiceNumber}</p>
          <p className="text-slate-500 text-[11px] mt-1">Issue Date: {formatDate(meta.issueDate)}</p>
          <p className="text-slate-500 text-[11px]">Due Date: {formatDate(meta.dueDate)}</p>
        </div>
      </div>

      {/* Client Box */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Client Organization:</span>
          <p className="font-bold text-slate-900 text-sm">{buyer.businessName || buyer.name}</p>
          <p className="text-slate-600 mt-1">{buyer.billingAddress}</p>
          {buyer.gstin && <p className="font-mono text-slate-900 font-bold mt-1">GSTIN: {buyer.gstin}</p>}
        </div>

        <div className="text-right font-mono text-[11px] space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Engagement Details:</span>
          <p className="text-slate-600">Place of Supply: <strong>{meta.placeOfSupply}</strong></p>
          <p className="text-slate-600">Status: <strong className="uppercase text-indigo-600">{meta.status}</strong></p>
        </div>
      </div>

      {/* Service Table */}
      <table className="w-full text-left text-xs mb-6">
        <thead>
          <tr className="border-b-2 border-slate-800 text-slate-900 font-bold uppercase text-[10px] tracking-wider">
            <th className="py-2.5">Service Description</th>
            <th className="py-2.5 text-center">SAC Code</th>
            <th className="py-2.5 text-center">Hours / Units</th>
            <th className="py-2.5 text-right">Rate</th>
            <th className="py-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-3 pr-4 font-semibold text-slate-900">
                {item.description}
                <span className="block text-[11px] text-slate-500 font-normal mt-0.5">Professional service deliverable</span>
              </td>
              <td className="py-3 text-center font-mono text-indigo-700 font-bold">{item.hsnSac || '998313'}</td>
              <td className="py-3 text-center font-mono">{item.quantity} {item.unit}</td>
              <td className="py-3 text-right font-mono">{formatINR(item.unitPrice)}</td>
              <td className="py-3 text-right font-mono font-bold text-slate-900">{formatINR(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Terms */}
      <div className="grid grid-cols-2 gap-8 border-t-2 border-slate-800 pt-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Amount in Words:</p>
          <p className="font-bold text-slate-900 capitalize text-xs">{totals.amountInWords}</p>
          {bankDetails && (
            <div className="mt-3 p-3 bg-indigo-50/40 rounded-lg border border-indigo-100 font-mono text-[11px] space-y-0.5">
              <p className="font-bold text-indigo-900 uppercase">Bank Remittance Instructions</p>
              <p>Bank Name: {bankDetails.bankName}</p>
              <p>Account No: {bankDetails.accountNumber}</p>
              <p>IFSC Code: {bankDetails.ifscCode}</p>
            </div>
          )}
        </div>

        <div className="space-y-2 font-mono text-right">
          <div className="flex justify-between text-slate-600">
            <span>Services Subtotal:</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST Amount:</span>
            <span>{formatINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between text-lg font-black text-slate-900 border-t-2 border-indigo-600 pt-2">
            <span>Total Payable:</span>
            <span>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
