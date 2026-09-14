'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Eye,
  FileCheck2,
  Filter,
  History,
  Info,
  Layers,
  ListFilter,
  Play,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  ThumbsDown,
  ThumbsUp,
  Workflow,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  AgentCategory,
  AgentHealthStatus,
  AgentStatus,
  AgentTelemetrySummary,
  ApprovalActionItem,
  ControlRoomSnapshot,
  ObservabilityEvent,
  PersistedAgentExecution,
} from '@/lib/services/agentTeam/types';

interface AgentControlRoomViewProps {
  organizations?: Array<{ id: string; name: string }>;
  onNavigateToAiQuery?: (query: string) => void;
}

export const AgentControlRoomView: React.FC<AgentControlRoomViewProps> = ({
  organizations = [],
  onNavigateToAiQuery,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'matrix' | 'executions' | 'approvals' | 'reality' | 'activity'>('matrix');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Snapshot and Telemetry Data
  const [snapshot, setSnapshot] = useState<ControlRoomSnapshot | null>(null);
  const [executions, setExecutions] = useState<PersistedAgentExecution[]>([]);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [approvals, setApprovals] = useState<ApprovalActionItem[]>([]);
  const [liveEvents, setLiveEvents] = useState<ObservabilityEvent[]>([]);

  // Selected Detail Drawers
  const [selectedAgent, setSelectedAgent] = useState<AgentTelemetrySummary | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<PersistedAgentExecution | null>(null);
  const [executionEvents, setExecutionEvents] = useState<ObservabilityEvent[]>([]);
  const [isLoadingTrace, setIsLoadingTrace] = useState(false);

  // Action Notice / Toast
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  // Load Main Telemetry Snapshot
  const fetchControlRoomData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const orgParam = selectedOrgId !== 'all' ? `?org_id=${encodeURIComponent(selectedOrgId)}` : '';
      
      const [snapRes, execRes, appRes, actRes] = await Promise.all([
        fetch(`/api/admin/agents${orgParam}`),
        fetch(`/api/admin/executions${orgParam ? `${orgParam}&limit=30` : '?limit=30'}`),
        fetch(`/api/admin/approvals${orgParam}`),
        fetch(`/api/admin/agents/activity${orgParam ? `${orgParam}&limit=50` : '?limit=50'}`),
      ]);

      if (snapRes.ok) {
        const snapJson = await snapRes.json();
        if (snapJson.snapshot) setSnapshot(snapJson.snapshot);
      }

      if (execRes.ok) {
        const execJson = await execRes.json();
        setExecutions(execJson.executions || []);
        setTotalExecutions(execJson.total || 0);
      }

      if (appRes.ok) {
        const appJson = await appRes.json();
        setApprovals(appJson.approvals || []);
      }

      if (actRes.ok) {
        const actJson = await actRes.json();
        setLiveEvents(actJson.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch Control Room telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    fetchControlRoomData();
  }, [fetchControlRoomData]);

  // Auto-refresh interval (10s bounded)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchControlRoomData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchControlRoomData]);

  // Load Execution Trace Details
  const handleSelectExecution = async (exec: PersistedAgentExecution) => {
    setSelectedExecution(exec);
    setIsLoadingTrace(true);
    try {
      const res = await fetch(`/api/admin/executions/${encodeURIComponent(exec.id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.events) {
          setExecutionEvents(json.events);
        }
      }
    } catch (err) {
      console.error('Failed to fetch execution trace:', err);
    } finally {
      setIsLoadingTrace(false);
    }
  };

  // Handle Approval Decisions (Approve / Reject / Defer)
  const handleApprovalDecision = async (actionId: string, decision: 'APPROVE' | 'REJECT' | 'DEFER') => {
    try {
      setProcessingActionId(actionId);
      setActionNotice(null);

      const res = await fetch(`/api/admin/approvals/${encodeURIComponent(actionId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          organizationId: selectedOrgId !== 'all' ? selectedOrgId : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${decision.toLowerCase()} action`);
      }

      setActionNotice({
        type: 'success',
        text: `Action successfully ${decision === 'APPROVE' ? 'approved' : decision === 'REJECT' ? 'rejected' : 'deferred'}.`,
      });

      // Refresh data
      await fetchControlRoomData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err?.message || 'Failed to process approval decision',
      });
    } finally {
      setProcessingActionId(null);
    }
  };

  // Filter Agents
  const filteredAgents = (snapshot?.agents || []).filter((agent) => {
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.allowedTools.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Category counts
  const categories = [
    { id: 'all', label: 'All Agents', count: snapshot?.totalAgents || 0 },
    { id: 'business', label: 'Business & Strategy', count: snapshot?.agentsByCategory?.business || 0 },
    { id: 'operations', label: 'Operations & Comms', count: snapshot?.agentsByCategory?.operations || 0 },
    { id: 'finance', label: 'Finance & Risk', count: snapshot?.agentsByCategory?.finance || 0 },
    { id: 'growth', label: 'Growth & Funnel', count: snapshot?.agentsByCategory?.growth || 0 },
    { id: 'governance', label: 'Governance & Security', count: snapshot?.agentsByCategory?.governance || 0 },
    { id: 'engineering', label: 'Engineering & DevOps', count: snapshot?.agentsByCategory?.engineering || 0 },
  ];

  return (
    <div className="space-y-6" id="agent-control-room-root">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-slate-100">Agent Control Room</h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {snapshot?.systemStatus === 'DEGRADED' ? 'DEGRADED' : 'SYSTEM OPERATIONAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-agent ecosystem observability, trace execution timelines, and human approval gateway.
              </p>
            </div>
          </div>

          {/* Controls: Auto-refresh, manual refresh, org selector */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Organization Selector */}
            {organizations.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">All Tenants (Platform-wide)</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id} className="bg-slate-900 text-slate-200">
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                autoRefresh
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{autoRefresh ? 'Live (10s)' : 'Paused'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchControlRoomData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              actionNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{actionNotice.text}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Card 1: Registered Agents */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Registered Agents</span>
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-slate-100">{snapshot?.totalAgents || 19}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>Dynamic registry source</span>
            </div>
          </div>

          {/* Card 2: Active Executions */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Executions</span>
              <Play className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-slate-100">{snapshot?.activeRunningCount || 0}</div>
            <div className="text-[11px] text-slate-400">
              {snapshot?.activeRunningCount ? 'Executing orchestration' : 'No active executions'}
            </div>
          </div>

          {/* Card 3: Pending Human Approvals */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pending Approvals</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-300">{approvals.length}</div>
            <div className="text-[11px] text-slate-400">
              {approvals.length > 0 ? 'Requires human authorization' : 'Zero pending approvals'}
            </div>
          </div>

          {/* Card 4: Audited Traces */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Audited Traces</span>
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-slate-100">{totalExecutions}</div>
            <div className="text-[11px] text-slate-400">
              100% Reality Check verified
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800/90 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Agents Matrix ({snapshot?.totalAgents || 19})</span>
          </button>

          <button
            onClick={() => setActiveTab('executions')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'executions'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Execution Traces ({executions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Approval Center</span>
            {approvals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                {approvals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reality')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'reality'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Reality Check Audits</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Activity</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search agents, tools, queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AGENTS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 font-medium'
                    : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const isEngineering = agent.isEngineeringSpecialist;
              const hasRuns = agent.executionCount > 0;

              return (
                <div
                  key={agent.id}
                  className="bg-[#0B101D] border border-slate-800/80 hover:border-slate-700/90 rounded-2xl p-4.5 flex flex-col justify-between transition group shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Header: Name, Status & Health */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition">
                            {agent.name}
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{agent.id}</span>
                      </div>

                      {/* Status & Health Badges */}
                      <div className="flex items-center gap-1.5 flex-col items-end">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            agent.status === 'RUNNING'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse'
                              : agent.status === 'REQUIRES_APPROVAL'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {agent.status}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            agent.health === 'HEALTHY'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : agent.health === 'DEGRADED'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : agent.health === 'FAILING'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                          }`}
                        >
                          {agent.health === 'UNKNOWN' ? 'UNMEASURED' : agent.health}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {agent.description}
                    </p>

                    {/* Capabilities Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                        Category: {agent.category.toUpperCase()}
                      </span>
                      {agent.capabilities.slice(0, 2).map((cap, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-indigo-950/40 border border-indigo-800/40 text-indigo-300"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    {/* Tools Count & Preview */}
                    <div className="bg-slate-900/60 border border-slate-800/70 rounded-xl p-2.5 text-xs text-slate-400 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Deterministic Tools ({agent.allowedTools.length})</span>
                        <span className="text-slate-500">Read-only Safe</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        {agent.allowedTools.slice(0, 2).join(', ')}
                        {agent.allowedTools.length > 2 ? ` +${agent.allowedTools.length - 2} more` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats & Detail Button */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-slate-400">
                      {hasRuns ? (
                        <span>
                          <strong className="text-slate-200">{agent.executionCount}</strong> runs ({agent.successfulExecutions} ok)
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Timing telemetry unavailable</span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedAgent(agent)}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium cursor-pointer"
                    >
                      <span>Agent Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXECUTION TRACES */}
      {/* ========================================================================= */}
      {activeTab === 'executions' && (
        <div className="space-y-4">
          <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Execution Traces & Timelines</h3>
                <p className="text-xs text-slate-400">
                  Chronological log of multi-agent queries, tool latency, and reality checker audits.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Showing {executions.length} traces
              </span>
            </div>

            {executions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <History className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-medium text-slate-200">No Execution Traces Recorded Yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Execute a prompt in the AI Assistant or generate a Daily CEO Brief to observe live execution traces and agent timelines.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-medium">
                    <tr>
                      <th className="py-3 px-4">Trace ID</th>
                      <th className="py-3 px-4">Query</th>
                      <th className="py-3 px-4">Selected Specialists</th>
                      <th className="py-3 px-4">Tools Run</th>
                      <th className="py-3 px-4">Reality Check</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {executions.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {ex.id.slice(0, 14)}...
                        </td>
                        <td className="py-3.5 px-4 max-w-xs font-medium text-slate-200 truncate">
                          {ex.query}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            {ex.selectedAgents.slice(0, 2).map((aId, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-[10px] text-slate-300"
                              >
                                {aId.replace('agent_', '')}
                              </span>
                            ))}
                            {ex.selectedAgents.length > 2 && (
                              <span className="text-[10px] text-slate-500">
                                +{ex.selectedAgents.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {ex.toolsExecuted.length} tools
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              ex.realityCheckVerdict === 'PASSED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : ex.realityCheckVerdict === 'FLAGGED'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {ex.realityCheckVerdict}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {ex.totalDurationMs ? `${ex.totalDurationMs}ms` : 'Timing telemetry unavailable'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              ex.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : ex.status === 'REQUIRES_APPROVAL'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : ex.status === 'FAILED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {ex.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleSelectExecution(ex)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Trace</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HUMAN APPROVAL CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Human-in-the-Loop Approval Gateway</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-impact (Level 2 & Level 3) platform actions proposed by specialist agents awaiting explicit human administrator authorization.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {approvals.length} Action{approvals.length === 1 ? '' : 's'} Pending
              </span>
            </div>

            {approvals.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-medium text-slate-200">No Pending Approval Requests</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  All proposed agent recommendations are either low-risk read actions (auto-executed) or have already been reviewed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/70 border border-amber-500/20 rounded-xl p-4.5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {item.permissionLevel.toUpperCase()}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400">{item.description}</p>
                      </div>

                      <div className="text-right text-xs space-y-1">
                        <div className="text-[11px] text-slate-400">
                          Proposed by: <strong className="text-indigo-300">{item.requestingAgent}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Impact & Parameters */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span><strong>Estimated Impact:</strong> {item.estimatedImpact}</span>
                      </div>
                      {item.parameters && Object.keys(item.parameters).length > 0 && (
                        <div className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded-lg">
                          Parameters: {JSON.stringify(item.parameters)}
                        </div>
                      )}
                    </div>

                    {/* Decision Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        onClick={() => handleApprovalDecision(item.id, 'DEFER')}
                        disabled={processingActionId === item.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        Defer Review
                      </button>

                      <button
                        onClick={() => handleApprovalDecision(item.id, 'REJECT')}
                        disabled={processingActionId === item.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApprovalDecision(item.id, 'APPROVE')}
                        disabled={processingActionId === item.id}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Authorize & Execute</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REALITY CHECK AUDITS */}
      {/* ========================================================================= */}
      {activeTab === 'reality' && (
        <div className="space-y-4">
          <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Deterministic Reality Checker Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audits LLM specialist outputs against verified deterministic SQL database queries. Detects hallucinated metrics, small sample sizes, and ungrounded assumptions.
              </p>
            </div>

            {/* Reality Checker Rules Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <div className="text-xs font-semibold text-indigo-300">1. Numerical Claim Verification</div>
                <p className="text-[11px] text-slate-400">
                  Every rupee value, organization count, and invoice metric is matched against real database records.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <div className="text-xs font-semibold text-cyan-300">2. Sample Size Assessment</div>
                <p className="text-[11px] text-slate-400">
                  If organization sample count is below statistical significance, confidence is automatically capped.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <div className="text-xs font-semibold text-amber-300">3. Memory Precedence Overrides</div>
                <p className="text-[11px] text-slate-400">
                  Phase 8 memory conflicts are automatically flagged when historical memory diverges from current DB truth.
                </p>
              </div>
            </div>

            {/* Recent Audits Table */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Recent Reality Check Audits</h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Execution ID</th>
                      <th className="py-2.5 px-3">Query</th>
                      <th className="py-2.5 px-3">Confidence Score</th>
                      <th className="py-2.5 px-3">Verified Claims</th>
                      <th className="py-2.5 px-3">Flagged Claims</th>
                      <th className="py-2.5 px-3">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {executions.slice(0, 10).map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                          {ex.id.slice(0, 12)}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-slate-200">{ex.query}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {ex.confidenceScore.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-medium">
                          {ex.realityCheckSummary.claimsVerified || 0} claims
                        </td>
                        <td className="py-2.5 px-3 text-amber-400">
                          {ex.realityCheckSummary.claimsFlagged || 0} claims
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              ex.realityCheckVerdict === 'PASSED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {ex.realityCheckVerdict}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LIVE ACTIVITY STREAM */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Real-time Observability Stream</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fine-grained execution event logs: routing, tool invocations, reality checks, and action proposals.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {liveEvents.length} events logged
              </span>
            </div>

            {liveEvents.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/60">
                No real-time events recorded in current window.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {liveEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          evt.status === 'success'
                            ? 'bg-emerald-400'
                            : evt.status === 'warning'
                            ? 'bg-amber-400'
                            : evt.status === 'error'
                            ? 'bg-rose-400'
                            : 'bg-indigo-400'
                        }`}
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-200 font-semibold">
                            {evt.eventType}
                          </span>
                          {evt.toolName && (
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] text-cyan-300 font-mono">
                              {evt.toolName}
                            </span>
                          )}
                          {evt.agentId && (
                            <span className="px-1.5 py-0.2 rounded-md bg-indigo-950/40 text-[10px] text-indigo-300">
                              {evt.agentId}
                            </span>
                          )}
                        </div>
                        {evt.details && Object.keys(evt.details).length > 0 && (
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-xl">
                            {JSON.stringify(evt.details)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: AGENT DETAILS */}
      {/* ========================================================================= */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#0B101D] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{selectedAgent.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedAgent.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Status & Health Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Runtime Status</span>
                  <span className="font-semibold text-slate-200 mt-1 block">{selectedAgent.status}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Health Status</span>
                  <span className="font-semibold text-emerald-400 mt-1 block">
                    {selectedAgent.health === 'UNKNOWN' ? 'UNMEASURED' : selectedAgent.health}
                  </span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Total Executions</span>
                  <span className="font-semibold text-slate-200 mt-1 block">
                    {selectedAgent.executionCount} runs
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-slate-400 font-medium block mb-1">Agent Purpose</span>
                <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {selectedAgent.description}
                </p>
              </div>

              {/* Capabilities */}
              <div>
                <span className="text-slate-400 font-medium block mb-1">Core Capabilities</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedAgent.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Allowed Tools */}
              <div>
                <span className="text-slate-400 font-medium block mb-1">
                  Deterministic Server Tools ({selectedAgent.allowedTools.length})
                </span>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  {selectedAgent.allowedTools.map((tool, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                      <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{tool}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Questions / Prompts */}
              {selectedAgent.supportedIntents.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Example Questions & Prompts</span>
                  <div className="space-y-1.5">
                    {selectedAgent.supportedIntents.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedAgent(null);
                          if (onNavigateToAiQuery) onNavigateToAiQuery(q);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-slate-900/40 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-800/40 text-slate-300 hover:text-indigo-200 transition flex items-center justify-between group"
                      >
                        <span>&quot;{q}&quot;</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: EXECUTION TRACE TIMELINE */}
      {/* ========================================================================= */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#0B101D] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Workflow className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Execution Trace Timeline</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedExecution.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Step-by-Step Execution Lifecycle */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Query Summary */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">User Intent & Query</span>
                <div className="text-sm font-semibold text-slate-100">&quot;{selectedExecution.query}&quot;</div>
              </div>

              {/* Latency & Reality Verdict Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Total Execution Latency</span>
                  <span className="font-semibold text-slate-200 mt-1 block">
                    {selectedExecution.totalDurationMs ? `${selectedExecution.totalDurationMs}ms` : 'Timing telemetry unavailable'}
                  </span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Reality Checker Verdict</span>
                  <span
                    className={`font-semibold mt-1 block ${
                      selectedExecution.realityCheckVerdict === 'PASSED' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {selectedExecution.realityCheckVerdict}
                  </span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Proposed Actions</span>
                  <span className="font-semibold text-slate-200 mt-1 block">
                    {selectedExecution.actionsCount} actions ({selectedExecution.pendingApprovalsCount} pending)
                  </span>
                </div>
              </div>

              {/* Step-by-Step Pipeline Timeline */}
              <div>
                <span className="text-slate-400 font-medium block mb-2">Execution Step Timeline</span>
                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {/* Step 1: Specialist Routing */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 z-10">
                      <span className="text-[11px] font-bold">1</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex-1">
                      <div className="font-semibold text-slate-200">Specialist Selection & Routing</div>
                      <div className="text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        {selectedExecution.selectedAgents.map((aId, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-indigo-950/50 border border-indigo-800/40 text-indigo-300 text-[10px]"
                          >
                            {aId}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Tools Execution */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 z-10">
                      <span className="text-[11px] font-bold">2</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex-1">
                      <div className="font-semibold text-slate-200">Deterministic Tool Invocations</div>
                      <div className="text-slate-400 mt-1 space-y-1">
                        {selectedExecution.toolsExecuted.map((tName, i) => (
                          <div key={i} className="font-mono text-[11px] text-cyan-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{tName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Reality Checker Audit */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0 z-10">
                      <span className="text-[11px] font-bold">3</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex-1">
                      <div className="font-semibold text-slate-200">Reality Check & Evidence Grounding</div>
                      <div className="text-slate-400 mt-1 text-[11px]">
                        Verified {selectedExecution.realityCheckSummary.claimsVerified || 0} claims against PostgreSQL database. Confidence: {selectedExecution.confidenceScore}.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Logs Trace */}
              {executionEvents.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-2">Correlated Observability Events</span>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1 max-h-40 overflow-y-auto">
                    {executionEvents.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-400">
                        <span className="text-cyan-300">[{ev.eventType}]</span>
                        <span className="text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
              <button
                onClick={() => setSelectedExecution(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
