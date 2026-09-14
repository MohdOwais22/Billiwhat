import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const TallyPrimeTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, hsnSummary, totals, bankDetails, termsAndConditions } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-950 font-sans p-4 border-2 border-slate-900 text-xs leading-tight ${
        isPrintMode ? 'print:p-0 print:border-none' : ''
      }`}
    >
      {/* Sample Banner */}
      {data.isSampleData && (
        <div className="bg-amber-100 text-amber-900 px-3 py-1 text-[11px] font-bold text-center border-b border-amber-300 mb-2 print:hidden">
          SAMPLE TALLY PRIME STYLE PREVIEW
        </div>
      )}

      {/* Outer Single Box Container */}
      <div className="border border-slate-900">
        {/* Title Bar */}
        <div className="bg-slate-100 border-b border-slate-900 py-1.5 text-center">
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">
            {meta.invoiceType || 'TAX INVOICE'}
          </h1>
          <p className="text-[10px] text-slate-600 font-bold uppercase">(ORIGINAL FOR RECIPIENT)</p>
        </div>

        {/* Top Header: Seller & Inv Details Grid */}
        <div className="grid grid-cols-2 border-b border-slate-900 divide-x divide-slate-900">
          {/* Seller Box */}
          <div className="p-3 space-y-1">
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">
              {seller.legalName || seller.name}
            </h2>
            {seller.legalName && seller.name !== seller.legalName && (
              <p className="text-[11px] font-semibold text-slate-700">Trade Name: {seller.name}</p>
            )}
            <p className="text-[11px] text-slate-700 font-medium whitespace-pre-line leading-snug">
              {seller.formattedAddress}
            </p>
            <div className="pt-1 text-[11px] font-bold space-y-0.5">
              {seller.gstin && (
                <p>
                  GSTIN/UIN: <span className="font-mono text-slate-900">{seller.gstin}</span>
                </p>
              )}
              {seller.stateCode && (
                <p>
                  State Name : <span className="font-semibold">{seller.state || 'State'}</span>, Code :{' '}
                  <span className="font-mono">{seller.stateCode}</span>
                </p>
              )}
              {seller.phone && <p>Contact: {seller.phone}</p>}
              {seller.email && <p>E-Mail: {seller.email}</p>}
            </div>
          </div>

          {/* Inv Metadata Table */}
          <div className="divide-y divide-slate-900 text-[11px]">
            <div className="grid grid-cols-2 divide-x divide-slate-900 p-1.5">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Invoice No.</span>
                <span className="font-black font-mono text-xs">{meta.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Dated</span>
                <span className="font-bold font-mono">{formatDate(meta.issueDate)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-900 p-1.5">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Delivery Note</span>
                <span className="font-mono text-slate-700">—</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Mode/Terms of Payment</span>
                <span className="font-bold">{meta.dueDate ? `Due by ${formatDate(meta.dueDate)}` : 'Immediate'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-900 p-1.5">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Supplier&apos;s Ref.</span>
                <span className="font-mono text-slate-700">—</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Other Reference(s)</span>
                <span className="font-mono text-slate-700">—</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-900 p-1.5">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Buyer&apos;s Order No.</span>
                <span className="font-mono text-slate-700">—</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Dated</span>
                <span className="font-mono text-slate-700">—</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-900 p-1.5">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Dispatched through</span>
                <span className="font-bold">{meta.source || 'Direct'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Destination / Place of Supply</span>
                <span className="font-bold">{meta.placeOfSupply || 'Local'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer (Billed To) Row */}
        <div className="p-2.5 border-b border-slate-900 bg-slate-50/60">
          <span className="text-[10px] font-bold uppercase text-slate-600 block mb-0.5">
            Buyer (Bill to)
          </span>
          <h3 className="font-black text-sm text-slate-900 uppercase">
            {buyer.businessName || buyer.name}
          </h3>
          {buyer.businessName && <p className="font-medium text-slate-700">Attn: {buyer.name}</p>}
          <p className="text-[11px] text-slate-800 whitespace-pre-line mt-0.5 leading-tight">
            {buyer.billingAddress}
          </p>
          <div className="flex gap-4 mt-1 font-bold text-[11px]">
            {buyer.gstin ? (
              <p>
                GSTIN/UIN: <span className="font-mono">{buyer.gstin}</span>
              </p>
            ) : (
              <p className="text-slate-500 italic">Unregistered / Retail Consumer</p>
            )}
            {buyer.stateCode && (
              <p>
                State Name : <span className="font-semibold">{buyer.state || 'State'}</span>, Code :{' '}
                <span className="font-mono">{buyer.stateCode}</span>
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="border-b border-slate-900">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-[10px] text-slate-900">
                <th className="py-1.5 px-2 border-r border-slate-900 text-center w-10">Sl No.</th>
                <th className="py-1.5 px-3 border-r border-slate-900">Description of Goods</th>
                <th className="py-1.5 px-2 border-r border-slate-900 text-center w-20">HSN/SAC</th>
                <th className="py-1.5 px-2 border-r border-slate-900 text-center w-20">Quantity</th>
                <th className="py-1.5 px-2 border-r border-slate-900 text-right w-20">Rate</th>
                <th className="py-1.5 px-2 border-r border-slate-900 text-center w-14">per</th>
                <th className="py-1.5 px-2 border-r border-slate-900 text-right w-16">Disc %</th>
                <th className="py-1.5 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50">
                  <td className="py-2 px-2 border-r border-slate-900 text-center font-mono">{idx + 1}</td>
                  <td className="py-2 px-3 border-r border-slate-900 font-bold text-slate-900">
                    {item.description}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-center font-mono text-slate-700">
                    {item.hsnSac || '—'}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-center font-mono font-bold">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right font-mono">
                    {formatINR(item.unitPrice, { showSymbol: false })}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-center text-[10px] font-medium">
                    {item.unit}
                  </td>
                  <td className="py-2 px-2 border-r border-slate-900 text-right font-mono text-slate-600">
                    {item.discount > 0 ? `${((item.discount / (item.quantity * item.unitPrice)) * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    {formatINR(item.lineTotal, { showSymbol: false })}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Totals Row */}
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-black text-xs bg-slate-100">
                <td colSpan={3} className="py-1.5 px-3 border-r border-slate-900 text-right uppercase">
                  Total
                </td>
                <td className="py-1.5 px-2 border-r border-slate-900 text-center font-mono">
                  {items.reduce((acc, i) => acc + i.quantity, 0)} Pcs
                </td>
                <td colSpan={3} className="border-r border-slate-900"></td>
                <td className="py-1.5 px-3 text-right font-mono text-sm">
                  {formatINR(totals.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in Words */}
        <div className="p-2 border-b border-slate-900 bg-white">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">Amount Chargeable (in words)</span>
          <p className="font-extrabold text-xs text-slate-900 uppercase italic">
            INR {totals.amountInWords}
          </p>
        </div>

        {/* Tax Breakdown Table (HSN / SAC Summary) */}
        {hsnSummary && hsnSummary.length > 0 && (
          <div className="border-b border-slate-900">
            <div className="p-1.5 bg-slate-100 border-b border-slate-900 font-bold text-[10px] uppercase text-slate-700">
              HSN/SAC Tax Assessment Breakdown
            </div>
            <table className="w-full border-collapse text-[11px] text-left">
              <thead>
                <tr className="border-b border-slate-900 font-bold text-[10px] text-slate-800 bg-slate-50">
                  <th className="py-1 px-2 border-r border-slate-900">HSN/SAC</th>
                  <th className="py-1 px-2 border-r border-slate-900 text-right">Taxable Value</th>
                  {!meta.isInterState ? (
                    <>
                      <th className="py-1 px-2 border-r border-slate-900 text-right">Central Tax Amount</th>
                      <th className="py-1 px-2 border-r border-slate-900 text-right">State Tax Amount</th>
                    </>
                  ) : (
                    <th className="py-1 px-2 border-r border-slate-900 text-right">Integrated Tax Amount</th>
                  )}
                  <th className="py-1 px-2 text-right">Total Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-mono text-[10px]">
                {hsnSummary.map((hsn, idx) => (
                  <tr key={idx}>
                    <td className="py-1 px-2 border-r border-slate-900 font-bold">{hsn.hsnSac || 'General'}</td>
                    <td className="py-1 px-2 border-r border-slate-900 text-right">{formatINR(hsn.taxableAmount)}</td>
                    {!meta.isInterState ? (
                      <>
                        <td className="py-1 px-2 border-r border-slate-900 text-right">{formatINR(hsn.cgstAmount)} ({hsn.cgstRate}%)</td>
                        <td className="py-1 px-2 border-r border-slate-900 text-right">{formatINR(hsn.sgstAmount)} ({hsn.sgstRate}%)</td>
                      </>
                    ) : (
                      <td className="py-1 px-2 border-r border-slate-900 text-right">{formatINR(hsn.igstAmount)} ({hsn.igstRate}%)</td>
                    )}
                    <td className="py-1 px-2 text-right font-bold">{formatINR(hsn.totalTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Section: Bank, Declaration, Signature */}
        <div className="grid grid-cols-2 divide-x divide-slate-900 text-[11px]">
          {/* Left: Declaration & Bank Details */}
          <div className="p-3 space-y-2">
            {bankDetails && (
              <div>
                <span className="font-bold text-[10px] uppercase text-slate-600 block mb-0.5">
                  Company&apos;s Bank Details
                </span>
                <div className="font-mono text-[10px] space-y-0.5 text-slate-800">
                  {bankDetails.bankName && <p><span className="font-bold text-slate-600">Bank Name :</span> {bankDetails.bankName}</p>}
                  {bankDetails.accountName && <p><span className="font-bold text-slate-600">A/C Name :</span> {bankDetails.accountName}</p>}
                  {bankDetails.accountNumber && <p><span className="font-bold text-slate-600">A/c No. :</span> {bankDetails.accountNumber}</p>}
                  {bankDetails.ifscCode && <p><span className="font-bold text-slate-600">Branch & IFS Code :</span> {bankDetails.ifscCode}</p>}
                  {bankDetails.upiId && <p><span className="font-bold text-slate-600">UPI ID :</span> {bankDetails.upiId}</p>}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300">
              <span className="font-bold text-[10px] uppercase text-slate-600 block">Declaration</span>
              <p className="text-[9px] text-slate-700 italic leading-tight">
                {termsAndConditions ||
                  'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
              </p>
            </div>
          </div>

          {/* Right: Signature Box */}
          <div className="p-3 flex flex-col justify-between text-right">
            <div>
              <span className="font-black text-[11px] uppercase text-slate-900 block">
                for {seller.legalName || seller.name}
              </span>
            </div>

            <div className="pt-8">
              <span className="font-bold border-t border-slate-900 pt-1 text-[10px] uppercase tracking-wider inline-block">
                {data.signatureTitle || 'Authorised Signatory'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[9px] text-slate-500 mt-1 font-mono">
        SUBJECT TO LOCAL JURISDICTION &bull; THIS IS A COMPUTER GENERATED INVOICE
      </p>
    </div>
  );
};
