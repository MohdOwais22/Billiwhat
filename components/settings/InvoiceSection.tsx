'use client';

import React, { useState, useEffect } from 'react';
import { Organization } from '@/types/database';
import { ReceiptText, Save, CheckCircle2, AlertCircle, Loader2, QrCode, FileText } from 'lucide-react';

interface InvoiceSectionProps {
  organization: Organization;
  onUpdate: (updatedOrg: Organization) => void;
  canEdit: boolean;
}

export function InvoiceSection({
  organization,
  onUpdate,
  canEdit,
}: InvoiceSectionProps) {
  const [formData, setFormData] = useState({
    invoice_prefix: organization.invoice_prefix || 'INV',
    invoice_sequence: organization.invoice_sequence || 1,
    default_terms: '1. Goods once sold will not be taken back or exchanged.\n2. Interest @18% p.a. will be charged on overdue payments beyond credit period.\n3. Subject to local jurisdiction only.',
    default_notes: 'Thank you for your business! Please scan the UPI QR code on the invoice or transfer directly to our registered bank account.',
    default_payment_terms: 'Net 30',
    show_hsn: true,
    show_tax_breakup: true,
    show_upi_qr: true,
    round_off_total: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      invoice_prefix: organization.invoice_prefix || 'INV',
      invoice_sequence: organization.invoice_sequence || 1,
    }));
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_invoice',
          payload: {
            invoice_prefix: formData.invoice_prefix,
            invoice_sequence: Number(formData.invoice_sequence),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update invoice settings');
      }

      onUpdate(data.organization);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err: any) {
      console.error('Error updating invoice settings:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewInvoiceNumber = `${formData.invoice_prefix || 'INV'}-${String(formData.invoice_sequence || 1).padStart(4, '0')}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="settings-invoice-card">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Invoice Series & Formatting</h2>
              <p className="text-xs text-slate-500">Invoice numbering sequence, default payment terms, notes, and layout</p>
            </div>
          </div>
        </div>

        {!canEdit && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium">
            View Only
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {saveStatus === 'success' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Invoice sequence and defaults saved successfully.</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage || 'Failed to save invoice settings.'}</span>
          </div>
        )}

        {/* Series & Numbering */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Numbering Sequence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="inv-prefix-input">
                Invoice Series Prefix
              </label>
              <input
                id="inv-prefix-input"
                type="text"
                maxLength={8}
                disabled={!canEdit}
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })}
                placeholder="e.g. INV"
                className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="inv-sequence-input">
                Next Invoice Counter Sequence
              </label>
              <input
                id="inv-sequence-input"
                type="number"
                min={1}
                disabled={!canEdit}
                value={formData.invoice_sequence}
                onChange={(e) => setFormData({ ...formData, invoice_sequence: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Generated Number Preview
              </label>
              <div className="px-3.5 py-2 text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>{previewInvoiceNumber}</span>
                <span className="text-[10px] font-normal text-slate-500">Auto-incrementing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Default Payment Terms */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Terms & Defaults</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="inv-payment-terms-select">
                Default Credit / Due Period
              </label>
              <select
                id="inv-payment-terms-select"
                disabled={!canEdit}
                value={formData.default_payment_terms}
                onChange={(e) => setFormData({ ...formData, default_payment_terms: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              >
                <option value="Due on Receipt">Due on Receipt (Immediate)</option>
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days (Standard B2B)</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="inv-default-notes">
                Default Customer Notes (Footer)
              </label>
              <textarea
                id="inv-default-notes"
                rows={2}
                disabled={!canEdit}
                value={formData.default_notes}
                onChange={(e) => setFormData({ ...formData, default_notes: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="inv-default-terms">
                Standard Terms & Conditions
              </label>
              <textarea
                id="inv-default-terms"
                rows={3}
                disabled={!canEdit}
                value={formData.default_terms}
                onChange={(e) => setFormData({ ...formData, default_terms: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>
          </div>
        </div>

        {/* Invoice Display Layout Controls */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Print & PDF Template Rules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Print Dynamic UPI QR Code</p>
                  <p className="text-[11px] text-slate-500">Allows instant 1-tap scan to pay on invoice PDFs</p>
                </div>
              </div>
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={formData.show_upi_qr}
                onChange={(e) => setFormData({ ...formData, show_upi_qr: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Show HSN / SAC Code Column</p>
                  <p className="text-[11px] text-slate-500">Required for GST compliance for products/services</p>
                </div>
              </div>
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={formData.show_hsn}
                onChange={(e) => setFormData({ ...formData, show_hsn: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="pt-6 pb-2 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 transition disabled:opacity-50 cursor-pointer"
              id="save-invoice-settings-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Invoicing Defaults...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Invoicing Settings</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
