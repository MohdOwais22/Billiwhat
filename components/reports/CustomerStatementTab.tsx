'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Printer,
  Download,
  Building2,
  Phone,
  CreditCard,
  ReceiptText,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  calculateCustomerStatement,
  CustomerStatementData,
  FullReportsData,
} from '@/lib/services/reportsService';
import { Customer } from '@/types/database';
import { formatINR, formatDate } from '@/lib/utils/formatters';
import { exportCustomerStatementToCSV } from '@/lib/utils/reportExport';

interface CustomerStatementTabProps {
  data: FullReportsData;
}

export function CustomerStatementTab({ data }: CustomerStatementTabProps) {
  const { customers, allInvoices, allPayments, dateRange, organization } = data;

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers.length > 0 ? customers[0].id : ''
  );
  const [customerSearch, setCustomerSearch] = useState<string>('');

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const statementData: CustomerStatementData | null = useMemo(() => {
    if (!selectedCustomer) return null;
    return calculateCustomerStatement({
      customer: selectedCustomer,
      allInvoices,
      allPayments,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  }, [selectedCustomer, allInvoices, allPayments, dateRange]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.business_name?.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.gstin?.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (statementData) {
      exportCustomerStatementToCSV(statementData, dateRange.label);
    }
  };

  return (
    <div className="space-y-6" id="customer-statement-tab-content">
      {/* Customer Selector & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="w-full md:w-auto flex-1 max-w-lg">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
            Select Customer / Credit Party
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              id="statement-customer-select"
            >
              {customers.length === 0 && (
                <option value="">No registered customers found</option>
              )}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.business_name ? `• ${c.business_name}` : ''} ({c.phone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCustomer && statementData && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              id="print-customer-statement-btn"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Statement</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer"
              id="export-customer-statement-csv-btn"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center" id="statement-empty-state">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No Customers in Database</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Add customers and generate invoices to review party account ledgers and statement of accounts.
          </p>
        </div>
      ) : !selectedCustomer || !statementData ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Please select a customer from the dropdown above to view the account statement.
        </div>
      ) : (
        /* Printable Statement Card */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0" id="statement-print-container">
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Statement of Account
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                {statementData.customer.name}
              </h2>
              {statementData.customer.business_name && (
                <p className="text-xs font-semibold text-slate-600">
                  {statementData.customer.business_name}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span>Phone: {statementData.customer.phone}</span>
                <span>•</span>
                <span>GSTIN: {statementData.customer.gstin || 'Unregistered'}</span>
                <span>•</span>
                <span>Address: {statementData.customer.billing_address || 'N/A'}</span>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs font-bold text-slate-900">{organization.name}</div>
              <div className="text-[11px] text-slate-500">{organization.legal_name || ''}</div>
              <div className="text-[11px] text-slate-500">GST: {organization.gstin || 'N/A'}</div>
              <div className="text-[11px] font-bold text-emerald-700 mt-2 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                Period: {dateRange.label}
              </div>
            </div>
          </div>

          {/* Statement Summary Metric Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Opening Balance
              </span>
              <span className="text-base font-black text-slate-900 mt-1 block">
                {formatINR(statementData.openingBalance)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                B/F prior to {formatDate(dateRange.startDate, 'short')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Invoiced (Debits)
              </span>
              <span className="text-base font-black text-slate-900 mt-1 block">
                +{formatINR(statementData.totalDebits)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                In period outward bills
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Paid (Credits)
              </span>
              <span className="text-base font-black text-emerald-600 mt-1 block">
                -{formatINR(statementData.totalCredits)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Payments settled
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Closing Balance Due
              </span>
              <span className={`text-base font-black mt-1 block ${
                statementData.closingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {formatINR(statementData.closingBalance)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                As of {formatDate(dateRange.endDate, 'short')}
              </span>
            </div>
          </div>

          {/* Chronological Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Reference #</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Debit (+)</th>
                  <th className="py-3 px-3 text-right">Credit (-)</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {/* Opening Balance Row */}
                <tr className="bg-slate-50/50 font-semibold text-slate-800">
                  <td className="py-3 px-3 text-slate-500">{formatDate(dateRange.startDate, 'short')}</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      OPENING
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">B/F</td>
                  <td className="py-3 px-3 italic text-slate-500">Balance brought forward prior to {dateRange.label}</td>
                  <td className="py-3 px-3 text-right">—</td>
                  <td className="py-3 px-3 text-right">—</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {formatINR(statementData.openingBalance)}
                  </td>
                </tr>

                {statementData.entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                      No invoices or payment transactions recorded during {dateRange.label}.
                    </td>
                  </tr>
                ) : (
                  statementData.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-slate-600">
                        {formatDate(entry.date, 'short')}
                      </td>
                      <td className="py-3 px-3">
                        {entry.type === 'invoice' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowUpRight className="w-3 h-3" />
                            INVOICE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3" />
                            PAYMENT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {entry.reference}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {entry.description}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        {entry.debit > 0 ? formatINR(entry.debit) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-600">
                        {entry.credit > 0 ? formatINR(entry.credit) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        {formatINR(entry.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-black border-t-2 border-slate-900">
                <tr>
                  <td colSpan={4} className="py-3 px-3 uppercase text-[11px]">
                    Closing Position as of {formatDate(dateRange.endDate, 'short')}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-200">
                    +{formatINR(statementData.totalDebits)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400">
                    -{formatINR(statementData.totalCredits)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-400">
                    {formatINR(statementData.closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
