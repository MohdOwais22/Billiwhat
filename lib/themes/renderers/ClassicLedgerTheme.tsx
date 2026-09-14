import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const ClassicLedgerTheme: React.FC<InvoiceThemeProps> = ({ data, branding, isPrintMode }) => {
  const { seller, buyer, meta, items, hsnSummary, totals, bankDetails, termsAndConditions } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-sans p-6 border-2 border-slate-900 text-xs leading-normal ${
        isPrintMode ? 'print:p-0 print:border-none' : ''
      }`}
    >
      {/* Sample Banner if sample data */}
      {data.isSampleData && (
        <div className="bg-amber-100 text-amber-900 px-3 py-1 text-[11px] font-bold text-center border-b border-amber-300 mb-3 print:hidden">
          SAMPLE INVOICE PREVIEW &mdash; STRUCTURALLY REPRESENTATIVE
        </div>
      )}

      {/* Main Double Border Header Box */}
      <div className="border-2 border-slate-900 p-4 mb-3">
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-3">
          <h1 className="text-xl font-black uppercase tracking-wide text-slate-900">
            {seller.legalName || seller.name}
          </h1>
          {seller.legalName && seller.name !== seller.legalName && (
            <p className="text-[11px] font-semibold text-slate-700">Trade Name: {seller.name}</p>
          )}
          <p className="text-[11px] text-slate-700 font-medium max-w-xl mx-auto mt-0.5">
            {seller.formattedAddress}
          </p>
          <div className="flex justify-center gap-4 text-[11px] text-slate-800 font-bold mt-1">
            {seller.gstin && <span>GSTIN: <span className="font-mono">{seller.gstin}</span></span>}
            {seller.phone && <span>Ph: {seller.phone}</span>}
            {seller.email && <span>Email: {seller.email}</span>}
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-100 p-2 border border-slate-900 font-mono text-xs">
          <div>
            <span className="font-black text-slate-900 uppercase tracking-widest">{meta.invoiceType}</span>
            <span className="ml-3 font-semibold text-slate-600">Original for Recipient</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-700">NO: </span>
            <span className="font-black text-slate-900 text-sm">{meta.invoiceNumber}</span>
          </div>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-0 border-2 border-slate-900 mb-3 text-xs">
        <div className="p-3 border-r-2 border-slate-900 space-y-1">
          <p className="font-bold uppercase text-[10px] text-slate-600 tracking-wider">Party / Buyer Details:</p>
          <p className="font-extrabold text-sm text-slate-900">{buyer.businessName || buyer.name}</p>
          {buyer.businessName && <p className="font-medium text-slate-700">Attn: {buyer.name}</p>}
          <p className="text-slate-700 whitespace-pre-line">{buyer.billingAddress}</p>
          {buyer.gstin ? (
            <p className="font-bold font-mono text-slate-900 mt-1">GSTIN: {buyer.gstin}</p>
          ) : (
            <p className="text-slate-500 italic">Unregistered / Consumer</p>
          )}
          {buyer.phone && <p className="text-slate-700">Ph: {buyer.phone}</p>}
        </div>

        <div className="p-3 space-y-1 bg-slate-50/50">
          <p className="font-bold uppercase text-[10px] text-slate-600 tracking-wider">Invoice Metadata:</p>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-slate-600 font-medium">Invoice Date:</span>
            <span className="font-bold font-mono">{formatDate(meta.issueDate)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-slate-600 font-medium">Payment Due Date:</span>
            <span className="font-bold font-mono">{formatDate(meta.dueDate)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="text-slate-600 font-medium">Place of Supply:</span>
            <span className="font-bold">{meta.placeOfSupply}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-medium">Supply Type:</span>
            <span className="font-bold">{meta.isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border-2 border-slate-900 mb-3 overflow-hidden">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider border-b-2 border-slate-900">
              <th className="py-2 px-2 border-r border-slate-700 text-center w-10">S.No</th>
              <th className="py-2 px-3 border-r border-slate-700">Item Description</th>
              <th className="py-2 px-2 border-r border-slate-700 text-center w-20">HSN/SAC</th>
              <th className="py-2 px-2 border-r border-slate-700 text-center w-16">Qty</th>
              <th className="py-2 px-2 border-r border-slate-700 text-right w-20">Rate</th>
              <th className="py-2 px-2 border-r border-slate-700 text-right w-16">Disc</th>
              <th className="py-2 px-2 border-r border-slate-700 text-right w-24">Taxable</th>
              <th className="py-2 px-2 border-r border-slate-700 text-center w-14">GST %</th>
              <th className="py-2 px-3 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y border-b-2 border-slate-900">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                <td className="py-2 px-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                <td className="py-2 px-3 border-r border-slate-300 font-semibold text-slate-900">{item.description}</td>
                <td className="py-2 px-2 border-r border-slate-300 text-center font-mono text-slate-700">{item.hsnSac || '—'}</td>
                <td className="py-2 px-2 border-r border-slate-300 text-center font-mono">{item.quantity} {item.unit}</td>
                <td className="py-2 px-2 border-r border-slate-300 text-right font-mono">{formatINR(item.unitPrice, { showSymbol: false })}</td>
                <td className="py-2 px-2 border-r border-slate-300 text-right font-mono">{item.discount > 0 ? formatINR(item.discount, { showSymbol: false }) : '—'}</td>
                <td className="py-2 px-2 border-r border-slate-300 text-right font-mono">{formatINR(item.taxableAmount, { showSymbol: false })}</td>
                <td className="py-2 px-2 border-r border-slate-300 text-center font-mono">{item.taxRate}%</td>
                <td className="py-2 px-3 text-right font-mono font-bold">{formatINR(item.lineTotal, { showSymbol: false })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Summary Ledger Grid */}
        <div className="grid grid-cols-12 text-xs">
          <div className="col-span-7 p-3 border-r-2 border-slate-900 space-y-2 bg-slate-50/30">
            <div>
              <p className="font-bold text-[10px] text-slate-500 uppercase">Amount in Words:</p>
              <p className="font-bold text-slate-900 capitalize italic">{totals.amountInWords}</p>
            </div>
            {termsAndConditions && (
              <div className="pt-2 border-t border-slate-200">
                <p className="font-bold text-[10px] text-slate-500 uppercase">Terms & Conditions:</p>
                <p className="text-[10px] text-slate-700 whitespace-pre-line leading-tight">{termsAndConditions}</p>
              </div>
            )}
          </div>

          <div className="col-span-5 p-3 space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal:</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>
            {totals.discountTotal > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>Discount Total:</span>
                <span>-{formatINR(totals.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-medium pt-1 border-t border-slate-200">
              <span>Taxable Value:</span>
              <span>{formatINR(totals.taxableAmount)}</span>
            </div>
            {!meta.isInterState ? (
              <>
                <div className="flex justify-between text-slate-700 text-[11px]">
                  <span>CGST Total:</span>
                  <span>{formatINR(totals.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-700 text-[11px]">
                  <span>SGST Total:</span>
                  <span>{formatINR(totals.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-700 text-[11px]">
                <span>IGST Total:</span>
                <span>{formatINR(totals.igst)}</span>
              </div>
            )}
            {totals.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Round Off:</span>
                <span>{formatINR(totals.roundOff)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900 bg-slate-100 p-1">
              <span>GRAND TOTAL:</span>
              <span>{formatINR(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Bank Box */}
      <div className="grid grid-cols-2 gap-3 text-xs border-2 border-slate-900 p-3">
        <div>
          {bankDetails ? (
            <>
              <p className="font-bold text-[10px] uppercase text-slate-500 mb-1">Bank Payment Details:</p>
              <div className="font-mono text-[11px] space-y-0.5 text-slate-800">
                {bankDetails.bankName && <p><span className="font-semibold text-slate-500">Bank:</span> {bankDetails.bankName}</p>}
                {bankDetails.accountName && <p><span className="font-semibold text-slate-500">A/C Name:</span> {bankDetails.accountName}</p>}
                {bankDetails.accountNumber && <p><span className="font-semibold text-slate-500">A/C No:</span> {bankDetails.accountNumber}</p>}
                {bankDetails.ifscCode && <p><span className="font-semibold text-slate-500">IFSC Code:</span> {bankDetails.ifscCode}</p>}
                {bankDetails.upiId && <p><span className="font-semibold text-slate-500">UPI ID:</span> {bankDetails.upiId}</p>}
              </div>
            </>
          ) : (
            <div className="text-[11px] text-slate-700 italic space-y-1">
              <p className="font-bold text-[10px] uppercase text-slate-500 not-italic">Terms & Conditions:</p>
              <p className="whitespace-pre-line leading-tight">{data.termsAndConditions}</p>
            </div>
          )}
        </div>

        <div className="text-right flex flex-col justify-between items-end">
          <p className="font-bold text-[10px] uppercase text-slate-600">For {seller.legalName || seller.name}</p>
          <div className="h-12"></div>
          <p className="font-bold border-t border-slate-900 pt-1 text-[11px] uppercase tracking-wider">{data.signatureTitle}</p>
        </div>
      </div>
    </div>
  );
};
