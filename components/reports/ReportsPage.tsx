'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  ReceiptText,
  FileSpreadsheet,
  Users,
  ClockAlert,
  Calendar,
  RotateCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  calculateReportDateRange,
  fetchFinancialReportsData,
  FullReportsData,
  ReportPeriod,
} from '@/lib/services/reportsService';
import { useDashboard } from '@/context/DashboardContext';
import { FinancialOverviewTab } from './FinancialOverviewTab';
import { SalesReportTab } from './SalesReportTab';
import { GstReportTab } from './GstReportTab';
import { Gstr1Tab } from './Gstr1Tab';
import { CustomerStatementTab } from './CustomerStatementTab';
import { ReceivablesAgeingTab } from './ReceivablesAgeingTab';

export type ReportTab = 'overview' | 'sales' | 'gst' | 'gstr1' | 'statements' | 'ageing';

export function ReportsPage() {
  const { handleNavigate } = useDashboard();

  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [period, setPeriod] = useState<ReportPeriod>('this_month');
  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  });

  const [reportsData, setReportsData] = useState<FullReportsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const calculatedRange = calculateReportDateRange(
    period,
    period === 'custom' ? customRange : undefined
  );

  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchFinancialReportsData(calculatedRange);
      setReportsData(data);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError(err?.message || 'Failed to load financial reports from database.');
    } finally {
      setIsLoading(false);
    }
  }, [calculatedRange.startDate, calculatedRange.endDate, period]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6" id="reports-gst-workspace">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & GST</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Financial Suite
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Financial reports, GST summaries and customer account statements.
          </p>
        </div>

        {/* Date Filter & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Period Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setPeriod('this_month')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                period === 'this_month'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="report-period-this-month"
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod('last_month')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                period === 'last_month'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="report-period-last-month"
            >
              Last Month
            </button>
            <button
              onClick={() => setPeriod('this_quarter')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                period === 'this_quarter'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="report-period-this-quarter"
            >
              This Quarter
            </button>
            <button
              onClick={() => setPeriod('this_fy')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                period === 'this_fy'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="report-period-this-fy"
            >
              This FY
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                period === 'custom'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="report-period-custom"
            >
              Custom
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={loadReports}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            title="Refresh reports"
            id="report-refresh-btn"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Pickers (Shown when Custom is selected) */}
      {period === 'custom' && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">From:</span>
            <input
              type="date"
              value={customRange.startDate}
              onChange={(e) =>
                setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              id="report-custom-start-date"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">To:</span>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(e) =>
                setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              id="report-custom-end-date"
            />
          </div>

          <button
            onClick={loadReports}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer shadow-2xs"
            id="report-apply-custom-dates-btn"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Primary Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto pb-1" aria-label="Reports tabs">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'sales', label: 'Sales Report', icon: TrendingUp },
            { id: 'gst', label: 'GST Summary', icon: FileText },
            { id: 'gstr1', label: 'GSTR-1 Prep', icon: FileSpreadsheet },
            { id: 'statements', label: 'Customer Statements', icon: Users },
            { id: 'ageing', label: 'Receivables Ageing', icon: ClockAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
                id={`report-tab-${tab.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      {isLoading && !reportsData ? (
        <div className="space-y-4 py-8" id="reports-loading-skeleton">
          <div className="h-28 bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="h-28 bg-slate-100 rounded-2xl animate-pulse"></div>
            <div className="h-28 bg-slate-100 rounded-2xl animate-pulse"></div>
            <div className="h-28 bg-slate-100 rounded-2xl animate-pulse"></div>
            <div className="h-28 bg-slate-100 rounded-2xl animate-pulse"></div>
          </div>
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3" id="reports-error-state">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Failed to Load Reports</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadReports}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : reportsData ? (
        <>
          {activeTab === 'overview' && (
            <FinancialOverviewTab
              data={reportsData}
              onNavigateTab={(tabKey) => setActiveTab(tabKey as ReportTab)}
            />
          )}

          {activeTab === 'sales' && <SalesReportTab data={reportsData} />}

          {activeTab === 'gst' && (
            <GstReportTab
              data={reportsData}
              onNavigateToSettings={() => handleNavigate('settings')}
            />
          )}

          {activeTab === 'gstr1' && <Gstr1Tab data={reportsData} />}

          {activeTab === 'statements' && <CustomerStatementTab data={reportsData} />}

          {activeTab === 'ageing' && <ReceivablesAgeingTab data={reportsData} />}
        </>
      ) : null}
    </div>
  );
}
