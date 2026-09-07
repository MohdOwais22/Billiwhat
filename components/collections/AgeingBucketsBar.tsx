'use client';

import React from 'react';
import { AgeingBucketKey, AgeingBucketTotals } from '@/lib/services/collectionsService';
import { formatINR } from '@/lib/utils/formatters';

interface AgeingBucketsBarProps {
  ageingBuckets: AgeingBucketTotals;
  totalOutstanding: number;
  selectedBucket: AgeingBucketKey | 'all';
  onSelectBucket: (bucket: AgeingBucketKey | 'all') => void;
}

export function AgeingBucketsBar({
  ageingBuckets,
  totalOutstanding,
  selectedBucket,
  onSelectBucket,
}: AgeingBucketsBarProps) {
  const buckets: {
    key: AgeingBucketKey;
    label: string;
    sublabel: string;
    data: { amount: number; count: number; percent: number };
    bgActive: string;
    borderActive: string;
    badgeBg: string;
    badgeText: string;
    barColor: string;
  }[] = [
    {
      key: 'current',
      label: 'Current',
      sublabel: 'Not Due / On Schedule',
      data: ageingBuckets.current,
      bgActive: 'bg-emerald-50/80',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      badgeText: 'text-emerald-700',
      barColor: 'bg-emerald-500',
    },
    {
      key: '1-30',
      label: '1–30 Days',
      sublabel: 'Early Overdue',
      data: ageingBuckets.days1to30,
      bgActive: 'bg-amber-50/80',
      borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
      badgeBg: 'bg-amber-100 text-amber-800',
      badgeText: 'text-amber-700',
      barColor: 'bg-amber-500',
    },
    {
      key: '31-60',
      label: '31–60 Days',
      sublabel: 'Medium Risk',
      data: ageingBuckets.days31to60,
      bgActive: 'bg-orange-50/80',
      borderActive: 'border-orange-500 ring-2 ring-orange-500/20',
      badgeBg: 'bg-orange-100 text-orange-800',
      badgeText: 'text-orange-700',
      barColor: 'bg-orange-500',
    },
    {
      key: '61-90',
      label: '61–90 Days',
      sublabel: 'High Risk Debt',
      data: ageingBuckets.days61to90,
      bgActive: 'bg-rose-50/80',
      borderActive: 'border-rose-500 ring-2 ring-rose-500/20',
      badgeBg: 'bg-rose-100 text-rose-800',
      badgeText: 'text-rose-700',
      barColor: 'bg-rose-500',
    },
    {
      key: '90+',
      label: '90+ Days',
      sublabel: 'Critical / Hold',
      data: ageingBuckets.days90Plus,
      bgActive: 'bg-red-50/80',
      borderActive: 'border-red-600 ring-2 ring-red-600/20',
      badgeBg: 'bg-red-200 text-red-900',
      badgeText: 'text-red-800',
      barColor: 'bg-red-700',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4" id="ageing-buckets-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Receivables Debt Ageing Schedule</h3>
          <p className="text-xs text-slate-500">
            Click any ageing bracket to filter collection queue and customer ledger
          </p>
        </div>

        {selectedBucket !== 'all' && (
          <button
            onClick={() => onSelectBucket('all')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer self-start sm:self-auto"
          >
            Clear bracket filter (Show All)
          </button>
        )}
      </div>

      {/* Proportional Distribution Visual Bar */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {buckets.map((b) => {
            const width = totalOutstanding > 0 ? (b.data.amount / totalOutstanding) * 100 : 0;
            if (width <= 0) return null;
            return (
              <div
                key={b.key}
                style={{ width: `${width}%` }}
                className={`${b.barColor} transition-all duration-300 relative group cursor-pointer`}
                onClick={() => onSelectBucket(selectedBucket === b.key ? 'all' : b.key)}
                title={`${b.label}: ${formatINR(b.data.amount)} (${Math.round(width)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Interactive Bucket Cards / Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {buckets.map((b) => {
          const isSelected = selectedBucket === b.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => onSelectBucket(isSelected ? 'all' : b.key)}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `${b.bgActive} ${b.borderActive} shadow-xs`
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {b.label}
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${b.badgeBg}`}>
                  {b.data.percent}%
                </span>
              </div>

              <div className="text-base font-black text-slate-900 mt-1">
                {formatINR(b.data.amount)}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1.5 border-t border-slate-200/60">
                <span>{b.data.count} bills</span>
                <span className="text-[10px] text-slate-400 font-medium">{b.sublabel}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
