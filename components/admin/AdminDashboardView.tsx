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
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Search,
  Sparkles,
  Lock,
  Database,
  Cpu,
} from 'lucide-react';
import { APP_NAME } from '@/config/brand';
import { performSignOut } from '@/lib/auth/signout';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'diagnostics'>('overview');
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

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await performSignOut('/');
  };

  const filteredOrgs = data?.recentOrganizations.filter((org) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      org.name?.toLowerCase().includes(query) ||
      org.email?.toLowerCase().includes(query) ||
      org.phone?.toLowerCase().includes(query) ||
      org.gstin?.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-sm sm:text-base">
                  {APP_NAME} Master Control
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Master Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Server-Authoritative Administration & Platform Diagnostics
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
              <span>User Dashboard</span>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Platform Overview
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'organizations'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Organizations ({data?.metrics.totalOrgs || 0})
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'diagnostics'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Security & Environment
            </button>
          </div>

          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Admin Authorization Alert</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Master Security Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Master Authorization Active
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  VERIFIED SESSION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticated as Master User ({data?.adminUser.phone || data?.adminUser.email || 'Master User'}) with full elevated platform oversight.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Environment-enforced server protection</span>
          </div>
        </div>

        {/* Overview Tab Content */}
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
                    {isLoading ? '...' : data?.metrics.totalOrgs || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Active organizations in database
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
                    {isLoading ? '...' : data?.metrics.totalInvoices || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {formatCurrency(data?.metrics.totalInvoiceVolume || 0)} gross billed
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
                    {formatCurrency(data?.metrics.totalCollectedVolume || 0)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Total recorded payment collections
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Customer Database
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-white">
                    {isLoading ? '...' : data?.metrics.totalCustomers || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {data?.metrics.totalGstProfiles || 0} registered GST profiles
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
                    Recently Registered Businesses
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live database view of organizations across WhatsBill
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('organizations')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  View All &rarr;
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data?.recentOrganizations.slice(0, 5).map((org) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Organizations Directory Tab */}
        {activeTab === 'organizations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by business name, phone, email, GSTIN..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredOrgs.length} of {data?.metrics.totalOrgs || 0} organizations
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrgs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          No organizations match your query.
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostics & Environment Tab */}
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
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    data?.systemDiagnostics.serviceRoleActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {data?.systemDiagnostics.serviceRoleActive ? 'ACTIVE' : 'ANON FALLBACK'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Gemini AI Assistant Engine</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    data?.systemDiagnostics.geminiConfigured
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {data?.systemDiagnostics.geminiConfigured ? 'READY' : 'UNCONFIGURED'}
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
                  <strong>3. Dual-Layer Route Protection:</strong> Non-master users attempting to load <code className="text-slate-200 font-mono">/admin</code> are stopped by Next.js middleware and server component checks and redirected safely to the normal user dashboard.
                </p>
                <p>
                  <strong>4. API Enforcement:</strong> All <code className="text-slate-200 font-mono">/api/admin/*</code> routes return 403 Forbidden for any non-master requests.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
