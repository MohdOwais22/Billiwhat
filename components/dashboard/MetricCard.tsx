import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';

interface MetricCardProps {
  id: string;
  title: string;
  amount: number;
  countLabel: string;
  countValue: number;
  icon: LucideIcon;
  variant?: 'primary' | 'warning' | 'danger' | 'success';
  trendPercent?: number;
  trendLabel?: string;
  tooltipText?: string;
}

export function MetricCard({
  id,
  title,
  amount,
  countLabel,
  countValue,
  icon: Icon,
  variant = 'primary',
  trendPercent,
  trendLabel,
  tooltipText,
}: MetricCardProps) {
  const variantStyles = {
    primary: {
      border: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-700',
      accentText: 'text-slate-900',
      tagBg: 'bg-slate-100 text-slate-700',
    },
    warning: {
      border: 'border-amber-200/80 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
      accentText: 'text-amber-950',
      tagBg: 'bg-amber-50 text-amber-800 border border-amber-200/60',
    },
    danger: {
      border: 'border-rose-200/80 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-700 border border-rose-200',
      accentText: 'text-rose-950',
      tagBg: 'bg-rose-50 text-rose-800 border border-rose-200/60',
    },
    success: {
      border: 'border-emerald-200/80 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      accentText: 'text-emerald-950',
      tagBg: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    },
  }[variant];

  return (
    <div
      id={id}
      className={`bg-white rounded-xl border ${variantStyles.border} p-4 sm:p-5 shadow-2xs transition-all relative overflow-hidden group`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {tooltipText && (
            <span title={tooltipText} className="cursor-help text-slate-400 hover:text-slate-600">
              <Info className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${variantStyles.accentText} font-mono`}>
            {formatINR(amount, { showDecimals: false })}
          </span>
        </div>
        {amount >= 100000 && (
          <span className="text-[11px] font-semibold text-slate-400">
            ({formatINR(amount, { compact: true })})
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${variantStyles.tagBg}`}>
          {countValue} {countLabel}
        </span>

        {trendPercent !== undefined && (
          <div className="flex items-center gap-1 text-[11px] font-semibold">
            {trendPercent >= 0 ? (
              <span className="flex items-center text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3 h-3 mr-0.5 text-emerald-600" />
                +{trendPercent}%
              </span>
            ) : (
              <span className="flex items-center text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                <ArrowDownRight className="w-3 h-3 mr-0.5 text-rose-600" />
                {trendPercent}%
              </span>
            )}
            {trendLabel && <span className="text-slate-400 text-[10px] hidden xl:inline">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
