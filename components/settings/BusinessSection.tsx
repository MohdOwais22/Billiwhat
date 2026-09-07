'use client';

import React, { useState, useEffect } from 'react';
import { Organization } from '@/types/database';
import { INDIAN_STATES, getStateNameByCode } from '@/lib/constants/indianStates';
import { Building2, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BusinessSectionProps {
  organization: Organization;
  onUpdate: (updatedOrg: Organization) => void;
  canEdit: boolean;
}

export function BusinessSection({
  organization,
  onUpdate,
  canEdit,
}: BusinessSectionProps) {
  const [formData, setFormData] = useState({
    name: organization.name || '',
    legal_name: organization.legal_name || '',
    phone: organization.phone || '',
    email: organization.email || '',
    gstin: organization.gstin || '',
    address_line1: organization.address_line1 || '',
    address_line2: organization.address_line2 || '',
    city: organization.city || '',
    state: organization.state || '',
    state_code: organization.state_code || '',
    pincode: organization.pincode || '',
    country: organization.country || 'India',
    currency: organization.currency || 'INR',
    timezone: organization.timezone || 'Asia/Kolkata',
    invoice_prefix: organization.invoice_prefix || 'INV',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormData({
      name: organization.name || '',
      legal_name: organization.legal_name || '',
      phone: organization.phone || '',
      email: organization.email || '',
      gstin: organization.gstin || '',
      address_line1: organization.address_line1 || '',
      address_line2: organization.address_line2 || '',
      city: organization.city || '',
      state: organization.state || '',
      state_code: organization.state_code || '',
      pincode: organization.pincode || '',
      country: organization.country || 'India',
      currency: organization.currency || 'INR',
      timezone: organization.timezone || 'Asia/Kolkata',
      invoice_prefix: organization.invoice_prefix || 'INV',
    });
  }, [organization]);

  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    let derivedStateCode = formData.state_code;
    let derivedState = formData.state;

    if (raw.length >= 2) {
      const code = raw.substring(0, 2);
      const matchedState = getStateNameByCode(code);
      if (matchedState) {
        derivedStateCode = code;
        derivedState = matchedState;
      }
    }

    setFormData((prev) => ({
      ...prev,
      gstin: raw,
      state_code: derivedStateCode,
      state: derivedState,
    }));
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStateName = e.target.value;
    const match = INDIAN_STATES.find((s) => s.name === selectedStateName);
    setFormData((prev) => ({
      ...prev,
      state: selectedStateName,
      state_code: match ? match.code : prev.state_code,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!formData.name.trim()) {
      setErrorMessage('Business / Trading Name is required');
      setSaveStatus('error');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_business',
          payload: formData,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update business profile');
      }

      onUpdate(data.organization);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err: any) {
      console.error('Error updating business:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="settings-business-card">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Business Identity & Profile</h2>
              <p className="text-xs text-slate-500">Legal entity name, trade name, tax identity, and operating address</p>
            </div>
          </div>
        </div>

        {!canEdit && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium">
            View Only (Admin access required to edit)
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {saveStatus === 'success' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Business profile details saved successfully.</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage || 'Failed to save changes. Please try again.'}</span>
          </div>
        )}

        {/* Section 1: Business Identity */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Entity Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="business-name-input">
                Business / Trading Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="business-name-input"
                type="text"
                disabled={!canEdit}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Traders & Distributors"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Appears on invoice headers, receipts, and WhatsApp message headers.</p>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="legal-name-input">
                Legal Registered Name
              </label>
              <input
                id="legal-name-input"
                type="text"
                disabled={!canEdit}
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="e.g. Apex Commerce Private Limited"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">Full legal name matching your GST registration certificate.</p>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="business-gstin-input">
                GSTIN (Goods & Services Tax Identifier)
              </label>
              <input
                id="business-gstin-input"
                type="text"
                maxLength={15}
                disabled={!canEdit}
                value={formData.gstin}
                onChange={handleGstinChange}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">15-character statutory GST identification number.</p>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="business-prefix-input">
                Default Invoice Prefix
              </label>
              <input
                id="business-prefix-input"
                type="text"
                maxLength={8}
                disabled={!canEdit}
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })}
                placeholder="e.g. INV or APX"
                className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">Generated numbers will be formatted as {formData.invoice_prefix || 'INV'}-0001.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Official Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="business-phone-input">
                Official Business Phone / WhatsApp
              </label>
              <input
                id="business-phone-input"
                type="tel"
                disabled={!canEdit}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="business-email-input">
                Official Billing Email
              </label>
              <input
                id="business-email-input"
                type="email"
                disabled={!canEdit}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. accounts@apextraders.in"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Operating Address */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Registered Principal Address</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="address-line1-input">
                Address Line 1
              </label>
              <input
                id="address-line1-input"
                type="text"
                disabled={!canEdit}
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="Shop / Unit / Floor / Building Name"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="address-line2-input">
                Address Line 2
              </label>
              <input
                id="address-line2-input"
                type="text"
                disabled={!canEdit}
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                placeholder="Street / Area / Landmark / Commercial Complex"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="city-input">
                  City / District
                </label>
                <input
                  id="city-input"
                  type="text"
                  disabled={!canEdit}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="state-select">
                  State / UT
                </label>
                <select
                  id="state-select"
                  disabled={!canEdit}
                  value={formData.state}
                  onChange={handleStateChange}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="pincode-input">
                  Pincode
                </label>
                <input
                  id="pincode-input"
                  type="text"
                  maxLength={6}
                  disabled={!canEdit}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 400001"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="country-input">
                  Country
                </label>
                <input
                  id="country-input"
                  type="text"
                  disabled
                  value={formData.country}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="currency-input">
                  Operating Currency
                </label>
                <input
                  id="currency-input"
                  type="text"
                  disabled
                  value={`${formData.currency} (₹ Indian Rupee)`}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="timezone-input">
                  System Timezone
                </label>
                <input
                  id="timezone-input"
                  type="text"
                  disabled
                  value="Asia/Kolkata (IST +05:30)"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="pt-6 pb-2 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 transition disabled:opacity-50 cursor-pointer"
              id="save-business-settings-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Business Details</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
