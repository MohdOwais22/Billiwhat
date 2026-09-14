'use client';

import React, { useState } from 'react';
import { X, Palette, Check, Sparkles, Layout, Monitor, ShieldCheck } from 'lucide-react';
import { Customer, GstProfile, InvoiceItem, InvoiceWithDetails, Organization } from '@/types/database';
import { InvoiceTheme, ThemeCategory, ThemeID } from '@/lib/themes/types';
import { getAllThemes, getTheme } from '@/lib/themes/registry';
import { InvoiceThemePreview } from './InvoiceThemePreview';
import { InvoiceThemeRenderer } from './InvoiceThemeRenderer';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId?: string | null;
  invoice?: InvoiceWithDetails | null;
  items?: InvoiceItem[];
  organization?: Organization | null;
  gstProfile?: GstProfile | null;
  customer?: Customer | null;
  onSelectTheme: (themeId: ThemeID) => Promise<void> | void;
}

export function ThemeSelectorModal({
  isOpen,
  onClose,
  currentThemeId,
  invoice,
  items,
  organization,
  gstProfile,
  customer,
  onSelectTheme,
}: ThemeSelectorModalProps) {
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeID>(
    (currentThemeId as ThemeID) || 'classic_ledger'
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [previewingTheme, setPreviewingTheme] = useState<InvoiceTheme | null>(
    getTheme(currentThemeId)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const allThemes = getAllThemes();

  const filteredThemes = allThemes.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category === activeCategory;
  });

  const handleApplyTheme = async () => {
    try {
      setIsSaving(true);
      await onSelectTheme(selectedThemeId);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to save theme choice:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Themes (15)' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'gst', label: 'GST B2B' },
    { id: 'modern', label: 'Modern & Clean' },
    { id: 'compact', label: 'Compact & A5' },
    { id: 'industry', label: 'Wholesale & Mfg' },
    { id: 'mobile', label: 'WhatsApp Mobile' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-hidden"
      id="theme-selector-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-6xl w-full flex flex-col h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Invoice Theme Engine & Multi-Theme Library
              </h2>
              <p className="text-xs text-slate-500">
                Choose a visual template for your organization. Invoice numbers, taxes, and financial data remain 100% immutable.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyTheme}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
              id="apply-theme-btn"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved as Default!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isSaving ? 'Applying...' : 'Set as Default Theme'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Split Screen */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Catalog & Categories */}
          <div className="w-1/2 md:w-5/12 border-r border-slate-200 flex flex-col bg-slate-50/50">
            {/* Category Filter Pills */}
            <div className="p-3 border-b border-slate-200 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid of Theme Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredThemes.map((theme) => (
                <InvoiceThemePreview
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedThemeId === theme.id}
                  onSelect={(t) => {
                    setSelectedThemeId(t.id);
                    setPreviewingTheme(t);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right Area: Live Real-time Interactive Theme Previewer */}
          <div className="flex-1 flex flex-col bg-slate-100/80 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-200 bg-white flex justify-between items-center text-xs shrink-0">
              <span className="font-bold text-slate-700 inline-flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-emerald-600" />
                Live Preview: <strong className="text-slate-900">{previewingTheme?.name}</strong>
              </span>

              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {invoice ? 'Active Invoice View' : 'Sample Interactive Data'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 w-full max-w-[800px] p-2">
                <InvoiceThemeRenderer
                  themeId={selectedThemeId}
                  invoice={invoice}
                  items={items}
                  organization={organization}
                  gstProfile={gstProfile}
                  customer={customer}
                  useSampleDataIfMissing={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
