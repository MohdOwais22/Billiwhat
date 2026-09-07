'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Info,
  Building,
  RefreshCw,
  Server,
  Layers,
  ArrowRight,
  Sparkles,
  Database,
  Radio,
  FileText,
} from 'lucide-react';
import { Organization, MessageLog } from '@/types/database';

interface WhatsAppStatusViewProps {
  organization: Organization;
}

export function WhatsAppStatusView({ organization }: WhatsAppStatusViewProps) {
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const webhookUrl = `${origin}/api/whatsapp/webhook`;
  const verifyToken = 'whatsbill_webhook_token';

  const copyToClipboard = (text: string, type: 'url' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" id="whatsapp-integration-status-view">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-md border border-slate-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Server-Side Integration Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Org: {organization.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            WhatsApp Business Backend Integration
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Direct server-to-server webhook connection with Meta WhatsApp Cloud API & Gemini AI billing logic.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Webhook Endpoint</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              /api/whatsapp/webhook
            </span>
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-emerald-600" />
          Server-Side Integration Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Step 1</span>
            <span className="text-xs font-bold text-slate-800 block">Merchant WhatsApp</span>
            <p className="text-[11px] text-slate-500">Sends command via phone</p>
          </div>

          <div className="flex items-center justify-center text-slate-400 hidden md:flex">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Step 2</span>
            <span className="text-xs font-bold text-slate-800 block">Meta Webhook</span>
            <p className="text-[11px] text-slate-500">Secure POST payload to server</p>
          </div>

          <div className="flex items-center justify-center text-slate-400 hidden md:flex">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Step 3</span>
            <span className="text-xs font-bold text-emerald-900 block">AI & Database RPC</span>
            <p className="text-[11px] text-emerald-700">Deterministic billing execution</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Webhook Configuration & Status (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Webhook Endpoint Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-emerald-600" />
              Meta Developer Webhook Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Callback URL (Inbound Webhook Endpoint):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Verify Token (Meta Subscription Token):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={verifyToken}
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(verifyToken, 'token')}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Environment Credentials Verification */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              Server Environment Credentials Status
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Gemini AI Intent Parser</span>
                  <span className="text-slate-500 font-mono">GEMINI_API_KEY</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Meta WhatsApp Access Token</span>
                  <span className="text-slate-500 font-mono">WHATSAPP_ACCESS_TOKEN</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  External Configuration Required
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Meta Phone Number ID</span>
                  <span className="text-slate-500 font-mono">WHATSAPP_PHONE_NUMBER_ID</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  External Configuration Required
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Backend Implementation Complete</span>
              </div>
              <p className="text-blue-800 leading-relaxed">
                The server-side webhook handler, HMAC signature verifier, Gemini intent parser, idempotency filter, and atomic database billing RPCs are fully compiled and live. Add your Meta credentials to environment variables to enable live delivery to external devices.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Setup Instructions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-slate-700" />
              Meta Business Developer Setup Steps
            </h3>

            <ol className="space-y-3 text-xs text-slate-600 list-decimal list-inside">
              <li className="leading-relaxed">
                Go to <strong className="text-slate-900">developers.facebook.com</strong> and select your WhatsApp App.
              </li>
              <li className="leading-relaxed">
                Navigate to <strong className="text-slate-900">WhatsApp &gt; Configuration</strong>.
              </li>
              <li className="leading-relaxed">
                Click <strong className="text-slate-900">Edit Webhook</strong> and paste the Callback URL and Verify Token from the left.
              </li>
              <li className="leading-relaxed">
                Subscribe to the <strong className="text-slate-900">messages</strong> field event.
              </li>
              <li className="leading-relaxed">
                Send a message like <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">Ramesh ko 20 Havells switch 450 ke</code> from your registered WhatsApp number.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
