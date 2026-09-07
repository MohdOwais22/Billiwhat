'use client';

import React, { useState } from 'react';
import { Organization } from '@/types/database';
import { MessageSquare, Save, CheckCircle2, AlertCircle, Loader2, Smartphone, Key, ExternalLink } from 'lucide-react';

interface WhatsAppSectionProps {
  organization: Organization;
  onUpdate: (updatedOrg: Organization) => void;
  canEdit: boolean;
}

export function WhatsAppSection({
  organization,
  onUpdate,
  canEdit,
}: WhatsAppSectionProps) {
  const [phone, setPhone] = useState(organization.phone || '');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const hasConfiguredApi = Boolean(phoneNumberId && wabaId && accessToken);

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
          action: 'update_business',
          payload: {
            ...organization,
            phone: phone.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update WhatsApp phone number');
      }

      onUpdate(data.organization);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err: any) {
      console.error('Error saving WhatsApp settings:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'Failed to save WhatsApp settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="settings-whatsapp-card">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">WhatsApp Messaging & Reminders</h2>
              <p className="text-xs text-slate-500">Configure business WhatsApp identity, 1-tap reminders, and Meta Cloud API</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Direct 1-Tap Intent Active
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {saveStatus === 'success' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>WhatsApp settings updated successfully.</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage || 'Failed to save settings.'}</span>
          </div>
        )}

        {/* Messaging Mode Banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Messaging Pipeline Status
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              Browser Web & App Integration
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            WhatsBill is configured by default for <strong>1-Tap WhatsApp Direct Invoicing</strong>. Invoices and reminders are dispatched directly via your WhatsApp Web or mobile client with prepopulated invoice summaries and dynamic UPI QR links.
          </p>
        </div>

        {/* Business Phone Number */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Sender Identification</h3>
          <div className="max-w-md">
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="wa-phone-input">
              Registered WhatsApp Business Number
            </label>
            <input
              id="wa-phone-input"
              type="tel"
              disabled={!canEdit}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Customers will see this phone number as your billing sender identity.
            </p>
          </div>
        </div>

        {/* Meta Cloud API (Optional Enterprise Webhook) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Meta WhatsApp Cloud API (Optional Background Automation)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                For automated 9:00 AM server-side reminders without manual clicks.
              </p>
            </div>
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              <span>Meta Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="wa-phone-id">
                Phone Number ID
              </label>
              <input
                id="wa-phone-id"
                type="text"
                disabled={!canEdit}
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="e.g. 104829381920392"
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="wa-waba-id">
                WhatsApp Business Account ID (WABA ID)
              </label>
              <input
                id="wa-waba-id"
                type="text"
                disabled={!canEdit}
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="e.g. 293849102938401"
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
              />
            </div>

            <div className="min-w-0 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="wa-token">
                System User Permanent Access Token
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="wa-token"
                  type="password"
                  disabled={!canEdit}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAG..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 transition"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Cloud API Webhook Status:</span>
            <span className="font-semibold text-slate-600">
              {hasConfiguredApi ? 'Credentials Provided' : 'Not configured (Using 1-Tap Links)'}
            </span>
          </div>
        </div>

        {canEdit && (
          <div className="pt-6 pb-2 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 transition disabled:opacity-50 cursor-pointer"
              id="save-whatsapp-settings-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving WhatsApp Details...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save WhatsApp Settings</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
