import { SupabaseClient } from '@supabase/supabase-js';
import {
  AGENT_REGISTRY,
  getAllAgents,
  getAgentById,
} from './agentRegistry';
import {
  AgentCategory,
  AgentDefinition,
  AgentHealthStatus,
  AgentStatus,
  AgentTelemetrySummary,
  ApprovalActionItem,
  ControlRoomSnapshot,
  ExecutionLifecycleState,
  ObservabilityEvent,
  ObservabilityEventType,
  PersistedAgentExecution,
} from './types';
import { sanitizeMetadata } from './memoryService';

/**
 * Sanitizes metadata to strictly strip private credentials, tokens, or system prompts.
 */
function sanitizeTelemetryMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized = sanitizeMetadata({ ...metadata });
  delete sanitized.systemPrompt;
  delete sanitized.system_prompt;
  delete sanitized.apiKey;
  delete sanitized.api_key;
  delete sanitized.serviceRoleKey;
  delete sanitized.service_role_key;
  delete sanitized.secret;
  return sanitized;
}

/**
 * Derives dynamic capabilities and category grouping from agent definition.
 */
function deriveCapabilities(agent: AgentDefinition): string[] {
  const caps: string[] = [];
  if (agent.allowedTools.includes('tool_get_platform_metrics')) caps.push('Platform Telemetry Audit');
  if (agent.allowedTools.includes('tool_get_financial_summary')) caps.push('Financial Analysis & Ledger Verification');
  if (agent.allowedTools.includes('tool_get_customer_aging')) caps.push('Receivables & Aging Analysis');
  if (agent.allowedTools.includes('tool_get_period_comparison')) caps.push('Period-over-Period Delta Analysis');
  if (agent.allowedTools.includes('tool_get_feature_adoption')) caps.push('Feature Adoption Tracking');
  if (agent.allowedTools.includes('tool_get_activation_funnel')) caps.push('Funnel Drop-off Analysis');
  if (agent.allowedTools.includes('tool_get_whatsapp_telemetry')) caps.push('WhatsApp Health & Delivery Verification');
  if (agent.allowedTools.includes('tool_get_operational_errors')) caps.push('Operational Error Synthesis');
  if (agent.allowedTools.includes('tool_get_market_intelligence')) caps.push('External Market Research Attribution');
  if (agent.allowedTools.includes('tool_get_structured_memory')) caps.push('Structured Memory Retrieval');
  if (agent.allowedTools.includes('tool_get_audit_intelligence')) caps.push('Audit Intelligence & Causality Checks');
  if (agent.allowedTools.includes('tool_get_historical_changes')) caps.push('Deterministic Historical Change Detection');
  if (agent.isEngineeringSpecialist) caps.push('Engineering & Architecture Analysis');
  if (caps.length === 0) caps.push('Specialist Intelligence & Strategic Evaluation');
  return caps;
}

/**
 * Dynamically discovers all agents from the single source of truth (AGENT_REGISTRY)
 * and combines them with actual execution telemetry.
 */
export async function getControlRoomSnapshot(
  supabase: SupabaseClient,
  options: { organizationId?: string | null } = {}
): Promise<ControlRoomSnapshot> {
  const allAgents = getAllAgents();
  const agentSummaries: AgentTelemetrySummary[] = [];

  // Query recent execution records with tenant isolation
  let execQuery = supabase
    .from('agent_executions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (options.organizationId !== undefined) {
    if (options.organizationId === null) {
      execQuery = execQuery.is('organization_id', null);
    } else {
      execQuery = execQuery.eq('organization_id', options.organizationId);
    }
  }

  let executions: any[] = [];
  try {
    const { data, error } = await execQuery;
    if (data && Array.isArray(data)) {
      executions = data;
    }
  } catch (err) {
    // If table doesn't exist yet, fallback gracefully
  }

  // Count active executions & pending approvals
  let activeRunningCount = 0;
  let failedExecutionsCount = 0;
  let pendingApprovalsCount = 0;
  let unknownHealthCount = 0;

  const agentStatsMap: Record<
    string,
    {
      total: number;
      success: number;
      failed: number;
      durations: number[];
      lastActive: string | null;
      hasActiveRunning: boolean;
      hasPendingApproval: boolean;
      realityFlags: number;
    }
  > = {};

  executions.forEach((ex) => {
    if (ex.status === 'RUNNING' || ex.lifecycle_state === 'RUNNING') {
      activeRunningCount++;
    }
    if (ex.status === 'FAILED' || ex.lifecycle_state === 'FAILED') {
      failedExecutionsCount++;
    }
    if (ex.pending_approvals_count > 0 || ex.status === 'REQUIRES_APPROVAL') {
      pendingApprovalsCount += Number(ex.pending_approvals_count) || 1;
    }

    const selected = Array.isArray(ex.selected_agents) ? ex.selected_agents : [];
    selected.forEach((agentId: string) => {
      if (!agentStatsMap[agentId]) {
        agentStatsMap[agentId] = {
          total: 0,
          success: 0,
          failed: 0,
          durations: [],
          lastActive: null,
          hasActiveRunning: false,
          hasPendingApproval: false,
          realityFlags: 0,
        };
      }
      const st = agentStatsMap[agentId];
      st.total++;
      if (ex.status === 'FAILED') {
        st.failed++;
      } else {
        st.success++;
      }
      if (ex.total_duration_ms) {
        st.durations.push(ex.total_duration_ms);
      }
      if (!st.lastActive || new Date(ex.created_at) > new Date(st.lastActive)) {
        st.lastActive = ex.created_at;
      }
      if (ex.status === 'RUNNING') {
        st.hasActiveRunning = true;
      }
      if (ex.status === 'REQUIRES_APPROVAL') {
        st.hasPendingApproval = true;
      }
      if (ex.reality_check_verdict === 'FLAGGED' || ex.reality_check_verdict === 'BLOCKED') {
        st.realityFlags++;
      }
    });
  });

  const categoriesCount: Record<string, number> = {};

  allAgents.forEach((agent) => {
    const cat = agent.category || 'business';
    categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;

    const stats = agentStatsMap[agent.id] || {
      total: 0,
      success: 0,
      failed: 0,
      durations: [],
      lastActive: null,
      hasActiveRunning: false,
      hasPendingApproval: false,
      realityFlags: 0,
    };

    // Calculate Status strictly from telemetry
    let status: AgentStatus = 'IDLE';
    if (stats.hasActiveRunning) {
      status = 'RUNNING';
    } else if (stats.hasPendingApproval) {
      status = 'REQUIRES_APPROVAL';
    }

    // Calculate Health strictly from telemetry (Zero Fake Health rule)
    let health: AgentHealthStatus = 'UNKNOWN';
    if (stats.total > 0) {
      if (stats.failed > 0 && stats.failed / stats.total > 0.3) {
        health = 'FAILING';
      } else if (stats.failed > 0 || stats.realityFlags > 0) {
        health = 'DEGRADED';
      } else {
        health = 'HEALTHY';
      }
    } else {
      unknownHealthCount++;
    }

    const avgDuration =
      stats.durations.length > 0
        ? Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length)
        : null;

    agentSummaries.push({
      id: agent.id,
      name: agent.name,
      category: agent.category,
      description: agent.description,
      capabilities: deriveCapabilities(agent),
      supportedIntents: agent.primaryQuestions || [],
      permissions: 'level_1_safe',
      allowedTools: agent.allowedTools || [],
      isEngineeringSpecialist: !!agent.isEngineeringSpecialist,
      status,
      health,
      confidence: health === 'HEALTHY' ? 'high' : health === 'DEGRADED' ? 'moderate' : 'insufficient_evidence',
      executionCount: stats.total,
      successfulExecutions: stats.success,
      failedExecutions: stats.failed,
      lastActivity: stats.lastActive,
      averageDurationMs: avgDuration,
      realityCheckFlagsCount: stats.realityFlags,
    });
  });

  return {
    systemStatus: failedExecutionsCount > 5 ? 'DEGRADED' : 'OPERATIONAL',
    totalAgents: allAgents.length,
    agentsByCategory: categoriesCount,
    activeRunningCount,
    pendingApprovalsCount,
    recentExecutionsCount: executions.length,
    failedExecutionsCount,
    unknownHealthCount,
    lastTelemetryUpdate: new Date().toISOString(),
    agents: agentSummaries,
  };
}

/**
 * Persists execution start event and creates the execution record.
 */
export async function recordExecutionStart(
  supabase: SupabaseClient,
  params: {
    executionId: string;
    organizationId?: string | null;
    query: string;
    selectedAgents: string[];
    userId?: string | null;
  }
): Promise<void> {
  try {
    await supabase.from('agent_executions').insert({
      id: params.executionId,
      organization_id: params.organizationId || null,
      query: params.query,
      status: 'RUNNING',
      lifecycle_state: 'ROUTING',
      selected_agents: params.selectedAgents,
      tools_executed: [],
      confidence_score: 'high',
      reality_check_verdict: 'UNKNOWN',
      total_duration_ms: 0,
      user_id: params.userId || null,
      created_at: new Date().toISOString(),
    });

    await recordExecutionEvent(supabase, {
      executionId: params.executionId,
      organizationId: params.organizationId,
      eventType: 'EXECUTION_CREATED',
      status: 'info',
      details: {
        query: params.query,
        selected_agents: params.selectedAgents,
      },
    });
  } catch (err) {
    // Non-blocking telemetry fallback
  }
}

/**
 * Persists an observability event for fine-grained execution tracking.
 */
export async function recordExecutionEvent(
  supabase: SupabaseClient,
  params: {
    executionId: string;
    organizationId?: string | null;
    agentId?: string | null;
    toolName?: string | null;
    eventType: ObservabilityEventType;
    status: 'info' | 'success' | 'warning' | 'error';
    details?: Record<string, any>;
  }
): Promise<void> {
  try {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sanitizedDetails = sanitizeTelemetryMetadata(params.details || {});

    await supabase.from('agent_execution_events').insert({
      id: eventId,
      execution_id: params.executionId,
      organization_id: params.organizationId || null,
      agent_id: params.agentId || null,
      tool_name: params.toolName || null,
      event_type: params.eventType,
      status: params.status,
      details: sanitizedDetails,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking telemetry fallback
  }
}

/**
 * Records execution completion with performance metrics and reality check findings.
 */
export async function recordExecutionComplete(
  supabase: SupabaseClient,
  params: {
    executionId: string;
    organizationId?: string | null;
    status: AgentStatus;
    lifecycleState: ExecutionLifecycleState;
    toolsExecuted: string[];
    confidenceScore: string;
    realityCheckVerdict: 'PASSED' | 'FLAGGED' | 'BLOCKED' | 'UNKNOWN';
    realityCheckSummary: Record<string, any>;
    totalDurationMs: number;
    toolDurationMs: number;
    specialistDurationMs: number;
    realityCheckDurationMs: number;
    fallbackUsed: boolean;
    actionsCount: number;
    pendingApprovalsCount: number;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const sanitizedMetadata = sanitizeTelemetryMetadata(params.metadata || {});

    await supabase
      .from('agent_executions')
      .update({
        status: params.status,
        lifecycle_state: params.lifecycleState,
        tools_executed: params.toolsExecuted,
        confidence_score: params.confidenceScore,
        reality_check_verdict: params.realityCheckVerdict,
        reality_check_summary: params.realityCheckSummary,
        total_duration_ms: params.totalDurationMs,
        tool_duration_ms: params.toolDurationMs,
        specialist_duration_ms: params.specialistDurationMs,
        reality_check_duration_ms: params.realityCheckDurationMs,
        fallback_used: params.fallbackUsed,
        actions_count: params.actionsCount,
        pending_approvals_count: params.pendingApprovalsCount,
        metadata: sanitizedMetadata,
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.executionId);

    await recordExecutionEvent(supabase, {
      executionId: params.executionId,
      organizationId: params.organizationId,
      eventType: 'EXECUTION_COMPLETED',
      status: 'success',
      details: {
        total_duration_ms: params.totalDurationMs,
        reality_check_verdict: params.realityCheckVerdict,
        actions_count: params.actionsCount,
        pending_approvals_count: params.pendingApprovalsCount,
      },
    });
  } catch (err) {
    // Non-blocking telemetry fallback
  }
}

/**
 * Records execution failure.
 */
export async function recordExecutionFailure(
  supabase: SupabaseClient,
  params: {
    executionId: string;
    organizationId?: string | null;
    errorMessage: string;
    durationMs: number;
  }
): Promise<void> {
  try {
    await supabase
      .from('agent_executions')
      .update({
        status: 'FAILED',
        lifecycle_state: 'FAILED',
        error_message: params.errorMessage,
        total_duration_ms: params.durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.executionId);

    await recordExecutionEvent(supabase, {
      executionId: params.executionId,
      organizationId: params.organizationId,
      eventType: 'EXECUTION_FAILED',
      status: 'error',
      details: {
        error_message: params.errorMessage,
        total_duration_ms: params.durationMs,
      },
    });
  } catch (err) {
    // Non-blocking telemetry fallback
  }
}

/**
 * Retrieves paginated execution history with server-side filters and tenant isolation.
 */
export async function getExecutionHistory(
  supabase: SupabaseClient,
  options: {
    organizationId?: string | null;
    agentId?: string;
    status?: string;
    querySearch?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ executions: PersistedAgentExecution[]; total: number }> {
  const limit = Math.min(options.limit || 20, 50);
  const offset = options.offset || 0;

  try {
    let q = supabase
      .from('agent_executions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options.organizationId !== undefined) {
      if (options.organizationId === null) {
        q = q.is('organization_id', null);
      } else {
        q = q.eq('organization_id', options.organizationId);
      }
    }

    if (options.status) {
      q = q.eq('status', options.status);
    }

    if (options.agentId) {
      q = q.contains('selected_agents', [options.agentId]);
    }

    if (options.querySearch) {
      q = q.ilike('query', `%${options.querySearch}%`);
    }

    const { data, count, error } = await q;

    if (data && Array.isArray(data)) {
      const executions: PersistedAgentExecution[] = data.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        query: row.query,
        status: row.status as AgentStatus,
        lifecycleState: row.lifecycle_state as ExecutionLifecycleState,
        selectedAgents: row.selected_agents || [],
        toolsExecuted: row.tools_executed || [],
        confidenceScore: row.confidence_score,
        realityCheckVerdict: row.reality_check_verdict || 'UNKNOWN',
        realityCheckSummary: row.reality_check_summary || {},
        totalDurationMs: row.total_duration_ms || 0,
        toolDurationMs: row.tool_duration_ms || 0,
        specialistDurationMs: row.specialist_duration_ms || 0,
        realityCheckDurationMs: row.reality_check_duration_ms || 0,
        fallbackUsed: !!row.fallback_used,
        actionsCount: row.actions_count || 0,
        pendingApprovalsCount: row.pending_approvals_count || 0,
        errorMessage: row.error_message,
        userId: row.user_id,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        completedAt: row.completed_at,
      }));

      return { executions, total: count || executions.length };
    }
  } catch (err) {
    // Non-blocking
  }

  return { executions: [], total: 0 };
}

/**
 * Retrieves full details and chronological event trace for a single execution.
 */
export async function getExecutionDetails(
  supabase: SupabaseClient,
  executionId: string,
  options: { organizationId?: string | null } = {}
): Promise<{
  execution: PersistedAgentExecution | null;
  events: ObservabilityEvent[];
}> {
  try {
    let q = supabase.from('agent_executions').select('*').eq('id', executionId);

    if (options.organizationId !== undefined && options.organizationId !== null) {
      q = q.eq('organization_id', options.organizationId);
    }

    const { data: execData } = await q.single();
    if (!execData) return { execution: null, events: [] };

    const execution: PersistedAgentExecution = {
      id: execData.id,
      organizationId: execData.organization_id,
      query: execData.query,
      status: execData.status as AgentStatus,
      lifecycleState: execData.lifecycle_state as ExecutionLifecycleState,
      selectedAgents: execData.selected_agents || [],
      toolsExecuted: execData.tools_executed || [],
      confidenceScore: execData.confidence_score,
      realityCheckVerdict: execData.reality_check_verdict || 'UNKNOWN',
      realityCheckSummary: execData.reality_check_summary || {},
      totalDurationMs: execData.total_duration_ms || 0,
      toolDurationMs: execData.tool_duration_ms || 0,
      specialistDurationMs: execData.specialist_duration_ms || 0,
      realityCheckDurationMs: execData.reality_check_duration_ms || 0,
      fallbackUsed: !!execData.fallback_used,
      actionsCount: execData.actions_count || 0,
      pendingApprovalsCount: execData.pending_approvals_count || 0,
      errorMessage: execData.error_message,
      userId: execData.user_id,
      metadata: execData.metadata || {},
      createdAt: execData.created_at,
      completedAt: execData.completed_at,
    };

    const { data: eventsData } = await supabase
      .from('agent_execution_events')
      .select('*')
      .eq('execution_id', executionId)
      .order('timestamp', { ascending: true });

    const events: ObservabilityEvent[] = (eventsData || []).map((ev) => ({
      id: ev.id,
      executionId: ev.execution_id,
      organizationId: ev.organization_id,
      agentId: ev.agent_id,
      toolName: ev.tool_name,
      eventType: ev.event_type as ObservabilityEventType,
      status: ev.status,
      details: ev.details || {},
      timestamp: ev.timestamp,
    }));

    return { execution, events };
  } catch (err) {
    return { execution: null, events: [] };
  }
}

/**
 * Retrieves live activity events across the system with bounded limit.
 */
export async function getLiveActivity(
  supabase: SupabaseClient,
  options: { organizationId?: string | null; limit?: number } = {}
): Promise<ObservabilityEvent[]> {
  const limit = Math.min(options.limit || 40, 100);

  try {
    let q = supabase
      .from('agent_execution_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (options.organizationId !== undefined) {
      if (options.organizationId === null) {
        q = q.is('organization_id', null);
      } else {
        q = q.eq('organization_id', options.organizationId);
      }
    }

    const { data } = await q;
    if (data && Array.isArray(data)) {
      return data.map((ev) => ({
        id: ev.id,
        executionId: ev.execution_id,
        organizationId: ev.organization_id,
        agentId: ev.agent_id,
        toolName: ev.tool_name,
        eventType: ev.event_type as ObservabilityEventType,
        status: ev.status,
        details: ev.details || {},
        timestamp: ev.timestamp,
      }));
    }
  } catch (err) {
    // Non-blocking
  }
  return [];
}

/**
 * Retrieves pending human approval action items.
 */
export async function getPendingApprovals(
  supabase: SupabaseClient,
  options: { organizationId?: string | null; limit?: number } = {}
): Promise<ApprovalActionItem[]> {
  const limit = Math.min(options.limit || 30, 50);
  const items: ApprovalActionItem[] = [];

  try {
    let q = supabase
      .from('executive_actions')
      .select('*')
      .in('status', ['PROPOSED', 'AWAITING_APPROVAL'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options.organizationId !== undefined) {
      if (options.organizationId === null) {
        q = q.is('organization_id', null);
      } else {
        q = q.eq('organization_id', options.organizationId);
      }
    }

    const { data } = await q;
    if (data && Array.isArray(data)) {
      data.forEach((row) => {
        items.push({
          id: row.id,
          actionId: row.id,
          executionId: row.metadata?.execution_id,
          organizationId: row.organization_id,
          title: row.title,
          description: row.description,
          requestingAgent: row.owner || 'Executive Orchestrator',
          permissionLevel: (row.metadata?.permission_level as any) || 'level_2_confirmation',
          actionType: row.metadata?.action_type || 'platform_operation',
          estimatedImpact: row.metadata?.estimated_impact || 'Operational Action',
          status: 'AWAITING_APPROVAL',
          parameters: row.metadata?.parameters || {},
          createdAt: row.created_at,
          reviewedBy: row.metadata?.reviewed_by,
          reviewedAt: row.metadata?.reviewed_at,
        });
      });
    }
  } catch (err) {
    // Non-blocking
  }

  return items;
}

/**
 * Processes a human approval decision on an action item (Approve, Reject, Defer).
 */
export async function processApprovalDecision(
  supabase: SupabaseClient,
  actionId: string,
  decision: 'APPROVE' | 'REJECT' | 'DEFER',
  actor: { id: string; email?: string | null; phone?: string | null },
  options: { note?: string; organizationId?: string | null } = {}
): Promise<{ success: boolean; newStatus: string; error?: string }> {
  try {
    const targetStatus =
      decision === 'APPROVE'
        ? 'APPROVED'
        : decision === 'REJECT'
        ? 'REJECTED'
        : 'AWAITING_APPROVAL';

    let q = supabase
      .from('executive_actions')
      .update({
        status: targetStatus,
        approval_status: decision === 'APPROVE' ? 'approved' : decision === 'REJECT' ? 'rejected' : 'pending',
        updated_at: new Date().toISOString(),
        metadata: {
          reviewed_by: actor.email || actor.id,
          reviewed_at: new Date().toISOString(),
          decision_note: options.note || null,
        },
      })
      .eq('id', actionId);

    if (options.organizationId !== undefined && options.organizationId !== null) {
      q = q.eq('organization_id', options.organizationId);
    }

    const { error } = await q;
    if (error) {
      return { success: false, newStatus: 'FAILED', error: error.message };
    }

    // Persist audit trail log
    const { data: firstOrg } = await supabase.from('organizations').select('id').limit(1).single();
    const orgId = options.organizationId || firstOrg?.id;

    if (orgId) {
      await supabase.from('audit_logs').insert({
        organization_id: orgId,
        user_id: actor.id,
        action: decision === 'APPROVE' ? 'ACTION_APPROVED' : 'ACTION_REJECTED',
        entity_type: 'executive_action',
        entity_id: actionId,
        metadata: {
          decision,
          action_id: actionId,
          reviewer: actor.email || actor.id,
          note: options.note || null,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return { success: true, newStatus: targetStatus };
  } catch (err: any) {
    return { success: false, newStatus: 'FAILED', error: err?.message || 'Processing failed' };
  }
}
