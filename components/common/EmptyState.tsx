import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = PackageOpen,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-4 text-center bg-white rounded-xl border border-slate-200 shadow-xs max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
        <Icon className="w-6 h-6 stroke-1.5" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
