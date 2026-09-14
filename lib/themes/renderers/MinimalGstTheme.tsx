import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const MinimalGstTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, hsnSummary, totals } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-sans p-6 text-xs leading-normal border border-slate-900 ${
        isPrintMode ? 'print:p-0 print:border-none' : ''
      }`}
    >
      {/* Top Title Bar */}
      <div className="border-b-2 border-slate-900 pb-3 mb-3 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block">
            FORM GST INV-01
          </span>
          <h1 className="text-lg font-black uppercase text-slate-900">{seller.legalName || seller.name}</h1>
          <p className="text-[11px] text-slate-700">{seller.formattedAddress}</p>
          <p className="font-mono font-bold text-slate-900 text-[11px]">GSTIN: {seller.gstin}</p>
        </div>

        <div className="text-right font-mono border border-slate-900 p-2 bg-slate-50">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Tax Invoice No:</p>
          <p className="text-sm font-black text-slate-900">{meta.invoiceNumber}</p>
          <p className="text-[10px] text-slate-600">Date: {formatDate(meta.issueDate)}</p>
        </div>
      </div>

      {/* Recipient Details */}
      <div className="border border-slate-900 p-2.5 mb-3 bg-slate-50/40 text-[11px]">
        <p className="text-[9px] font-bold uppercase text-slate-500">Details of Receiver (Billed To):</p>
        <p className="font-extrabold text-slate-900 text-sm">{buyer.businessName || buyer.name}</p>
        <p className="text-slate-700">{buyer.billingAddress}</p>
        <div className="flex justify-between font-mono font-bold mt-1 text-slate-900">
          <span>GSTIN / UIN: {buyer.gstin || 'Unregistered'}</span>
          <span>Place of Supply: {meta.placeOfSupply}</span>
        </div>
      </div>

      {/* Item Table */}
      <table className="w-full text-left text-xs border-collapse border border-slate-900 mb-3">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-[9px] text-slate-900">
            <th className="p-1.5 border-r border-slate-900 text-center w-6">#</th>
            <th className="p-1.5 border-r border-slate-900">Description of Goods / Services</th>
            <th className="p-1.5 border-r border-slate-900 text-center">HSN/SAC</th>
            <th className="p-1.5 border-r border-slate-900 text-center">Qty</th>
            <th className="p-1.5 border-r border-slate-900 text-right">Taxable Val</th>
            <th className="p-1.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="p-1.5 border-r border-slate-900 text-center font-mono">{idx + 1}</td>
              <td className="p-1.5 border-r border-slate-900 font-semibold">{item.description}</td>
              <td className="p-1.5 border-r border-slate-900 text-center font-mono">{item.hsnSac || '—'}</td>
              <td className="p-1.5 border-r border-slate-900 text-center font-mono">{item.quantity} {item.unit}</td>
              <td className="p-1.5 border-r border-slate-900 text-right font-mono">{formatINR(item.taxableAmount, { showSymbol: false })}</td>
              <td className="p-1.5 text-right font-mono font-bold">{formatINR(item.lineTotal, { showSymbol: false })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* HSN Summary */}
      {hsnSummary.length > 0 && (
        <div className="border border-slate-900 p-2 mb-3">
          <p className="text-[9px] font-bold uppercase text-slate-900 mb-1">HSN / SAC Wise Tax Summary:</p>
          <table className="w-full text-left text-[10px] font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-900 font-bold uppercase text-[9px]">
                <th>HSN/SAC</th>
                <th className="text-right">Taxable</th>
                <th className="text-right">CGST</th>
                <th className="text-right">SGST</th>
                <th className="text-right">Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              {hsnSummary.map((h, i) => (
                <tr key={i}>
                  <td>{h.hsnSac}</td>
                  <td className="text-right">{formatINR(h.taxableAmount)}</td>
                  <td className="text-right">{formatINR(h.cgstAmount)}</td>
                  <td className="text-right">{formatINR(h.sgstAmount)}</td>
                  <td className="text-right font-bold">{formatINR(h.totalTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Totals */}
      <div className="flex justify-between items-center border-t-2 border-slate-900 pt-2 font-mono">
        <div className="text-[10px] font-bold capitalize">
          Amount in Words: {totals.amountInWords}
        </div>
        <div className="text-base font-black border-2 border-slate-900 p-2 bg-slate-100">
          TOTAL: {formatINR(totals.grandTotal)}
        </div>
      </div>
    </div>
  );
};
