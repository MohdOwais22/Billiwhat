'use client';

import React, { useState, useEffect } from 'react';
import { GstProfile, Organization } from '@/types/database';
import { INDIAN_STATES, getStateNameByCode } from '@/lib/constants/indianStates';
import { ShieldCheck, Save, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react';

interface GstTaxSectionProps {
  gstProfile?: GstProfile | null;
  organization: Organization;
  onUpdate: (updatedGst: GstProfile) => void;
  canEdit: boolean;
}

export function GstTaxSection({
  gstProfile,
  organization,
  onUpdate,
  canEdit,
}: GstTaxSectionProps) {
  const [formData, setFormData] = useState({
    gstin: gstProfile?.gstin || organization.gstin || '',
    legal_name: gstProfile?.legal_name || organization.legal_name || organization.name || '',
    trade_name: gstProfile?.trade_name || organization.name || '',
    state_code: gstProfile?.state_code || organization.state_code || '27',
    registration_type: gstProfile?.registration_type || 'Regular',
    place_of_supply: gstProfile?.place_of_supply || organization.state || 'Maharashtra',
    e_invoice_enabled: gstProfile?.e_invoice_enabled || false,
    e_way_bill_enabled: gstProfile?.e_way_bill_enabled || false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormData({
      gstin: gstProfile?.gstin || organization.gstin || '',
      legal_name: gstProfile?.legal_name || organization.legal_name || organization.name || '',
      trade_name: gstProfile?.trade_name || organization.name || '',
      state_code: gstProfile?.state_code || organization.state_code || '27',
      registration_type: gstProfile?.registration_type || 'Regular',
      place_of_supply: gstProfile?.place_of_supply || organization.state || 'Maharashtra',
      e_invoice_enabled: gstProfile?.e_invoice_enabled || false,
      e_way_bill_enabled: gstProfile?.e_way_bill_enabled || false,
    });
  }, [gstProfile, organization]);

  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    let derivedCode = formData.state_code;
    let derivedPlace = formData.place_of_supply;

    if (raw.length >= 2) {
      const code = raw.substring(0, 2);
      const matchedState = getStateNameByCode(code);
      if (matchedState) {
        derivedCode = code;
        derivedPlace = matchedState;
      }
    }

    setFormData((prev) => ({
      ...prev,
      gstin: raw,
      state_code: derivedCode,
      place_of_supply: derivedPlace,
    }));
  };

  const handleStateCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const stateName = getStateNameByCode(code);
    setFormData((prev) => ({
      ...prev,
      state_code: code,
      place_of_supply: stateName || prev.place_of_supply,
    }));
  };

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
          action: 'update_gst',
          payload: formData,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update GST profile');
      }

      onUpdate(data.gstProfile);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err: any) {
      console.error('Error updating GST profile:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="settings-gst-card">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">GST & Tax Compliance</h2>
              <p className="text-xs text-slate-500">Statutory GSTIN registration, place of supply, and E-Way/E-Invoice toggles</p>
            </div>
          </div>
        </div>

        {!canEdit && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium">
            View Only (Admin access required)
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {saveStatus === 'success' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>GST & Tax configuration updated successfully.</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage || 'Failed to save GST changes.'}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="gst-gstin-input">
              GST Identification Number (GSTIN)
            </label>
            <input
              id="gst-gstin-input"
              type="text"
              maxLength={15}
              disabled={!canEdit}
              value={formData.gstin}
              onChange={handleGstinChange}
              placeholder="e.g. 27AAAAA0000A1Z5"
              className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">State code is automatically derived from the first 2 digits.</p>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="gst-reg-type-select">
              GST Registration Type
            </label>
            <select
              id="gst-reg-type-select"
              disabled={!canEdit}
              value={formData.registration_type}
              onChange={(e) => setFormData({ ...formData, registration_type: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
            >
              <option value="Regular">Regular Taxpayer (Monthly / Quarterly GSTR-1)</option>
              <option value="Composition">Composition Scheme Dealer</option>
              <option value="SEZ Unit">Special Economic Zone (SEZ) Unit</option>
              <option value="SEZ Developer">Special Economic Zone (SEZ) Developer</option>
              <option value="Consumer / Unregistered">Unregistered / Consumer</option>
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="gst-legal-name-input">
              Legal Name (As on GST Portal)
            </label>
            <input
              id="gst-legal-name-input"
              type="text"
              disabled={!canEdit}
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              placeholder="e.g. Apex Commerce Private Limited"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="gst-trade-name-input">
              Trade Name / Brand Name
            </label>
            <input
              id="gst-trade-name-input"
              type="text"
              disabled={!canEdit}
              value={formData.trade_name}
              onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
              placeholder="e.g. Apex Traders"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="gst-state-code-select">
              State Code (GST Jurisdiction)
            </label>
            <select
              id="gst-state-code-select"
              disabled={!canEdit}
              value={formData.state_code}
              onChange={handleStateCodeChange}
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="gst-place-of-supply-input">
              Default Place of Supply
            </label>
            <input
              id="gst-place-of-supply-input"
              type="text"
              disabled={!canEdit}
              value={formData.place_of_supply}
              onChange={(e) => setFormData({ ...formData, place_of_supply: e.target.value })}
              placeholder="e.g. Maharashtra"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
            />
          </div>
        </div>

        {/* GST E-Invoicing & E-Way Bill Options */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Statutory Integrations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  E-Invoicing (IRN & QR Generation)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mandatory for B2B merchants above ₹5 Cr annual turnover. Enables direct IRP transmission.
                </p>
                <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {formData.e_invoice_enabled ? 'Active on Invoices' : 'Disabled'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={formData.e_invoice_enabled}
                  onChange={(e) => setFormData({ ...formData, e_invoice_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  E-Way Bill Direct Generation
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enables Part-A & Part-B generation for goods shipments above statutory threshold (₹50,000).
                </p>
                <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {formData.e_way_bill_enabled ? 'Active on Delivery Challans' : 'Disabled'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={formData.e_way_bill_enabled}
                  onChange={(e) => setFormData({ ...formData, e_way_bill_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="pt-6 pb-2 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 transition disabled:opacity-50 cursor-pointer"
              id="save-gst-settings-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating GST Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save GST Settings</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
