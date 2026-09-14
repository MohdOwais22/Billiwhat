'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Printer, Palette } from 'lucide-react';
import { Customer, GstProfile, InvoiceItem, InvoiceWithDetails, Organization } from '@/types/database';
import { fetchInvoiceItems } from '@/lib/services/dashboardService';
import { InvoiceThemeRenderer } from './InvoiceThemeRenderer';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { ThemeID } from '@/lib/themes/types';
import { getTheme } from '@/lib/themes/registry';

interface PrintInvoiceModalProps {
  invoice: InvoiceWithDetails | null;
  organization?: Organization;
  gstProfile?: GstProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTheme?: (themeId: string) => Promise<void> | void;
}

export function PrintInvoiceModal({
  invoice,
  organization,
  gstProfile,
  isOpen,
  onClose,
  onUpdateTheme,
}: PrintInvoiceModalProps) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState<string>(
    organization?.invoice_theme_id || 'classic_ledger'
  );
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (organization?.invoice_theme_id) {
      setCurrentThemeId(organization.invoice_theme_id);
    }
  }, [organization?.invoice_theme_id]);

  useEffect(() => {
    if (isOpen && invoice?.id) {
      setLoading(true);
      fetchInvoiceItems(invoice.id)
        .then((data) => setItems(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleThemeChange = async (newThemeId: ThemeID) => {
    setCurrentThemeId(newThemeId);
    if (onUpdateTheme) {
      await onUpdateTheme(newThemeId);
    }
  };

  const activeTheme = getTheme(currentThemeId);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
        id="print-invoice-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Modal Top Control Bar (Hidden on actual print) */}
          <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 font-mono">
                Print Preview: {invoice.invoice_number}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-200 text-slate-800">
                Theme: {activeTheme.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsThemeSelectorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer"
                id="change-invoice-theme-btn"
              >
                <Palette className="w-3.5 h-3.5 text-emerald-600" />
                <span>Change Theme</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
                id="print-invoice-btn"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                aria-label="Close print preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Printable Invoice Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/50 print:bg-white print:p-0">
            <div
              ref={printContentRef}
              className="max-w-[800px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900 overflow-hidden"
              id="printable-tax-invoice-document"
            >
              {loading ? (
                <div className="p-12 text-center text-slate-500 font-mono text-xs animate-pulse">
                  Loading invoice line items...
                </div>
              ) : (
                <InvoiceThemeRenderer
                  themeId={currentThemeId}
                  invoice={invoice}
                  items={items}
                  organization={organization}
                  gstProfile={gstProfile}
                  customer={invoice.customer || undefined}
                  isPrintMode={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
        currentThemeId={currentThemeId}
        invoice={invoice}
        items={items}
        organization={organization}
        gstProfile={gstProfile}
        customer={invoice.customer || undefined}
        onSelectTheme={handleThemeChange}
      />
    </>
  );
}
