'use client';

import React from 'react';
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { FullReportsData } from '@/lib/services/reportsService';
import { formatINR } from '@/lib/utils/formatters';
import { exportGstSummaryToCSV } from '@/lib/utils/reportExport';

interface GstReportTabProps {
  data: FullReportsData;
  onNavigateToSettings?: () => void;
}

export function GstReportTab({ data, onNavigateToSettings }: GstReportTabProps) {
  const { gstSummary, gstProfile, organization, dateRange } = data;
  const isGstConfigured = Boolean(organization.gstin || gstProfile?.gstin);

  const handleExportCSV = () => {
    exportGstSummaryToCSV(gstSummary.rateBreakdown, gstSummary, dateRange.label);
  };

  return (
    <div className="space-y-6" id="gst-report-tab-content">
      {/* GST Profile Status Banner */}
      {!isGstConfigured ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" id="gst-profile-unconfigured-banner">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">GST profile not configured</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Complete your organization GST settings to enable standard B2B tax filing profiles and GSTIN validation.
              </p>
            </div>
          </div>
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition cursor-pointer"
            >
              <span>Configure GST Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Business GSTIN:</span>
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {organization.gstin || gstProfile?.gstin}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {gstProfile?.legal_name || organization.legal_name || organization.name} • {organization.state || 'India'}
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            id="export-gst-summary-csv-btn"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export GST Summary CSV</span>
          </button>
        </div>
      )}

      {/* Outward Tax Liability Summary Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Outward Tax Liability Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative tax liability from outward sales in {dateRange.label}.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            Total Output Tax: {formatINR(gstSummary.totalTax)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Taxable Value</span>
            <span className="text-base font-black text-slate-900 mt-1 block">
              {formatINR(gstSummary.taxableValue)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Central GST (CGST)</span>
            <span className="text-base font-black text-emerald-700 mt-1 block">
              {formatINR(gstSummary.cgst)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">State GST (SGST)</span>
            <span className="text-base font-black text-emerald-700 mt-1 block">
              {formatINR(gstSummary.sgst)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Integrated GST (IGST)</span>
            <span className="text-base font-black text-indigo-700 mt-1 block">
              {formatINR(gstSummary.igst)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Cess</span>
            <span className="text-base font-black text-slate-700 mt-1 block">
              {formatINR(gstSummary.cess)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Total Invoiced</span>
            <span className="text-base font-black text-emerald-900 mt-1 block">
              {formatINR(gstSummary.totalInvoiceValue)}
            </span>
          </div>
        </div>
      </div>

      {/* GST Rate-Wise Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">GST Rate-wise Summary (Slab Matrix)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tax distribution grouped by statutory tax rates (0%, 5%, 12%, 18%, 28%) from actual invoice line items.
            </p>
          </div>
        </div>

        {gstSummary.rateBreakdown.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 mt-4" id="gst-empty-state">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No GST data in selected period</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No taxable outward invoices have been issued in {dateRange.label}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rate Slab</th>
                  <th className="py-3 px-4 text-center">Items / Rows</th>
                  <th className="py-3 px-4 text-right">Taxable Amount</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">IGST</th>
                  <th className="py-3 px-4 text-right">Cess</th>
                  <th className="py-3 px-4 text-right">Total Tax</th>
                  <th className="py-3 px-4 text-right">Total Invoiced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {gstSummary.rateBreakdown.map((r) => (
                  <tr key={r.taxRate} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono">
                        {r.taxRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-slate-500">{r.itemCount}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatINR(r.taxableAmount)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                      {formatINR(r.cgst)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                      {formatINR(r.sgst)}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-700 font-semibold">
                      {formatINR(r.igst)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatINR(r.cess)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatINR(r.totalTax)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatINR(r.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/90 font-black text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td className="py-3 px-4 uppercase text-[11px]">Total Outward</td>
                  <td className="py-3 px-4 text-center">
                    {gstSummary.rateBreakdown.reduce((acc, r) => acc + r.itemCount, 0)}
                  </td>
                  <td className="py-3 px-4 text-right">{formatINR(gstSummary.taxableValue)}</td>
                  <td className="py-3 px-4 text-right text-emerald-800">{formatINR(gstSummary.cgst)}</td>
                  <td className="py-3 px-4 text-right text-emerald-800">{formatINR(gstSummary.sgst)}</td>
                  <td className="py-3 px-4 text-right text-indigo-800">{formatINR(gstSummary.igst)}</td>
                  <td className="py-3 px-4 text-right">{formatINR(gstSummary.cess)}</td>
                  <td className="py-3 px-4 text-right text-emerald-800">{formatINR(gstSummary.totalTax)}</td>
                  <td className="py-3 px-4 text-right">{formatINR(gstSummary.totalInvoiceValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
