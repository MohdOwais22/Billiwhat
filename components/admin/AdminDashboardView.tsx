'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
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
  Send,
  ChevronRight,
  Eye,
  Sliders,
  FileText,
  TrendingUp,
  Radio,
  Briefcase,
  Target,
} from 'lucide-react';
import { APP_NAME } from '@/config/brand';
import { performSignOut } from '@/lib/auth/signout';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { OrganizationDetailModal } from '@/components/admin/OrganizationDetailModal';
import { AgentControlRoomView } from '@/components/admin/AgentControlRoomView';
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

  // Modals & View State
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'command-center' | 'control-room' | 'overview' | 'organizations' | 'invoices' | 'whatsapp' | 'audit' | 'diagnostics'
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
    { label: "Daily CEO Brief", query: "Generate the Daily CEO Brief: business, product, finance, WhatsApp, growth, experiments, engineering, risks, and top 5 actions." },
    { label: "What's happening today?", query: "What is happening across WhatsBill today? Give me an executive overview." },
    { label: 'Any critical alerts?', query: 'Are there any critical issues, delivery failures, or abnormal activity requiring attention?' },
    { label: 'Organization health', query: 'Analyze all organizations on WhatsBill and show their activity, onboarding progress, and health.' },
    { label: 'Financial breakdown', query: 'Give me a breakdown of invoices generated, payments recorded, and outstanding balances.' },
    { label: 'WhatsApp delivery status', query: 'What is the current health and delivery success rate of our WhatsApp Cloud integrations?' },
    { label: 'Security check', query: 'Run a security check for suspicious accounts, rate-limiting, or anomalous patterns.' },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Admin Header */}
      <header className="border-b border-slate-800/80 bg-[#0B101D]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Context */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white tracking-tight text-sm sm:text-base">
                  {APP_NAME} Admin Console
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Master Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Platform management, organization telemetry, and operations
              </p>
            </div>
          </div>

          {/* Quick Nav Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-medium transition cursor-pointer"
              id="admin-back-to-dashboard-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>User App</span>
            </Link>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition cursor-pointer disabled:opacity-50"
              id="admin-signout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3.5 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800/80 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('command-center')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'command-center'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('control-room')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'control-room'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Agent Control Room</span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('organizations')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'organizations'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Organizations</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700/60 text-slate-300">
                {displayOrgs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'invoices'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoices & Billing</span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'whatsapp'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Log</span>
            </button>

            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === 'diagnostics'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Diagnostics</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadAdminData();
                loadOrganizationsList();
                loadCommandCenterState();
                if (activeTab === 'audit') loadAuditLogs();
              }}
              disabled={isLoading || isLoadingOrgs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/90 text-slate-300 border border-slate-800 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingOrgs ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Notifications & Feedback */}
        {actionNotice && (
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-medium ${
              actionNotice.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border border-rose-800/60 text-rose-200'
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
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Admin Authorization Alert</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* TAB: AGENT CONTROL ROOM */}
        {activeTab === 'control-room' && (
          <AgentControlRoomView
            organizations={displayOrgs}
            onNavigateToAiQuery={(query) => {
              setActiveTab('command-center');
              handleAskAi(query);
            }}
          />
        )}

        {/* TAB 1: AI COMMAND CENTER */}
        {activeTab === 'command-center' && (
          <div className="space-y-6">
            {/* AI Assistant Query Box */}
            <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/90 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                    Admin Assistant
                  </h2>
                  <p className="text-xs text-slate-400">
                    Query platform health, review organization onboarding, inspect invoices, or investigate delivery anomalies.
                  </p>
                </div>
              </div>

              {/* Command Query Bar */}
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
                  placeholder="Ask anything about WhatsBill... (e.g. 'What is happening today?', 'Check organization health', 'Are messages failing?')"
                  disabled={isAiThinking}
                  className="w-full pl-4 pr-28 py-3 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!aiQuery.trim() || isAiThinking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {isAiThinking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask</span>
                    </>
                  )}
                </button>
              </form>

              {/* Suggested Questions */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-medium text-slate-400">
                  Suggested inquiries:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAskAi(p.query)}
                      disabled={isAiThinking}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition cursor-pointer disabled:opacity-50 text-left"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Proactive Insights Section */}
            {proactiveAlerts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>System Health & Insights</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Live monitors</span>
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
                            ? 'bg-rose-950/20 border-rose-800/40'
                            : isNorm
                            ? 'bg-[#0D1322] border-slate-800/80'
                            : 'bg-amber-950/20 border-amber-800/40'
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
                              <h4 className="text-xs font-semibold text-white tracking-tight">
                                {alert.title}
                              </h4>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                                isCrit
                                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                  : isNorm
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {alert.message}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                          <ul className="text-[11px] text-slate-400 space-y-0.5">
                            {alert.evidence.slice(0, 2).map((ev, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-slate-500" />
                                <span>{ev}</span>
                              </li>
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
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium shrink-0 ml-2 transition"
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

            {/* AI Response Card */}
            {aiResponse && (
              <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800/90 shadow-sm space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-xs text-slate-400">Analysis for:</span>
                    <span className="text-xs font-semibold text-white italic">"{aiResponse.query}"</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                      aiResponse.severity === 'critical' || aiResponse.severity === 'high'
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        : aiResponse.severity === 'medium'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    Severity: {aiResponse.severity}
                  </span>
                </div>

                {/* Structured Output Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      Summary
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-white leading-relaxed">
                      {aiResponse.whatIsHappening}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      Root Cause
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {aiResponse.why}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-400" />
                      Affected Scope
                    </span>
                    <p className="text-xs text-slate-200">
                      {aiResponse.affected}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Recommended Action
                    </span>
                    <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                      {aiResponse.recommendedAction}
                    </p>
                  </div>
                </div>

                {/* Evidence Section */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                  <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                    Key Telemetry & Evidence:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {aiResponse.evidence.map((ev, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PHASE 7: DAILY CEO BRIEF STRUCTURED EXECUTIVE INTELLIGENCE */}
                {aiResponse.ceoBrief && (
                  <div className="p-5 rounded-xl bg-[#090E1C] border border-indigo-900/50 shadow-lg space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-indigo-950 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            <span>WhatsBill Daily CEO Brief</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Deterministic
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Period: {aiResponse.ceoBrief.period} &bull; Generated: {new Date(aiResponse.ceoBrief.generatedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Data Quality:</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {aiResponse.ceoBrief.dataQuality.verifiedMetricsCount} Verified Metrics
                        </span>
                      </div>
                    </div>

                    {/* Executive Summary Cards */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-900/40 space-y-3">
                      <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        Executive Summary
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed">
                        {aiResponse.ceoBrief.executiveSummary.businessStatus}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 text-xs border-t border-slate-900">
                        <div className="p-2.5 rounded-lg bg-[#0B1020] border border-slate-800">
                          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">Positive Signal</span>
                          <span className="text-slate-200 text-[11px]">{aiResponse.ceoBrief.executiveSummary.biggestPositiveSignal}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0B1020] border border-slate-800">
                          <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block">Primary Risk</span>
                          <span className="text-slate-200 text-[11px]">{aiResponse.ceoBrief.executiveSummary.biggestRisk}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0B1020] border border-slate-800">
                          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">Key Opportunity</span>
                          <span className="text-slate-200 text-[11px]">{aiResponse.ceoBrief.executiveSummary.biggestOpportunity}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0B1020] border border-slate-800">
                          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">Top Action</span>
                          <span className="text-slate-200 text-[11px]">{aiResponse.ceoBrief.executiveSummary.mostImportantAction}</span>
                        </div>
                      </div>
                    </div>

                    {/* 8 Business Pillars Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      {/* 1. Business */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                            Business & Revenue
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {aiResponse.ceoBrief.business.realizationRate.value}% Realization
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Billed:</span>
                            <span className="font-medium text-white">₹{aiResponse.ceoBrief.business.totalBilled.value.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Collected:</span>
                            <span className="font-medium text-emerald-300">₹{aiResponse.ceoBrief.business.totalCollected.value.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Outstanding:</span>
                            <span className="font-medium text-amber-300">₹{aiResponse.ceoBrief.business.outstanding.value.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Organizations:</span>
                            <span>{aiResponse.ceoBrief.business.activeOrganizations.value} active / {aiResponse.ceoBrief.business.totalOrganizations.value} total</span>
                          </div>
                        </div>
                        <div className="pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                          Source: {aiResponse.ceoBrief.business.totalBilled.source}
                        </div>
                      </div>

                      {/* 2. Product */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-blue-400" />
                            Product Adoption
                          </span>
                          <span className="text-[10px] text-blue-400 font-mono">
                            {aiResponse.ceoBrief.product.invoiceCreationAdoption.value}% Adoption
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">WhatsApp PDF Rate:</span>
                            <span className="font-medium text-white">{aiResponse.ceoBrief.product.whatsappPdfUsageRate.value}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Ledger Tracking:</span>
                            <span className="font-medium text-white">{aiResponse.ceoBrief.product.customerLedgerUsageRate.value}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Receivables Views:</span>
                            <span className="font-medium text-white">{aiResponse.ceoBrief.product.receivablesUsageRate.value}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Onboarding Finish:</span>
                            <span className="font-medium text-white">{aiResponse.ceoBrief.product.onboardingCompletionRate.value}%</span>
                          </div>
                        </div>
                        <div className="pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                          Source: {aiResponse.ceoBrief.product.invoiceCreationAdoption.source}
                        </div>
                      </div>

                      {/* 3. Finance & Aging */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                            Finance & Aging
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono">
                            Overdue: ₹{aiResponse.ceoBrief.finance.overdue.value.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">&lt;30 Days:</span>
                            <span>₹{aiResponse.ceoBrief.finance.agingBuckets.lessThan30d.value.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">31-60 Days:</span>
                            <span>₹{aiResponse.ceoBrief.finance.agingBuckets.thirtyOneToSixtyDays.value.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">61-90 Days:</span>
                            <span>₹{aiResponse.ceoBrief.finance.agingBuckets.sixtyOneToNinetyDays.value.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">&gt;90 Days:</span>
                            <span className="text-rose-400 font-medium">₹{aiResponse.ceoBrief.finance.agingBuckets.greaterThan90d.value.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div className="pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                          Concentration: {aiResponse.ceoBrief.finance.concentrationRisk.value}
                        </div>
                      </div>

                      {/* 4. WhatsApp Operations */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            WhatsApp Health
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {aiResponse.ceoBrief.whatsapp.deliveryRate.value}% Delivery
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Delivered Messages:</span>
                            <span className="font-medium text-emerald-300">{aiResponse.ceoBrief.whatsapp.delivered.value}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Failed / Bounced:</span>
                            <span className="text-rose-400 font-medium">{aiResponse.ceoBrief.whatsapp.failed.value}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Idempotency:</span>
                            <span className="text-slate-200">Active</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Health Status:</span>
                            <span className="text-emerald-400 uppercase font-semibold text-[10px]">{aiResponse.ceoBrief.whatsapp.operationalHealth}</span>
                          </div>
                        </div>
                        <div className="pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                          Latency: {aiResponse.ceoBrief.whatsapp.latencyObserved.value}
                        </div>
                      </div>

                      {/* 5. Growth & Channels */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-purple-400" />
                            Growth & Channels
                          </span>
                          <span className="text-[10px] text-purple-400 font-mono">
                            Funnel: {aiResponse.ceoBrief.growth.conversionLandingToSignup.value}%
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-300">
                          <p className="text-[11px] text-slate-300 line-clamp-2">
                            {aiResponse.ceoBrief.growth.googleSeoStatus}
                          </p>
                          <div className="flex justify-between pt-1 border-t border-slate-900">
                            <span className="text-slate-400">Signup to Invoice:</span>
                            <span className="text-purple-300 font-medium">{aiResponse.ceoBrief.growth.conversionSignupToFirstInvoice.value}%</span>
                          </div>
                        </div>
                        <div className="pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                          Zero fake metrics: Paid ad CAC/ROAS unmeasured
                        </div>
                      </div>

                      {/* 6. Experiments */}
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                            Live Experiments
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {aiResponse.ceoBrief.experiments.running.length} Active
                          </span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          {aiResponse.ceoBrief.experiments.running.slice(0, 2).map((exp, idx) => (
                            <div key={idx} className="p-1.5 rounded bg-[#0A0F1D] border border-slate-900 space-y-0.5">
                              <span className="font-medium text-slate-200 block">{exp.title}</span>
                              <span className="text-[10px] text-slate-400 block">{exp.primaryMetric}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                          Statistical integrity: No fabricated p-values
                        </div>
                      </div>
                    </div>

                    {/* Top 5 Recommended Actions */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-950 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-indigo-400" />
                          Top 5 Recommended Actions (Prioritized)
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Human Approval Enforced
                        </span>
                      </div>

                      <div className="space-y-2">
                        {aiResponse.ceoBrief.topActions.map((action, idx) => (
                          <div
                            key={action.id || idx}
                            className="p-3 rounded-lg bg-[#0D1426] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  action.priority === 'P0' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                  action.priority === 'P1' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {action.priority} &bull; Score {action.score}
                                </span>
                                <h4 className="text-xs font-semibold text-white">{action.title}</h4>
                                {action.requiresApproval && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Requires Human Approval
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-300 leading-snug">{action.rationale}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                <span>Impact: {action.expectedImpact}</span>
                                <span>Effort: {action.effort}</span>
                                <span>Evidence: {action.evidence}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Unknowns & Data Quality Footer */}
                    <div className="p-3.5 rounded-lg bg-[#0B0F1C] border border-slate-800 text-[11px] space-y-2 text-slate-400">
                      <span className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider block">
                        Telemetry Boundaries & Data Quality Notice
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                        {aiResponse.ceoBrief.unknowns.slice(0, 3).map((u, i) => (
                          <li key={i}>{u}</li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-900">
                        {aiResponse.ceoBrief.finance.prohibitedMetricsNotice}
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Management Team Intelligence: Specialists & Reality Checker */}
                {(aiResponse.specialistContributions || aiResponse.realityCheck) && (
                  <div className="p-4 rounded-xl bg-[#090D1A] border border-slate-800/70 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Contributing Specialists
                        </span>
                        {aiResponse.specialistContributions && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {aiResponse.specialistContributions.map((spec) => (
                              <span
                                key={spec.agentId}
                                className="px-2 py-0.5 rounded-md bg-slate-800/90 text-indigo-300 border border-slate-700/60 text-[10px] font-medium"
                              >
                                {spec.agentName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {aiResponse.realityCheck && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Reality Check:</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                              aiResponse.realityCheck.confidenceScore === 'high'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : aiResponse.realityCheck.confidenceScore === 'moderate'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {aiResponse.realityCheck.confidenceScore.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Specialist Structured Findings */}
                    {aiResponse.specialistContributions && aiResponse.specialistContributions.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {aiResponse.specialistContributions.map((spec) => (
                          <div
                            key={spec.agentId}
                            className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/70 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-indigo-300">
                                {spec.agentName}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase">
                                {spec.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-snug">
                              {spec.findingSummary}
                            </p>
                            {spec.structure && (
                              <div className="pt-1.5 border-t border-slate-800/60 space-y-1 text-[11px]">
                                {Object.entries(spec.structure).map(([key, val]) => (
                                  <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1">
                                    <span className="text-slate-400 font-mono text-[10px] shrink-0 uppercase">
                                      {key.replace(/_/g, ' ')}:
                                    </span>
                                    <span className="text-slate-200">{val}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Verified External Market Intelligence */}
                    {aiResponse.marketIntelligence && aiResponse.marketIntelligence.length > 0 && (
                      <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-800/40 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                            Verified External Market Intelligence (Trend Researcher)
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {aiResponse.marketIntelligence.map((item, idx) => (
                            <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800/50 space-y-0.5">
                              <div className="flex items-center justify-between text-[10px] text-blue-400 font-mono">
                                <span>{item.source}</span>
                                <span>{item.date}</span>
                              </div>
                              <p className="text-slate-200 text-[11px]">{item.claim}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-blue-400/80 italic">
                          Notice: External regulatory mandates and market benchmarks are strictly separated from internal WhatsBill database telemetry.
                        </p>
                      </div>
                    )}

                    {/* Unmeasured Telemetry Boundaries */}
                    {aiResponse.unknownOrMissingData && aiResponse.unknownOrMissingData.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 space-y-1.5">
                        <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Telemetry Boundaries & Unmeasured Metrics
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90">
                          {aiResponse.unknownOrMissingData.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiResponse.realityCheck && (
                      <p className="text-xs text-slate-400 italic">
                        {aiResponse.realityCheck.verdict} &mdash; {aiResponse.realityCheck.sampleSizeAssessment.notes}
                      </p>
                    )}

                    {aiResponse.trace && (
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Tools Executed: {aiResponse.trace.toolsExecuted.join(', ')}</span>
                        <span>Time: {aiResponse.trace.totalTimeMs}ms {aiResponse.trace.fallbackUsed ? '(Deterministic Engine)' : '(Gemini Grounded)'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Action Button */}
                {aiResponse.quickAction && (
                  <div className="flex justify-end pt-1">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer shadow-xs"
                    >
                      <span>{aiResponse.quickAction.label}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total Businesses
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-white">
                    {isLoading ? '...' : displayOrgs.length}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {snapshot?.metrics.activeOrganizations || 0} active with transactions
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Platform Invoices
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-white">
                    {isLoading ? '...' : snapshot?.metrics.totalInvoices ?? data?.metrics.totalInvoices ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {formatCurrency(snapshot?.metrics.totalInvoiceAmount ?? data?.metrics.totalInvoiceVolume ?? 0)} gross billed
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Collections Reconciled
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(snapshot?.metrics.totalPaymentAmount ?? data?.metrics.totalCollectedVolume ?? 0)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {snapshot?.metrics.totalPayments ?? 0} recorded payments
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    WhatsApp Delivery
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-white">
                    {snapshot?.metrics.messageSuccessRate ?? 100}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {snapshot?.metrics.totalMessages ?? 0} total messages
                  </p>
                </div>
              </div>
            </div>

            {/* Organizations Preview */}
            <div className="rounded-2xl bg-[#0D1322] border border-slate-800/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    Registered Organizations
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click "Inspect" on any organization to view customer ledgers, invoices, and diagnostics.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('organizations')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  View All ({displayOrgs.length}) &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Organization</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">GSTIN</th>
                      <th className="py-2.5 px-3">Created</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayOrgs.slice(0, 5).map((org) => (
                      <tr key={org.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-white">{org.name}</p>
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium transition cursor-pointer"
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
                  placeholder="Search by name, phone, email, GSTIN, or ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#0D1322] border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                {isLoadingOrgs && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                <span>Showing {filteredOrgs.length} of {displayOrgs.length} organizations</span>
              </span>
            </div>

            <div className="rounded-2xl bg-[#0D1322] border border-slate-800/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Business Name</th>
                      <th className="py-3 px-4">Contact</th>
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
                        <tr key={org.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-white">{org.name}</p>
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[11px] font-medium transition cursor-pointer"
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
              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Total Gross Billed
                </span>
                <p className="text-2xl font-bold text-white mt-2">
                  {formatCurrency(snapshot?.metrics.totalInvoiceAmount || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Across {snapshot?.metrics.totalInvoices || 0} invoices
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Total Collections Reconciled
                </span>
                <p className="text-2xl font-bold text-emerald-400 mt-2">
                  {formatCurrency(snapshot?.metrics.totalPaymentAmount || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Across {snapshot?.metrics.totalPayments || 0} payments
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Outstanding Receivables
                </span>
                <p className="text-2xl font-bold text-amber-400 mt-2">
                  {formatCurrency(snapshot?.metrics.outstandingReceivables || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Pending customer balance
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-400" />
                Invoice Status Distribution
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {Object.entries(snapshot?.invoicesByStatus || { issued: 0, paid: 0, draft: 0, overdue: 0 }).map(([status, count]) => (
                  <div key={status} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
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
              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Total Messages Processed
                </span>
                <p className="text-2xl font-bold text-white mt-2">
                  {snapshot?.metrics.totalMessages || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Customer inquiries & billing dispatches
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Successful Deliveries
                </span>
                <p className="text-2xl font-bold text-emerald-400 mt-2">
                  {snapshot?.metrics.successfulMessages || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Success rate: {snapshot?.metrics.messageSuccessRate || 100}%
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Failed Deliveries
                </span>
                <p className="text-2xl font-bold text-rose-400 mt-2">
                  {snapshot?.metrics.failedMessages || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Provider or delivery rejections
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 space-y-3 text-xs text-slate-300">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Integration Telemetry
              </h3>
              <p className="leading-relaxed">
                WhatsBill interfaces with Meta WhatsApp Cloud API webhooks. Messages are correlated with merchant organizations through registered <code className="text-indigo-300 font-mono">meta_phone_number_id</code> and verified customer phone records.
              </p>
            </div>
          </div>
        )}

        {/* TAB 6: SECURITY AUDIT */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  System Audit Trail
                </h3>
                <p className="text-xs text-slate-400">
                  Record of administrative inquiries, diagnostic operations, and entity modifications.
                </p>
              </div>

              <button
                onClick={loadAuditLogs}
                disabled={isLoadingAudit}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="rounded-2xl bg-[#0D1322] border border-slate-800/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity Type</th>
                      <th className="py-3 px-4">Entity ID</th>
                      <th className="py-3 px-4">Details</th>
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
                        <tr key={log.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-mono font-medium text-indigo-300">
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
            <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Security & Infrastructure Configuration
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <span>Master Phone Verification</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    SERVER CONFIGURED
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span>Supabase Client</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    CONNECTED
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Supabase Service Role</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      data?.systemDiagnostics.serviceRoleActive
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}
                  >
                    {data?.systemDiagnostics.serviceRoleActive ? 'ACTIVE' : 'ANON FALLBACK'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>AI Reasoning Engine</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      data?.systemDiagnostics.geminiConfigured
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {data?.systemDiagnostics.geminiConfigured ? 'READY' : 'LOCAL RULES FALLBACK'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Access Control & Safeguards
              </h3>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  <strong>Server Verification:</strong> Master access is enforced exclusively on the server by verifying the authenticated phone session against the master environment secret.
                </p>
                <p>
                  <strong>Zero Credential Exposure:</strong> Sensitive administrative configuration keys are kept strictly server-side and never exposed to the client bundle.
                </p>
                <p>
                  <strong>Accurate Metrics:</strong> Financial totals, balances, and operational counts are derived directly from the database prior to analysis.
                </p>
                <p>
                  <strong>Permanent Auditability:</strong> High-impact operations and administrative queries are permanently recorded in the system audit log.
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
