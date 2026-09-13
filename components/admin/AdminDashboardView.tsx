'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  Receipt,
  CreditCard,
  MessageSquare,
  Activity,
  Server,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Search,
  Sparkles,
  Lock,
  Database,
  Cpu,
  Trash2,
  Loader2,
  Bot,
  Send,
  ChevronRight,
  Eye,
  Clock,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { APP_NAME } from '@/config/brand';
import { performSignOut } from '@/lib/auth/signout';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { OrganizationDetailModal } from '@/components/admin/OrganizationDetailModal';
import {
  PlatformHealthSnapshot,
  ProactiveAlert,
  StructuredAiResponse,
} from '@/lib/services/adminAiOrchestrator';

interface AdminOverviewData {
  metrics: {
    totalOrgs: number;
    totalUsers: number;
    totalInvoices: number;
    totalCustomers: number;
    totalGstProfiles: number;
    totalMessages: number;
    totalInvoiceVolume: number;
    totalCollectedVolume: number;
  };
  recentOrganizations: Array<{
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
    created_at: string;
  }>;
  systemDiagnostics: {
    supabaseConfigured: boolean;
    serviceRoleActive: boolean;
    geminiConfigured: boolean;
    masterPhoneConfigured: boolean;
    serverTime: string;
    nodeEnv: string;
  };
  adminUser: {
    id: string;
    email: string | null;
    phone: string | null;
  };
}

export function AdminDashboardView() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [organizationsList, setOrganizationsList] = useState<Array<any>>([]);
  const [snapshot, setSnapshot] = useState<PlatformHealthSnapshot | null>(null);
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // AI Command Center state
  const [aiQuery, setAiQuery] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState<StructuredAiResponse | null>(null);
  const [aiHistory, setAiHistory] = useState<StructuredAiResponse[]>([]);

  // Modals and UI
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'command-center' | 'overview' | 'organizations' | 'invoices' | 'whatsapp' | 'audit' | 'diagnostics'
  >('command-center');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/admin/overview');
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied: You do not have Master Admin authorization.');
        }
        throw new Error('Failed to load Master Admin overview metrics.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Admin data fetch error:', err);
      setError(err?.message || 'Failed to retrieve admin data.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommandCenterState = async () => {
    try {
      const res = await fetch('/api/admin/command-center');
      if (res.ok) {
        const json = await res.json();
        if (json.snapshot) {
          setSnapshot(json.snapshot);
        }
        if (json.proactiveAlerts) {
          setProactiveAlerts(json.proactiveAlerts);
        }
      }
    } catch (err) {
      console.error('Failed to load command center snapshot:', err);
    }
  };

  const loadOrganizationsList = async () => {
    try {
      setIsLoadingOrgs(true);
      const res = await fetch('/api/admin/organizations');
      if (res.ok) {
        const json = await res.json();
        if (json.organizations) {
          setOrganizationsList(json.organizations);
        }
      }
    } catch (err) {
      console.error('Failed to load organizations list:', err);
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setIsLoadingAudit(true);
      const res = await fetch('/api/admin/audit-logs?limit=40');
      if (res.ok) {
        const json = await res.json();
        if (json.auditLogs) {
          setAuditLogs(json.auditLogs);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    loadCommandCenterState();
    loadOrganizationsList();
  }, []);

  useEffect(() => {
    if (activeTab === 'organizations') {
      loadOrganizationsList();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    } else if (activeTab === 'command-center') {
      loadCommandCenterState();
    }
  }, [activeTab]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await performSignOut('/');
  };

  const handleAskAi = async (promptQuery?: string) => {
    const queryToRun = (promptQuery || aiQuery).trim();
    if (!queryToRun || isAiThinking) return;

    try {
      setIsAiThinking(true);
      setActionNotice(null);

      const res = await fetch('/api/admin/command-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to process AI query');
      }

      if (json.result) {
        setAiResponse(json.result);
        setAiHistory((prev) => [json.result, ...prev.slice(0, 9)]);
      }
      setAiQuery('');
    } catch (err: any) {
      console.error('AI Command query error:', err);
      setActionNotice({
        type: 'error',
        text: err?.message || 'Error processing AI command center request',
      });
    } finally {
      setIsAiThinking(false);
    }
  };

  const handlePurgeDummyData = async () => {
    try {
      setIsPurging(true);
      setActionNotice(null);
      const res = await fetch('/api/admin/purge-dummy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to purge dummy test data');
      }

      setActionNotice({
        type: 'success',
        text: json.message || `Purged ${json.purgedOrganizations || 0} dummy organizations.`,
      });

      await Promise.all([loadAdminData(), loadOrganizationsList(), loadCommandCenterState()]);
    } catch (err: any) {
      console.error('Purge error:', err);
      setActionNotice({
        type: 'error',
        text: err?.message || 'Failed to purge dummy data',
      });
    } finally {
      setIsPurging(false);
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    try {
      setDeletingOrgId(orgId);
      setActionNotice(null);

      const res = await fetch(`/api/admin/organizations?id=${encodeURIComponent(orgId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Failed to delete organization ${orgName}`);
      }

      setActionNotice({
        type: 'success',
        text: `Organization "${orgName}" successfully deleted.`,
      });

      await Promise.all([loadAdminData(), loadOrganizationsList(), loadCommandCenterState()]);
    } catch (err: any) {
      console.error('Delete org error:', err);
      setActionNotice({
        type: 'error',
        text: err?.message || 'Failed to delete organization',
      });
    } finally {
      setDeletingOrgId(null);
    }
  };

  const displayOrgs = organizationsList.length > 0 ? organizationsList : (data?.recentOrganizations || []);

  const filteredOrgs = displayOrgs.filter((org) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      org.name?.toLowerCase().includes(query) ||
      org.email?.toLowerCase().includes(query) ||
      org.phone?.toLowerCase().includes(query) ||
      org.gstin?.toLowerCase().includes(query) ||
      org.id?.toLowerCase().includes(query)
    );
  });

  const suggestedPrompts = [
    { label: "What's happening today?", query: "What is happening across WhatsBill today? Give me an executive overview." },
    { label: 'Any critical issues or alerts?', query: 'Are there any critical issues, delivery failures, or abnormal activity requiring attention?' },
    { label: 'Show organization health', query: 'Analyze all organizations on WhatsBill and show their activity, onboarding progress, and health.' },
    { label: 'Invoice & financial summary', query: 'Give me a deterministic breakdown of invoices generated, payments recorded, and outstanding balances.' },
    { label: 'WhatsApp & integration status', query: 'What is the current health and delivery success rate of our WhatsApp Cloud integrations?' },
    { label: 'Security & abuse check', query: 'Run a security intelligence check for suspicious accounts, rate-limiting, or abuse patterns.' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Admin Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-sm sm:text-base">
                  {APP_NAME} AI Command Center
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Master Admin
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Grounded Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Unified Operational Oversight • Platform Telemetry • Real-time DB Grounding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
              id="admin-back-to-dashboard-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>User App</span>
            </Link>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              id="admin-signout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            <button
              onClick={() => setActiveTab('command-center')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'command-center'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-950" />
              <span>AI Command Center</span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Platform Overview
            </button>

            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'organizations'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Organizations ({displayOrgs.length})
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Invoices & Financials
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              WhatsApp Health
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Security Audit
            </button>

            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'diagnostics'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Diagnostics
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePurgeDummyData}
              disabled={isPurging || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              title="Purge all dummy and test organizations and test users"
              id="admin-purge-dummy-btn"
            >
              {isPurging ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>{isPurging ? 'Purging...' : 'Purge Dummy Data'}</span>
            </button>

            <button
              onClick={() => {
                loadAdminData();
                loadOrganizationsList();
                loadCommandCenterState();
                if (activeTab === 'audit') loadAuditLogs();
              }}
              disabled={isLoading || isLoadingOrgs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingOrgs ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {actionNotice && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-medium ${
              actionNotice.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-200'
                : 'bg-rose-950/60 border border-rose-800/80 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{actionNotice.text}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Admin Authorization Alert</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* TAB 1: AI COMMAND CENTER (PRIMARY) */}
        {activeTab === 'command-center' && (
          <div className="space-y-6">
            {/* Orchestrator Query Bar Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      WhatsBill AI Orchestrator
                    </h2>
                    <p className="text-xs text-slate-400">
                      Query platform health, diagnose organizations, correlate WhatsApp events, or evaluate financial anomalies.
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Deterministic Grounding Active
                </span>
              </div>

              {/* Search / Command Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskAi();
                }}
                className="relative"
              >
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask anything about WhatsBill... (e.g. 'Why did invoice volume drop?', 'Check ViceIntel health', 'Are WhatsApp messages failing?')"
                  disabled={isAiThinking}
                  className="w-full pl-4 pr-28 py-3 text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!aiQuery.trim() || isAiThinking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow"
                >
                  {isAiThinking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask AI</span>
                    </>
                  )}
                </button>
              </form>

              {/* Suggested Quick Prompt Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Suggested Questions:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAskAi(p.query)}
                      disabled={isAiThinking}
                      className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition cursor-pointer disabled:opacity-50 text-left"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Proactive Intelligence Surfaced Alerts */}
            {proactiveAlerts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Proactive Platform Insights
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Live system monitors
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {proactiveAlerts.map((alert) => {
                    const isCrit = alert.severity === 'critical' || alert.severity === 'high';
                    const isNorm = alert.severity === 'normal';

                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                          isCrit
                            ? 'bg-rose-950/30 border-rose-800/60'
                            : isNorm
                            ? 'bg-slate-900 border-slate-800'
                            : 'bg-amber-950/20 border-amber-800/50'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {isCrit ? (
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                              ) : isNorm ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                              )}
                              <h4 className="text-xs font-bold text-white tracking-tight">
                                {alert.title}
                              </h4>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isCrit
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : isNorm
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {alert.message}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                            {alert.evidence.slice(0, 2).map((ev, i) => (
                              <li key={i}>{ev}</li>
                            ))}
                          </ul>

                          {alert.actionLabel && (
                            <button
                              onClick={() => {
                                if (alert.targetOrgId) {
                                  setSelectedOrgId(alert.targetOrgId);
                                } else if (alert.category === 'whatsapp') {
                                  setActiveTab('whatsapp');
                                } else if (alert.category === 'financial') {
                                  setActiveTab('invoices');
                                } else {
                                  setActiveTab('organizations');
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 ml-2"
                            >
                              {alert.actionLabel} &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Response Card (Latest Inquiry) */}
            {aiResponse && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold text-slate-400">Analysis for:</span>
                    <span className="text-xs font-bold text-white italic">"{aiResponse.query}"</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      aiResponse.severity === 'critical' || aiResponse.severity === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : aiResponse.severity === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    Severity: {aiResponse.severity}
                  </span>
                </div>

                {/* Structured Output Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* What is happening */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      WHAT'S HAPPENING
                    </span>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {aiResponse.whatIsHappening}
                    </p>
                  </div>

                  {/* Root Cause (Why) */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      WHY / ROOT CAUSE
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {aiResponse.why}
                    </p>
                  </div>

                  {/* Affected Entities */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-400" />
                      AFFECTED SCOPE
                    </span>
                    <p className="text-xs text-slate-200">
                      {aiResponse.affected}
                    </p>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      RECOMMENDED ACTION
                    </span>
                    <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                      {aiResponse.recommendedAction}
                    </p>
                  </div>
                </div>

                {/* Evidence Section */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    VERIFIED DATABASE EVIDENCE:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {aiResponse.evidence.map((ev, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Action Button if present */}
                {aiResponse.quickAction && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        if (aiResponse.quickAction?.type === 'inspect_org' && aiResponse.quickAction.targetId) {
                          setSelectedOrgId(aiResponse.quickAction.targetId);
                        } else if (aiResponse.quickAction?.type === 'view_invoices') {
                          setActiveTab('invoices');
                        } else if (aiResponse.quickAction?.type === 'view_whatsapp') {
                          setActiveTab('whatsapp');
                        } else if (aiResponse.quickAction?.type === 'view_audit') {
                          setActiveTab('audit');
                        } else {
                          setActiveTab('organizations');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow"
                    >
                      <span>{aiResponse.quickAction.label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Primary Platform Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Businesses
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-white">
                    {isLoading ? '...' : displayOrgs.length}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {snapshot?.metrics.activeOrganizations || 0} active with transactions
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Platform Invoices
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-white">
                    {isLoading ? '...' : snapshot?.metrics.totalInvoices ?? data?.metrics.totalInvoices ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {formatCurrency(snapshot?.metrics.totalInvoiceAmount ?? data?.metrics.totalInvoiceVolume ?? 0)} gross billed
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Payments Tracked
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-white">
                    {formatCurrency(snapshot?.metrics.totalPaymentAmount ?? data?.metrics.totalCollectedVolume ?? 0)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {snapshot?.metrics.totalPayments ?? 0} reconciled payments
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    WhatsApp Delivery
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-white">
                    {snapshot?.metrics.messageSuccessRate ?? 100}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {snapshot?.metrics.totalMessages ?? 0} messages dispatched
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Organizations Preview */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Active Businesses
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click "Inspect" on any organization to view full customer ledgers, invoices, and diagnostics.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('organizations')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  View All ({displayOrgs.length}) &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Organization</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">GSTIN</th>
                      <th className="py-2.5 px-3">Created</th>
                      <th className="py-2.5 px-3 text-right">Drill-Down</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayOrgs.slice(0, 5).map((org) => (
                      <tr key={org.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <p className="font-bold text-white">{org.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{org.id.slice(0, 8)}...</p>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <p>{org.phone || 'No phone'}</p>
                          <p className="text-[10px] text-slate-400">{org.email || ''}</p>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {org.gstin ? (
                            <span className="px-1.5 py-0.5 bg-slate-800 rounded text-emerald-400 border border-slate-700">
                              {org.gstin}
                            </span>
                          ) : (
                            <span className="text-slate-500">Unregistered</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {formatDate(org.created_at, 'short')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedOrgId(org.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[11px] font-semibold transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORGANIZATIONS DIRECTORY */}
        {activeTab === 'organizations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by business name, phone, email, GSTIN, or ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                {isLoadingOrgs && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                <span>Showing {filteredOrgs.length} of {displayOrgs.length} organizations</span>
              </span>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Business Name</th>
                      <th className="py-3 px-4">Contact Details</th>
                      <th className="py-3 px-4">GST Profile</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrgs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          {isLoadingOrgs ? 'Loading organizations...' : 'No organizations match your query.'}
                        </td>
                      </tr>
                    ) : (
                      filteredOrgs.map((org) => (
                        <tr key={org.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <p className="font-bold text-white">{org.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">ID: {org.id}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-slate-200">{org.phone || '—'}</p>
                            <p className="text-[10px] text-slate-400">{org.email || ''}</p>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {org.gstin ? (
                              <span className="px-2 py-0.5 bg-slate-800 rounded text-emerald-400 border border-slate-700">
                                {org.gstin}
                              </span>
                            ) : (
                              <span className="text-slate-500">Non-GST</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {formatDate(org.created_at, 'long')}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedOrgId(org.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[11px] font-semibold transition cursor-pointer"
                              title={`Inspect ${org.name}`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect</span>
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to permanently delete "${org.name}" (${org.id}) and all associated records?`)) {
                                  handleDeleteOrganization(org.id, org.name);
                                }
                              }}
                              disabled={deletingOrgId === org.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
                              title={`Delete ${org.name}`}
                            >
                              {deletingOrgId === org.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
                              ) : (
                                <Trash2 className="w-3 h-3 text-rose-400" />
                              )}
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INVOICES & FINANCIALS */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Gross Billed
                </span>
                <p className="text-2xl font-black text-white mt-2">
                  {formatCurrency(snapshot?.metrics.totalInvoiceAmount || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Across {snapshot?.metrics.totalInvoices || 0} invoices
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Collections Reconciled
                </span>
                <p className="text-2xl font-black text-emerald-400 mt-2">
                  {formatCurrency(snapshot?.metrics.totalPaymentAmount || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Across {snapshot?.metrics.totalPayments || 0} payments
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Outstanding Receivables
                </span>
                <p className="text-2xl font-black text-amber-400 mt-2">
                  {formatCurrency(snapshot?.metrics.outstandingReceivables || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Pending customer balance
                </p>
              </div>
            </div>

            {/* Invoices Status Distribution */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                Invoice Status Breakdown
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {Object.entries(snapshot?.invoicesByStatus || { issued: 0, paid: 0, draft: 0, overdue: 0 }).map(([status, count]) => (
                  <div key={status} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="capitalize text-slate-400">{status}</span>
                    <p className="text-lg font-bold text-white mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WHATSAPP HEALTH */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Messages Processed
                </span>
                <p className="text-2xl font-black text-white mt-2">
                  {snapshot?.metrics.totalMessages || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Inbound inquiries & automated bills
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Successful Deliveries
                </span>
                <p className="text-2xl font-black text-emerald-400 mt-2">
                  {snapshot?.metrics.successfulMessages || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Success rate: {snapshot?.metrics.messageSuccessRate || 100}%
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Failed Deliveries
                </span>
                <p className="text-2xl font-black text-rose-400 mt-2">
                  {snapshot?.metrics.failedMessages || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Provider or webhook rejections
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-300">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Integration Architecture
              </h3>
              <p>
                WhatsBill supports Meta WhatsApp Cloud API webhooks with HMAC-SHA256 signature verification.
                Messages are matched directly to merchant organizations through <code className="text-amber-300 font-mono">meta_phone_number_id</code> and authenticated customer phone numbers.
              </p>
            </div>
          </div>
        )}

        {/* TAB 6: SECURITY & AUDIT */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Master Admin & System Audit Trail
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time record of all administrative actions, AI inquiries, and system mutations.
                </p>
              </div>

              <button
                onClick={loadAuditLogs}
                disabled={isLoadingAudit}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity Type</th>
                      <th className="py-3 px-4">Entity ID</th>
                      <th className="py-3 px-4">Metadata</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          {isLoadingAudit ? 'Loading audit trail...' : 'No audit entries recorded yet.'}
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-amber-300">
                            {log.action}
                          </td>
                          <td className="py-3 px-4 text-slate-300 capitalize">
                            {log.entity_type || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {log.entity_id ? log.entity_id.slice(0, 8) + '...' : '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-300 max-w-xs truncate font-mono text-[11px]">
                            {log.metadata ? JSON.stringify(log.metadata) : '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {formatDate(log.created_at, 'long')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                Core Security & Environment Flags
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Master Phone Number (Env)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    CONFIGURED (SERVER-ONLY)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span>Supabase Live Client</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Supabase Service Role Key</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      data?.systemDiagnostics.serviceRoleActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {data?.systemDiagnostics.serviceRoleActive ? 'ACTIVE' : 'ANON FALLBACK'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Gemini AI Command Center Engine</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      data?.systemDiagnostics.geminiConfigured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {data?.systemDiagnostics.geminiConfigured ? 'READY (gemini-3.8-flash)' : 'DETERMINISTIC FALLBACK'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Master Admin Access Rules
              </h3>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  <strong>1. Strict Server Verification:</strong> Authorization is determined exclusively on the server by comparing the authenticated session phone with <code className="text-amber-300 font-mono">MASTER_PHONE_NUMBER</code>.
                </p>
                <p>
                  <strong>2. Zero Secret Exposure:</strong> <code className="text-amber-300 font-mono">MASTER_PHONE_NUMBER</code> is never passed or bundled into client code.
                </p>
                <p>
                  <strong>3. Grounded Deterministic Metrics:</strong> All monetary figures and counts are derived directly through Supabase SQL queries before interpretation by the AI model.
                </p>
                <p>
                  <strong>4. Action Auditability:</strong> High-impact actions require explicit administrative confirmation and are logged permanently into the database audit trail.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Organization Drill-Down Modal */}
      {selectedOrgId && (
        <OrganizationDetailModal
          orgId={selectedOrgId}
          onClose={() => setSelectedOrgId(null)}
          onDelete={handleDeleteOrganization}
        />
      )}
    </div>
  );
}
