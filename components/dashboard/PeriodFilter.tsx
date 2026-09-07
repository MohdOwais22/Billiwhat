'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Filter, ChevronDown, Check, X, Sparkles, Clock } from 'lucide-react';
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
  { id: 'custom', label: 'Custom' },
];

export function PeriodFilter({
  selectedPeriod,
  currentDateRange,
  onPeriodChange,
  isLoading = false,
}: PeriodFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomPopover, setShowCustomPopover] = useState(false);
  const [customStart, setCustomStart] = useState(currentDateRange.startDate);
  const [customEnd, setCustomEnd] = useState(currentDateRange.endDate);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeOption = PERIOD_OPTIONS.find((p) => p.id === selectedPeriod) || PERIOD_OPTIONS[2];

  // Sync custom start/end with incoming dateRange
  useEffect(() => {
    setCustomStart(currentDateRange.startDate);
    setCustomEnd(currentDateRange.endDate);
  }, [currentDateRange.startDate, currentDateRange.endDate]);

  // Handle click outside and Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowCustomPopover(false);
        setShowDropdown(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowCustomPopover(false);
        setShowDropdown(false);
      }
    }

    if (showCustomPopover || showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCustomPopover, showDropdown]);

  const handleSelect = (period: PeriodType) => {
    setShowDropdown(false);
    if (period === 'custom') {
      setShowCustomPopover((prev) => !prev);
    } else {
      setShowCustomPopover(false);
      onPeriodChange(period);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setShowCustomPopover(false);
      onPeriodChange('custom', { startDate: customStart, endDate: customEnd });
    }
  };

  const setPresetRange = (preset: 'last_7' | 'last_30' | 'this_month' | 'last_month' | 'fy') => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let start = new Date();
    let end = new Date();

    if (preset === 'last_7') {
      start.setDate(now.getDate() - 6);
    } else if (preset === 'last_30') {
      start.setDate(now.getDate() - 29);
    } else if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'fy') {
      // Indian Financial Year: 1 Apr to 31 Mar
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      start = new Date(year, 3, 1);
      end = new Date(year + 1, 2, 31);
    }

    setCustomStart(toYMD(start));
    setCustomEnd(toYMD(end));
  };

  return (
    <div className="relative flex items-center gap-2 flex-wrap" id="period-filter-container" ref={containerRef}>
      {/* Desktop / Tablet Segmented Buttons */}
      <div className="hidden sm:inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 shadow-2xs">
        {PERIOD_OPTIONS.slice(0, 4).map((opt) => {
          const isSelected = selectedPeriod === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={isLoading}
              id={`period-btn-${opt.id}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
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
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedPeriod === 'custom' || showCustomPopover
              ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Calendar className={`w-3.5 h-3.5 ${selectedPeriod === 'custom' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>Custom</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showCustomPopover ? 'rotate-180 text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Mobile Dropdown Trigger */}
      <div className="relative sm:hidden">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 flex items-center gap-2 shadow-xs cursor-pointer"
          id="period-mobile-dropdown-btn"
        >
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>{activeOption.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {showDropdown && (
          <div className="absolute left-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <span>{opt.label}</span>
                {selectedPeriod === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Range Summary Tag */}
      <div className="text-[11px] font-medium text-slate-600 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/80 flex items-center gap-1.5 select-none">
        <span className="text-slate-400 font-normal">Period:</span>
        <span className="font-semibold text-slate-800">
          {formatDate(currentDateRange.startDate, 'short')} – {formatDate(currentDateRange.endDate, 'short')}
        </span>
      </div>

      {/* Custom Date Range Popover (Desktop / Tablet Anchored, Mobile Card) */}
      {showCustomPopover && (
        <>
          {/* Backdrop for Mobile Only */}
          <div
            className="sm:hidden fixed inset-0 z-40 bg-slate-950/40"
            onClick={() => setShowCustomPopover(false)}
          />

          <div
            ref={popoverRef}
            id="custom-date-popover"
            className="fixed sm:absolute inset-x-4 top-24 sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 z-50 w-auto sm:w-[340px] bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Custom Date Range</h3>
                  <p className="text-[10px] text-slate-500">Filter reports between exact dates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomPopover(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Quick Shortcuts
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setPresetRange('last_7')}
                  className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('last_30')}
                  className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('this_month')}
                  className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('fy')}
                  className="px-2 py-1 text-[11px] font-medium rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition cursor-pointer"
                >
                  FY 2026-27
                </button>
              </div>
            </div>

            {/* Date Inputs Form */}
            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    id="custom-start-date-input"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    id="custom-end-date-input"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomPopover(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  id="apply-custom-period-btn"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Filter</span>
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
