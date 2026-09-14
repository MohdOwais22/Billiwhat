import React from 'react';
import { InvoiceThemeProps } from '../types';
import { formatINR, formatDate } from '@/lib/utils/formatters';

export const ManufacturingTheme: React.FC<InvoiceThemeProps> = ({ data, isPrintMode }) => {
  const { seller, buyer, meta, items, totals, bankDetails, termsAndConditions } = data;

  return (
    <div
      className={`w-full max-w-[800px] mx-auto bg-white text-slate-900 font-sans p-6 border-2 border-slate-800 text-xs leading-normal ${
        isPrintMode ? 'print:p-0 print:border-none' : ''
      }`}
    >
      {/* Title Header */}
      <div className="border-b-2 border-slate-900 pb-3 mb-3 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
            {seller.legalName || seller.name}
          </h1>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Industrial Manufacturer & Factory Exporter
          </p>
          <p className="text-slate-600 text-[11px] mt-1 max-w-md">{seller.formattedAddress}</p>
          <p className="font-mono font-bold text-slate-900 text-[11px] mt-0.5">GSTIN: {seller.gstin}</p>
        </div>

        <div className="text-right border-2 border-slate-900 p-2.5 bg-slate-50 font-mono">
          <span className="font-black text-xs uppercase block text-slate-900">TAX INVOICE / GATE PASS</span>
          <p className="text-sm font-extrabold text-slate-900 mt-1">{meta.invoiceNumber}</p>
          <p className="text-[10px] text-slate-600">Date: {formatDate(meta.issueDate)}</p>
        </div>
      </div>

      {/* Dispatch & Consignee Box */}
      <div className="grid grid-cols-3 gap-2 border border-slate-900 p-2.5 mb-3 text-[11px]">
        <div>
          <span className="text-[9px] font-bold text-slate-500 uppercase block">Billed To (Consignee):</span>
          <p className="font-bold text-slate-900">{buyer.businessName || buyer.name}</p>
          <p className="text-slate-600">{buyer.billingAddress}</p>
          {buyer.gstin && <p className="font-mono font-bold">GSTIN: {buyer.gstin}</p>}
        </div>

        <div>
          <span className="text-[9px] font-bold text-slate-500 uppercase block">Dispatch Location:</span>
          <p className="font-medium text-slate-800">{seller.branchAddress || seller.formattedAddress}</p>
          <p className="text-slate-600">Dispatch Doc: #DC-2026-99</p>
        </div>

        <div className="font-mono text-right">
          <span className="text-[9px] font-bold text-slate-500 uppercase block">Transport Specs:</span>
          <p>Mode: Road Cargo</p>
          <p>Place of Supply: {meta.placeOfSupply}</p>
          <p>Reverse Charge: NO</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left text-xs border-collapse border-2 border-slate-900 mb-3">
        <thead>
          <tr className="bg-slate-900 text-white font-bold uppercase text-[9px]">
            <th className="p-2 border-r border-slate-700 text-center w-8">#</th>
            <th className="p-2 border-r border-slate-700">Factory Manufactured Goods</th>
            <th className="p-2 border-r border-slate-700 text-center">HSN/SAC</th>
            <th className="p-2 border-r border-slate-700 text-center">UOM / Qty</th>
            <th className="p-2 border-r border-slate-700 text-right">Unit Rate</th>
            <th className="p-2 border-r border-slate-700 text-right">Taxable</th>
            <th className="p-2 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
              <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{item.description}</td>
              <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-600">{item.hsnSac || '—'}</td>
              <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">{item.quantity} {item.unit}</td>
              <td className="p-2 border-r border-slate-300 text-right font-mono">{formatINR(item.unitPrice, { showSymbol: false })}</td>
              <td className="p-2 border-r border-slate-300 text-right font-mono">{formatINR(item.taxableAmount, { showSymbol: false })}</td>
              <td className="p-2 text-right font-mono font-bold text-slate-900">{formatINR(item.lineTotal, { showSymbol: false })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Box */}
      <div className="grid grid-cols-2 gap-4 border-2 border-slate-900 p-3">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total in Words:</p>
          <p className="font-bold text-slate-900 capitalize text-[11px]">{totals.amountInWords}</p>
          {termsAndConditions && (
            <p className="text-[9px] text-slate-600 mt-2 whitespace-pre-line">{termsAndConditions}</p>
          )}
        </div>

        <div className="space-y-1 font-mono text-right">
          <div className="flex justify-between text-slate-600">
            <span>Total Goods Value:</span>
            <span>{formatINR(totals.taxableAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST Output Tax:</span>
            <span>{formatINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-1 mt-1 bg-slate-100 p-1">
            <span>Invoice Total:</span>
            <span>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
