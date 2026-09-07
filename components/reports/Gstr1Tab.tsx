'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Building2,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { FullReportsData, Gstr1PreparationRow } from '@/lib/services/reportsService';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { exportGstr1ToCSV } from '@/lib/utils/reportExport';

interface Gstr1TabProps {
  data: FullReportsData;
}

type PartyTypeFilter = 'all' | 'b2b' | 'b2c';

export function Gstr1Tab({ data }: Gstr1TabProps) {
  const { gstr1Rows, dateRange, organization, gstProfile } = data;

  const [partyTypeFilter, setPartyTypeFilter] = useState<PartyTypeFilter>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRows = useMemo(() => {
    return gstr1Rows.filter((r) => {
      if (r.status === 'cancelled') return false; // GSTR-1 outward filing excludes cancelled documents or reflects amendments

      if (partyTypeFilter === 'b2b' && !r.isB2B) return false;
      if (partyTypeFilter === 'b2c' && r.isB2B) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchNum = r.invoiceNumber.toLowerCase().includes(query);
        const matchName = r.customerName.toLowerCase().includes(query);
        const matchBusiness = r.customerBusinessName?.toLowerCase().includes(query) || false;
        const matchGst = r.customerGstin?.toLowerCase().includes(query) || false;
        const matchPos = r.placeOfSupply.toLowerCase().includes(query);
        if (!matchNum && !matchName && !matchBusiness && !matchGst && !matchPos) {
          return false;
        }
      }
      return true;
    });
  }, [gstr1Rows, partyTypeFilter, searchTerm]);

  const b2bCount = gstr1Rows.filter((r) => r.isB2B && r.status !== 'cancelled').length;
  const b2cCount = gstr1Rows.filter((r) => !r.isB2B && r.status !== 'cancelled').length;

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        taxable: acc.taxable + r.taxableAmount,
        cgst: acc.cgst + r.cgst,
        sgst: acc.sgst + r.sgst,
        igst: acc.igst + r.igst,
        cess: acc.cess + r.cess,
        totalTax: acc.totalTax + r.totalTax,
        total: acc.total + r.total,
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, totalTax: 0, total: 0 }
    );
  }, [filteredRows]);

  const handleExportCSV = () => {
    exportGstr1ToCSV(filteredRows, dateRange.label);
  };

  return (
    <div className="space-y-6" id="gstr1-export-prep-tab-content">
      {/* Informative Workspace Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">GSTR-1 Export Preparation</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Outward Supplies Register
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Compiled from verified tax invoices for review and export. Complies with Table 4 (B2B Taxable Invoices) and Table 7 (B2C Others) data requirements.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredRows.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          id="export-gstr1-csv-btn"
        >
          <Download className="w-4 h-4" />
          <span>Export GSTR-1 CSV</span>
        </button>
      </div>

      {/* Scope Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 font-medium">
          <strong>Export Preparation Mode:</strong> This dataset extracts all valid outward supplies for the selected return period ({dateRange.label}). Use this formatted export to prepare your GSTR-1 return or share directly with your GST practitioner.
        </p>
      </div>

      {/* Quick Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setPartyTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                partyTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="gstr1-filter-all-btn"
            >
              All Invoices ({b2bCount + b2cCount})
            </button>
            <button
              onClick={() => setPartyTypeFilter('b2b')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                partyTypeFilter === 'b2b'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="gstr1-filter-b2b-btn"
            >
              B2B Registered ({b2bCount})
            </button>
            <button
              onClick={() => setPartyTypeFilter('b2c')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                partyTypeFilter === 'b2c'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="gstr1-filter-b2c-btn"
            >
              B2C Unregistered ({b2cCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice, GSTIN, place of supply..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              id="gstr1-search-input"
            />
          </div>
        </div>

        {/* Table or Empty State */}
        {filteredRows.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50" id="gstr1-empty-state">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No GSTR-1 records found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No outward tax invoices match the selected criteria for {dateRange.label}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer GSTIN</th>
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Place of Supply</th>
                  <th className="py-3 px-3 text-right">Taxable</th>
                  <th className="py-3 px-3 text-right">CGST</th>
                  <th className="py-3 px-3 text-right">SGST</th>
                  <th className="py-3 px-3 text-right">IGST</th>
                  <th className="py-3 px-3 text-right">Total Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {r.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {formatDate(r.invoiceDate, 'short')}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {r.customerGstin ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                          {r.customerGstin}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unregistered</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{r.customerName}</div>
                      {r.customerBusinessName && (
                        <div className="text-[10px] text-slate-400">{r.customerBusinessName}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          r.isB2B
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {r.isB2B ? 'B2B' : 'B2C'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">
                      {r.placeOfSupply}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">
                      {formatINR(r.taxableAmount)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                      {formatINR(r.cgst)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                      {formatINR(r.sgst)}
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-700 font-semibold">
                      {formatINR(r.igst)}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {formatINR(r.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/90 font-black text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={6} className="py-3 px-3 uppercase text-[11px]">
                    Total ({filteredRows.length} outward records)
                  </td>
                  <td className="py-3 px-3 text-right">{formatINR(totals.taxable)}</td>
                  <td className="py-3 px-3 text-right text-emerald-800">{formatINR(totals.cgst)}</td>
                  <td className="py-3 px-3 text-right text-emerald-800">{formatINR(totals.sgst)}</td>
                  <td className="py-3 px-3 text-right text-indigo-800">{formatINR(totals.igst)}</td>
                  <td className="py-3 px-3 text-right text-slate-900">{formatINR(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
