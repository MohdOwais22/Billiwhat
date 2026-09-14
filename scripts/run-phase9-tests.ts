/**
 * WHATSBILL PHASE 9 VERIFICATION TEST SUITE
 * Visual Agent Control Room & Execution Observability
 */

import { AGENT_REGISTRY, getAllAgents, getAgentById, selectRelevantAgents } from '../lib/services/agentTeam/agentRegistry';
import {
  getControlRoomSnapshot,
  recordExecutionStart,
  recordExecutionEvent,
  recordExecutionComplete,
  recordExecutionFailure,
  getExecutionHistory,
  getExecutionDetails,
  getPendingApprovals,
  processApprovalDecision,
  getLiveActivity,
} from '../lib/services/agentTeam/controlRoomService';
import { executeExecutiveQuery } from '../lib/services/agentTeam/orchestrator';

// Robust in-memory mock Supabase client for deterministic verification
function createMockSupabase() {
  const executions: any[] = [];
  const events: any[] = [];
  const actions: any[] = [];
  const auditLogs: any[] = [];
  const orgs: any[] = [
    { id: 'org_test_1', name: 'Alpha Traders', is_active: true },
    { id: 'org_test_2', name: 'Beta Logistics', is_active: true },
  ];

  return {
    from(tableName: string) {
      let currentTable = tableName;
      let filterOrgId: any = undefined;
      let filterStatus: any = undefined;
      let filterAgents: any = undefined;
      let filterId: any = undefined;
      let filterExecutionId: any = undefined;
      let pendingUpdatePayload: any = null;
      let isSingle = false;

      const builder: any = {
        select(fields?: string, options?: any) {
          return builder;
        },
        order(field: string, opts?: any) {
          return builder;
        },
        limit(count: number) {
          return builder;
        },
        range(from: number, to: number) {
          return builder;
        },
        eq(column: string, value: any) {
          if (column === 'id') filterId = value;
          if (column === 'organization_id') filterOrgId = value;
          if (column === 'status') filterStatus = value;
          if (column === 'execution_id') filterExecutionId = value;
          return builder;
        },
        is(column: string, value: any) {
          if (column === 'organization_id' && value === null) filterOrgId = null;
          return builder;
        },
        in(column: string, values: any[]) {
          return builder;
        },
        contains(column: string, values: any[]) {
          filterAgents = values;
          return builder;
        },
        ilike(column: string, pattern: string) {
          return builder;
        },
        async insert(payload: any) {
          const items = Array.isArray(payload) ? payload : [payload];
          if (currentTable === 'agent_executions') {
            executions.push(...items);
          } else if (currentTable === 'agent_execution_events') {
            events.push(...items);
          } else if (currentTable === 'executive_actions') {
            actions.push(...items);
          } else if (currentTable === 'audit_logs') {
            auditLogs.push(...items);
          }
          return { data: items, error: null };
        },
        update(payload: any) {
          pendingUpdatePayload = payload;
          return builder;
        },
        single() {
          isSingle = true;
          return builder;
        },
        then(resolve: any) {
          if (pendingUpdatePayload) {
            if (currentTable === 'agent_executions') {
              const ex = executions.find((e) => e.id === filterId);
              if (ex) Object.assign(ex, pendingUpdatePayload);
            } else if (currentTable === 'executive_actions') {
              const act = actions.find((a) => a.id === filterId);
              if (act) Object.assign(act, pendingUpdatePayload);
            }
            return resolve({ data: pendingUpdatePayload, error: null });
          }

          if (currentTable === 'agent_executions') {
            let res = [...executions];
            if (filterId) res = res.filter((e) => e.id === filterId);
            if (filterStatus) res = res.filter((e) => e.status === filterStatus);
            if (filterAgents) res = res.filter((e) => e.selected_agents?.some((a: string) => filterAgents.includes(a)));
            return resolve({ data: isSingle ? res[0] || null : res, count: res.length, error: null });
          }
          if (currentTable === 'agent_execution_events') {
            let res = [...events];
            if (filterExecutionId) res = res.filter((e) => e.execution_id === filterExecutionId);
            return resolve({ data: isSingle ? res[0] || null : res, count: res.length, error: null });
          }
          if (currentTable === 'executive_actions') {
            let res = [...actions];
            if (filterId) res = res.filter((a) => a.id === filterId);
            return resolve({ data: isSingle ? res[0] || null : res, count: res.length, error: null });
          }
          if (currentTable === 'organizations') {
            return resolve({ data: isSingle ? orgs[0] : orgs, count: orgs.length, error: null });
          }
          if (currentTable === 'invoices') {
            return resolve({ data: [], count: 0, error: null });
          }
          if (currentTable === 'audit_logs') {
            return resolve({ data: auditLogs, count: auditLogs.length, error: null });
          }
          return resolve({ data: [], error: null });
        },
      };
      return builder;
    },
  } as any;
}

let passedAssertions = 0;
let totalAssertions = 0;

function assert(condition: boolean, description: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ ${description}`);
  } else {
    console.error(`  ✗ FAIL: ${description}`);
  }
}

async function runPhase9Tests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 9: AGENT CONTROL ROOM TEST SUITE');
  console.log('======================================================\n');

  const mockSupabase = createMockSupabase();
  const testAdmin = { id: 'admin_test_123', email: 'admin@whatsbill.com', phone: '919876543210' };

  // 1. Dynamic Agent Registry Discovery
  console.log('--- 1. Dynamic Agent Registry Discovery ---');
  const allAgents = getAllAgents();
  assert(allAgents.length >= 19, `Dynamically discovered ${allAgents.length} agents (expected >= 19)`);

  const reporter = getAgentById('analytics_reporter');
  assert(!!reporter, 'Agent Analytics Reporter is registered and discoverable');
  assert(reporter?.category === 'business', 'Analytics Reporter has category "business"');
  assert(Array.isArray(reporter?.allowedTools) && reporter.allowedTools.length > 0, 'Reporter has allowedTools array');
  assert(Array.isArray(reporter?.primaryQuestions) && reporter.primaryQuestions.length > 0, 'Reporter has primary questions');

  const maintainer = getAgentById('infrastructure_maintainer');
  assert(!!maintainer, 'Infrastructure Maintainer specialist is registered');
  assert(maintainer?.category === 'operations', 'Infrastructure Maintainer has category "operations"');

  // 2. Control Room Snapshot & Zero-Fake Telemetry
  console.log('\n--- 2. Control Room Snapshot & Zero-Fake Telemetry ---');
  const snapshot = await getControlRoomSnapshot(mockSupabase);
  assert(snapshot.totalAgents === allAgents.length, `Snapshot agent count matches registry (${snapshot.totalAgents})`);
  assert(snapshot.systemStatus === 'OPERATIONAL', 'System status is OPERATIONAL');
  assert(snapshot.activeRunningCount === 0, 'Active running count is 0 with no runs');
  assert(snapshot.pendingApprovalsCount === 0, 'Pending approvals count is 0 with no pending actions');

  // Strict: Unrun agents must have UNKNOWN health (not fake 100%)
  const unrunAgent = snapshot.agents.find((a) => a.id === 'analytics_reporter');
  assert(unrunAgent?.health === 'UNKNOWN', 'Unrun agent health is strictly "UNKNOWN" (Zero Fake Telemetry)');
  assert(unrunAgent?.executionCount === 0, 'Unrun agent executionCount is 0');
  assert(unrunAgent?.status === 'IDLE', 'Unrun agent status is IDLE');

  // 3. Execution Lifecycle & Event Recording
  console.log('\n--- 3. Execution Lifecycle & Event Recording ---');
  const testTraceId = `trace_test_${Date.now()}`;
  
  await recordExecutionStart(mockSupabase, {
    executionId: testTraceId,
    query: 'Analyze overdue invoice collections and cashflow',
    selectedAgents: ['finance_tracker', 'support_responder'],
    userId: testAdmin.id,
  });

  await recordExecutionEvent(mockSupabase, {
    executionId: testTraceId,
    toolName: 'tool_get_platform_metrics',
    eventType: 'TOOL_STARTED',
    status: 'info',
  });

  await recordExecutionEvent(mockSupabase, {
    executionId: testTraceId,
    toolName: 'tool_get_platform_metrics',
    eventType: 'TOOL_COMPLETED',
    status: 'success',
    details: { durationMs: 25 },
  });

  await recordExecutionEvent(mockSupabase, {
    executionId: testTraceId,
    eventType: 'REALITY_CHECK_COMPLETED',
    status: 'success',
    details: { confidence: 'high', verifiedClaimsCount: 4 },
  });

  await recordExecutionComplete(mockSupabase, {
    executionId: testTraceId,
    status: 'COMPLETED',
    lifecycleState: 'COMPLETED',
    toolsExecuted: ['tool_get_platform_metrics', 'tool_get_customer_aging'],
    confidenceScore: 'high',
    realityCheckVerdict: 'PASSED',
    realityCheckSummary: { claimsVerified: 4, claimsFlagged: 0, unsupportedCount: 0 },
    totalDurationMs: 120,
    toolDurationMs: 40,
    specialistDurationMs: 30,
    realityCheckDurationMs: 20,
    fallbackUsed: false,
    actionsCount: 1,
    pendingApprovalsCount: 0,
  });

  // Verify stored execution trace
  const details = await getExecutionDetails(mockSupabase, testTraceId);
  assert(!!details.execution, 'Execution trace details retrieved successfully');
  assert(details.execution?.status === 'COMPLETED', 'Execution status is COMPLETED');
  assert(details.execution?.totalDurationMs === 120, 'Total duration recorded accurately (120ms)');
  assert(details.execution?.realityCheckVerdict === 'PASSED', 'Reality check verdict is PASSED');
  assert(details.events.length >= 4, `Correlated observability events recorded (${details.events.length} events)`);

  // 4. Observability Stream & Live Activity
  console.log('\n--- 4. Live Activity Stream ---');
  const liveEvents = await getLiveActivity(mockSupabase);
  assert(liveEvents.length > 0, `Live activity returns events (${liveEvents.length} events)`);
  assert(liveEvents.some((e) => e.eventType === 'TOOL_COMPLETED'), 'Live stream includes TOOL_COMPLETED event');

  // 5. Dynamic Health Calculation After Execution
  console.log('\n--- 5. Dynamic Health Calculation After Execution ---');
  const updatedSnapshot = await getControlRoomSnapshot(mockSupabase);
  const finAgent = updatedSnapshot.agents.find((a) => a.id === 'finance_tracker');
  assert(finAgent?.executionCount === 1, 'Finance agent execution count incremented to 1');
  assert(finAgent?.health === 'HEALTHY', 'Finance agent health transitioned from UNKNOWN to HEALTHY');
  assert(finAgent?.successfulExecutions === 1, 'Finance agent successfulExecutions is 1');

  // 6. Human Approval Center (Level 2 & Level 3 Actions)
  console.log('\n--- 6. Human Approval Center ---');
  // Insert a pending high-impact action
  const testActionId = `act_high_${Date.now()}`;
  await mockSupabase.from('executive_actions').insert({
    id: testActionId,
    organization_id: 'org_test_1',
    title: 'Purge Dormant Test Merchants',
    description: 'Archive organizations with 0 active invoices older than 90 days',
    owner: 'feedback_synthesizer',
    status: 'AWAITING_APPROVAL',
    metadata: {
      permission_level: 'level_3_high_impact',
      action_type: 'data_archival',
      estimated_impact: 'High - Irreversible data state change',
    },
  });

  const pendingApprovals = await getPendingApprovals(mockSupabase);
  assert(pendingApprovals.length === 1, 'Pending approvals list returns the Level 3 action');
  assert(pendingApprovals[0].permissionLevel === 'level_3_high_impact', 'Approval action reflects high impact level');

  // Authorize the action
  const decisionResult = await processApprovalDecision(
    mockSupabase,
    testActionId,
    'APPROVE',
    testAdmin,
    { note: 'Authorized by Master Admin after security review.' }
  );

  assert(decisionResult.success === true, 'Approval decision processed successfully');
  assert(decisionResult.newStatus === 'APPROVED', 'New status transitioned to APPROVED');

  // 7. Executive Orchestrator End-to-End Integration
  console.log('\n--- 7. Executive Orchestrator End-to-End Integration ---');
  const execResponse = await executeExecutiveQuery(
    'What is our financial health and receivables status today?',
    mockSupabase,
    testAdmin
  );

  assert(!!execResponse.query, 'Executive query executed successfully');
  assert(!!execResponse.whatIsHappening, 'whatIsHappening summary generated');
  assert(!!execResponse.realityCheck, 'Reality check report generated');
  assert(Array.isArray(execResponse.specialistContributions), 'Specialist contributions present');
  assert(execResponse.specialistContributions.length >= 2, 'At least 2 specialist contributions returned');

  // Check that the orchestrator logged an execution in agent_executions
  const execHistory = await getExecutionHistory(mockSupabase, { limit: 10 });
  assert(execHistory.executions.length >= 2, `Execution history contains recorded runs (${execHistory.executions.length} traces)`);

  // Summary
  console.log('\n======================================================');
  console.log(`🏁 PHASE 9 TEST SUITE SUMMARY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED`);
  console.log('======================================================\n');

  if (passedAssertions === totalAssertions) {
    console.log('🎉 ALL PHASE 9 ASSERTIONS PASSED PERFECTLY!\n');
  } else {
    process.exit(1);
  }
}

runPhase9Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
