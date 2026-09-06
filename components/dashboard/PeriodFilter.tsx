'use client';

import React, { useState } from 'react';
import { Calendar, Filter, ChevronDown, Check } from 'lucide-react';
import { DateRange, PeriodType } from '@/types/database';
import { formatDate } from '@/lib/utils/formatters';

interface PeriodFilterProps {
  selectedPeriod: PeriodType;
  currentDateRange: DateRange;
  onPeriodChange: (period: PeriodType, customRange?: { startDate: string; endDate: string }) => void;
  isLoading?: boolean;
}

const PERIOD_OPTIONS: { id: PeriodType; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'custom', label: 'Custom Range' },
];

export function PeriodFilter({
  selectedPeriod,
  currentDateRange,
  onPeriodChange,
  isLoading = false,
}: PeriodFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(currentDateRange.startDate);
  const [customEnd, setCustomEnd] = useState(currentDateRange.endDate);

  const activeOption = PERIOD_OPTIONS.find((p) => p.id === selectedPeriod) || PERIOD_OPTIONS[2];

  const handleSelect = (period: PeriodType) => {
    setShowDropdown(false);
    if (period === 'custom') {
      setShowCustomModal(true);
    } else {
      onPeriodChange(period);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setShowCustomModal(false);
      onPeriodChange('custom', { startDate: customStart, endDate: customEnd });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap" id="period-filter-container">
      <div className="hidden sm:inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
        {PERIOD_OPTIONS.slice(0, 4).map((opt) => {
          const isSelected = selectedPeriod === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={isLoading}
              id={`period-btn-${opt.id}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        <button
          onClick={() => handleSelect('custom')}
          disabled={isLoading}
          id="period-btn-custom"
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
            selectedPeriod === 'custom'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Custom</span>
        </button>
      </div>

      <div className="relative sm:hidden">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 flex items-center gap-2 shadow-xs"
          id="period-mobile-dropdown-btn"
        >
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>{activeOption.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {showDropdown && (
          <div className="absolute left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-40">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>{opt.label}</span>
                {selectedPeriod === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80 flex items-center gap-1.5">
        <span className="text-slate-400">Period:</span>
        <span className="font-semibold text-slate-700">
          {formatDate(currentDateRange.startDate, 'short')} – {formatDate(currentDateRange.endDate, 'short')}
        </span>
      </div>

      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs" id="custom-date-modal">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Select Custom Period Range
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Filter sales, collections, and overdue reports between specific dates.
            </p>

            <form onSubmit={handleApplyCustom} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  id="custom-start-date-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  id="custom-end-date-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                  id="apply-custom-period-btn"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
