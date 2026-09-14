import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const GstProTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, hsnSummary, totals, bankDetails, termsAndConditions } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-sans p-6 border border-emerald-900/40 rounded-lg text-xs leading-normal shadow-sm ${
        isPrintMode ? 'print:p-0 print:border-none print:shadow-none' : ''
      }`}
    >
      {/* GST Compliance Header Bar */}
      <div className="bg-emerald-900 text-white p-3 rounded-t-md flex justify-between items-center mb-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-300 uppercase block font-semibold">
            GST COMPLIANT B2B TAX INVOICE
          </span>
          <h1 className="text-lg font-black tracking-tight uppercase text-white">{seller.legalName || seller.name}</h1>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono font-bold text-emerald-100">{meta.invoiceNumber}</div>
          <div className="text-[10px] text-emerald-300">Date: {formatDate(meta.issueDate)}</div>
        </div>
      </div>

      {/* Seller & Buyer GST Box */}
      <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-md p-3 mb-4 bg-slate-50/50 text-xs">
        <div>
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Supplier / Seller (GSTIN: {seller.gstin || 'Unregistered'})
          </span>
          <p className="font-bold text-slate-900">{seller.legalName || seller.name}</p>
          <p className="text-slate-600 text-[11px] mt-0.5">{seller.formattedAddress}</p>
          <div className="mt-1 text-[11px] text-slate-700">
            {seller.state && <span>State: {seller.state} (Code: {seller.stateCode})</span>}
            {seller.phone && <span className="ml-2">&bull; Ph: {seller.phone}</span>}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Recipient / Buyer (GSTIN: {buyer.gstin || 'Consumer'})
          </span>
          <p className="font-bold text-slate-900">{buyer.businessName || buyer.name}</p>
          {buyer.businessName && <p className="text-[11px] text-slate-600 font-medium">Attn: {buyer.name}</p>}
          <p className="text-slate-600 text-[11px] mt-0.5">{buyer.billingAddress}</p>
          <div className="mt-1 text-[11px] text-slate-700">
            <span>Place of Supply: <strong className="text-emerald-900">{meta.placeOfSupply}</strong></span>
          </div>
        </div>
      </div>

      {/* Item Table with CGST / SGST / IGST breakdown columns */}
      <div className="border border-slate-200 rounded-md overflow-hidden mb-4">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              <th className="p-2 text-center w-8">#</th>
              <th className="p-2">Item / Description</th>
              <th className="p-2 text-center">HSN/SAC</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Rate</th>
              <th className="p-2 text-right">Taxable</th>
              {!meta.isInterState ? (
                <>
                  <th className="p-2 text-right">CGST</th>
                  <th className="p-2 text-right">SGST</th>
                </>
              ) : (
                <th className="p-2 text-right">IGST</th>
              )}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50">
                <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                <td className="p-2 font-medium text-slate-900">{item.description}</td>
                <td className="p-2 text-center font-mono text-slate-600">{item.hsnSac || '—'}</td>
                <td className="p-2 text-center font-mono">{item.quantity} {item.unit}</td>
                <td className="p-2 text-right font-mono">{formatINR(item.unitPrice, { showSymbol: false })}</td>
                <td className="p-2 text-right font-mono font-medium">{formatINR(item.taxableAmount, { showSymbol: false })}</td>
                {!meta.isInterState ? (
                  <>
                    <td className="p-2 text-right font-mono text-slate-600 text-[11px]">
                      {formatINR(item.cgst, { showSymbol: false })}
                      <span className="text-[9px] text-slate-400 block">({item.taxRate / 2}%)</span>
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600 text-[11px]">
                      {formatINR(item.sgst, { showSymbol: false })}
                      <span className="text-[9px] text-slate-400 block">({item.taxRate / 2}%)</span>
                    </td>
                  </>
                ) : (
                  <td className="p-2 text-right font-mono text-slate-600 text-[11px]">
                    {formatINR(item.igst, { showSymbol: false })}
                    <span className="text-[9px] text-slate-400 block">({item.taxRate}%)</span>
                  </td>
                )}
                <td className="p-2 text-right font-mono font-bold text-slate-900">{formatINR(item.lineTotal, { showSymbol: false })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HSN/SAC Tax Breakdown Summary Box */}
      {hsnSummary.length > 0 && (
        <div className="border border-emerald-200 rounded-md p-3 mb-4 bg-emerald-50/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-1.5">
            GST Tax Breakdown Summary (by HSN/SAC)
          </span>
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead>
              <tr className="border-b border-emerald-200 text-emerald-900 font-bold uppercase text-[9px]">
                <th className="pb-1">HSN/SAC</th>
                <th className="pb-1 text-right">Taxable Amount</th>
                {!meta.isInterState ? (
                  <>
                    <th className="pb-1 text-right">CGST</th>
                    <th className="pb-1 text-right">SGST</th>
                  </>
                ) : (
                  <th className="pb-1 text-right">IGST</th>
                )}
                <th className="pb-1 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100 text-slate-800">
              {hsnSummary.map((hsn, idx) => (
                <tr key={idx}>
                  <td className="py-1 font-bold">{hsn.hsnSac}</td>
                  <td className="py-1 text-right">{formatINR(hsn.taxableAmount)}</td>
                  {!meta.isInterState ? (
                    <>
                      <td className="py-1 text-right">{formatINR(hsn.cgstAmount)} ({hsn.cgstRate}%)</td>
                      <td className="py-1 text-right">{formatINR(hsn.sgstAmount)} ({hsn.sgstRate}%)</td>
                    </>
                  ) : (
                    <td className="py-1 text-right">{formatINR(hsn.igstAmount)} ({hsn.igstRate}%)</td>
                  )}
                  <td className="py-1 text-right font-bold text-emerald-950">{formatINR(hsn.totalTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals & Sign Box */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-xs">
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Amount in Words:</p>
            <p className="font-bold text-slate-900 capitalize text-[11px]">{totals.amountInWords}</p>
          </div>
          {bankDetails && (
            <div className="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] space-y-0.5 text-slate-700">
              <p className="font-bold text-slate-900 uppercase">Banking Details</p>
              <p>Bank: {bankDetails.bankName} | A/C: {bankDetails.accountNumber}</p>
              <p>IFSC: {bankDetails.ifscCode} | UPI: {bankDetails.upiId || '—'}</p>
            </div>
          )}
        </div>

        <div className="space-y-1.5 font-mono text-right">
          <div className="flex justify-between text-slate-600">
            <span>Taxable Subtotal:</span>
            <span>{formatINR(totals.taxableAmount)}</span>
          </div>
          {!meta.isInterState ? (
            <>
              <div className="flex justify-between text-slate-600">
                <span>Central Tax (CGST):</span>
                <span>{formatINR(totals.cgst)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State Tax (SGST):</span>
                <span>{formatINR(totals.sgst)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-slate-600">
              <span>Integrated Tax (IGST):</span>
              <span>{formatINR(totals.igst)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-emerald-950 border-t-2 border-emerald-900 pt-1.5 mt-1 bg-emerald-50/50 p-1 rounded">
            <span>Invoice Total:</span>
            <span>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
