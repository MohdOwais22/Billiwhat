'use client';

import React from 'react';
import { InvoiceTheme } from '@/lib/themes/types';
import { Check, Eye, Layers } from 'lucide-react';

interface InvoiceThemePreviewProps {
  theme: InvoiceTheme;
  isSelected?: boolean;
  onSelect: (theme: InvoiceTheme) => void;
  onPreview?: (theme: InvoiceTheme) => void;
}

export function InvoiceThemePreview({
  theme,
  isSelected,
  onSelect,
  onPreview,
}: InvoiceThemePreviewProps) {
  return (
    <div
      onClick={() => onSelect(theme)}
      className={`group relative bg-white rounded-xl border transition-all cursor-pointer overflow-hidden p-3.5 flex flex-col justify-between ${
        isSelected
          ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-md bg-emerald-50/10'
          : 'border-slate-200 hover:border-slate-400 hover:shadow-sm'
      }`}
    >
      {/* Selection Pill */}
      {isSelected && (
        <div className="absolute top-3 right-3 bg-emerald-600 text-white rounded-full p-1 z-10 shadow-xs">
          <Check className="w-3.5 h-3.5" />
        </div>
      )}

      <div>
        {/* Color Accent Preview Header Box */}
        <div
          className="h-20 rounded-lg w-full mb-3 p-2 flex flex-col justify-between border border-slate-200/80 shadow-2xs relative overflow-hidden"
          style={{ backgroundColor: `${theme.previewAccentColor}10` }}
        >
          <div
            className="h-1.5 rounded-full w-1/3"
            style={{ backgroundColor: theme.previewAccentColor }}
          ></div>
          <div className="space-y-1">
            <div className="h-1 bg-slate-300 rounded-full w-3/4"></div>
            <div className="h-1 bg-slate-200 rounded-full w-1/2"></div>
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase font-bold">
            <span>{theme.paperSize}</span>
            <span className="capitalize">{theme.density}</span>
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
          {theme.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {theme.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
          <Layers className="w-3 h-3" />
          {theme.category}
        </span>

        {onPreview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(theme);
            }}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-600 font-bold hover:underline transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live View</span>
          </button>
        )}
      </div>
    </div>
  );
}
