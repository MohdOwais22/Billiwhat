import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const WhatsAppCleanTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-sans p-6 rounded-2xl border-2 border-emerald-500 text-sm leading-normal shadow-lg ${
        isPrintMode ? 'print:p-0 print:border-none print:shadow-none' : ''
      }`}
    >
      {/* WhatsApp Green Top Badge Header */}
      <div className="bg-emerald-600 text-white p-4 rounded-xl mb-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-300 rounded-full animate-pulse"></div>
          <div>
            <span className="text-[11px] font-mono text-emerald-100 uppercase tracking-widest font-bold block">
              WHATSAPP DIGITAL INVOICE
            </span>
            <h1 className="text-lg font-black uppercase tracking-tight">{seller.name}</h1>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-base font-black text-white">{meta.invoiceNumber}</div>
          <div className="text-xs text-emerald-100">{formatDate(meta.issueDate)}</div>
        </div>
      </div>

      {/* Customer Mobile Card */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 mb-4 text-xs font-sans">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Billed To:</span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">{buyer.name}</p>
            {buyer.businessName && <p className="text-slate-600 font-medium">{buyer.businessName}</p>}
            {buyer.phone && <p className="text-emerald-700 font-bold font-mono mt-0.5">Ph: {buyer.phone}</p>}
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white uppercase">
              {meta.status}
            </span>
          </div>
        </div>
      </div>

      {/* Clean Large Text Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
              <th className="p-3">Item Name</th>
              <th className="p-3 text-center">Qty</th>
              <th className="p-3 text-right">Rate</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="p-3 font-bold text-slate-900">{item.description}</td>
                <td className="p-3 text-center font-mono font-semibold">{item.quantity} {item.unit}</td>
                <td className="p-3 text-right font-mono text-slate-600">{formatINR(item.unitPrice)}</td>
                <td className="p-3 text-right font-mono font-extrabold text-emerald-950">{formatINR(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bold Total Pill & Payment */}
      <div className="bg-slate-900 text-white p-4 rounded-xl mb-4 flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Due Amount</span>
          <span className="text-xs text-emerald-400 font-medium font-sans">Inc. GST Taxes</span>
        </div>
        <div className="text-2xl font-black text-emerald-400 font-mono">
          {formatINR(totals.grandTotal)}
        </div>
      </div>

      {/* UPI / Quick Pay Box */}
      {bankDetails?.upiId && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-center font-mono text-xs text-emerald-950">
          <p className="font-bold uppercase">⚡ Quick Pay via UPI / PhonePe / GPay</p>
          <p className="text-sm font-extrabold text-emerald-900 mt-0.5">{bankDetails.upiId}</p>
        </div>
      )}
    </div>
  );
};
