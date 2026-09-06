import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className="py-8 px-4 text-center text-slate-500" id="empty-state-compact">
        {Icon && <Icon className="w-8 h-8 mx-auto mb-2 text-slate-300" />}
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">{description}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
            id="empty-state-compact-action"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200" id="empty-state-full">
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition"
          id="empty-state-action-btn"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
