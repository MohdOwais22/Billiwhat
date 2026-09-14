'use client';

import React from 'react';
import { InvoiceTheme } from '@/lib/themes/types';
import { Check } from 'lucide-react';

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
}: InvoiceThemePreviewProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme)}
      className={`relative text-left w-full p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'bg-emerald-50/40 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
          : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-2xs'
      }`}
    >
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Accent Color Dot */}
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-slate-300"
            style={{ backgroundColor: theme.previewAccentColor }}
          />

          <div className="min-w-0">
            {/* Theme Name */}
            <h3 className="font-extrabold text-slate-900 text-sm truncate leading-snug">
              {theme.name}
            </h3>
            {/* Paper Size & Category Badges */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                {theme.paperSize}
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                {theme.category}
              </span>
            </div>
          </div>
        </div>

        {/* Selection Indicator */}
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition ${
            isSelected
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
              : 'border-slate-300 bg-slate-50'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Short Subtitle / Description */}
      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
        {theme.description}
      </p>
    </button>
  );
}
