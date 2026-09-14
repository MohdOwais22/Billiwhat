import { AGENT_REGISTRY, selectRelevantAgents, getAllAgents } from '../lib/services/agentTeam/agentRegistry';
import {
  toolGetAISystemHealth,
  toolGetBackendArchitecture,
  toolGetDevOpsStatus,
  executeServerTool,
} from '../lib/services/agentTeam/toolRegistry';
import { evaluateRealityCheck } from '../lib/services/agentTeam/realityChecker';
import { executeExecutiveQuery } from '../lib/services/agentTeam/orchestrator';

// Deterministic Mock Supabase Client for Phase 6 Testing
function createPhase6MockSupabase() {
  const organizations = [
    { id: 'org-1', name: 'Apex Traders', email: 'apex@test.com', phone: '919876543210', created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: 'org-2', name: 'Bharat Logistics', email: 'bharat@test.com', phone: '919876543211', created_at: new Date(Date.now() - 40 * 86400000).toISOString() },
    { id: 'org-3', name: 'Calcutta Textiles', email: 'calcutta@test.com', phone: '919876543212', created_at: new Date(Date.now() - 25 * 86400000).toISOString() },
  ];

  const invoices = [
    { id: 'inv-1', organization_id: 'org-1', customer_id: 'cust-1', total: 10000, status: 'paid', created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
    { id: 'inv-2', organization_id: 'org-1', customer_id: 'cust-2', total: 25000, status: 'unpaid', created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
    { id: 'inv-3', organization_id: 'org-2', customer_id: 'cust-3', total: 15000, status: 'paid', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  ];

  const payments = [
    { id: 'pay-1', organization_id: 'org-1', invoice_id: 'inv-1', amount: 10000, payment_method: 'upi', created_at: new Date().toISOString() },
    { id: 'pay-2', organization_id: 'org-2', invoice_id: 'inv-3', amount: 15000, payment_method: 'upi', created_at: new Date().toISOString() },
  ];

  const customers = [
    { id: 'cust-1', organization_id: 'org-1', name: 'Customer A', phone: '919999999991' },
    { id: 'cust-2', organization_id: 'org-1', name: 'Customer B', phone: '919999999992' },
    { id: 'cust-3', organization_id: 'org-2', name: 'Customer C', phone: '919999999993' },
  ];

  const products = [
    { id: 'prod-1', organization_id: 'org-1', name: 'Product 1', price: 100 },
    { id: 'prod-2', organization_id: 'org-2', name: 'Product 2', price: 250 },
  ];

  const messageLogs = [
    { id: 'msg-1', organization_id: 'org-1', status: 'delivered', template_name: 'invoice_pdf', error_message: null, created_at: new Date().toISOString() },
    { id: 'msg-2', organization_id: 'org-1', status: 'failed', template_name: 'invoice_pdf', error_message: 'Format error', created_at: new Date().toISOString() },
  ];

  const auditLogs = [
    { id: 'aud-1', organization_id: 'org-1', user_id: 'user-1', event_type: 'executive_query', metadata: {}, created_at: new Date().toISOString() },
    { id: 'aud-2', organization_id: 'org-1', user_id: 'user-1', event_type: 'executive_audit', metadata: {}, created_at: new Date().toISOString() },
  ];

  return {
    from: (table: string) => {
      let data: any[] = [];
      if (table === 'invoices') data = [...invoices];
      else if (table === 'payments') data = [...payments];
      else if (table === 'organizations') data = [...organizations];
      else if (table === 'customers') data = [...customers];
      else if (table === 'products') data = [...products];
      else if (table === 'message_logs') data = [...messageLogs];
      else if (table === 'audit_logs') data = [...auditLogs];

      const builder: any = {
        select: (_cols?: string, opts?: { count?: 'exact'; head?: boolean }) => {
          if (opts?.count === 'exact') {
            return Promise.resolve({ data, count: data.length, error: null });
          }
          return builder;
        },
        eq: (col: string, val: any) => {
          data = data.filter((row) => row[col] === val);
          return builder;
        },
        ilike: (col: string, val: string) => {
          const pattern = val.replace(/%/g, '.*');
          const regex = new RegExp(pattern, 'i');
          data = data.filter((row) => regex.test(row[col] || ''));
          return builder;
        },
        limit: (_n: number) => builder,
        order: () => builder,
        insert: () => Promise.resolve({ data: null, error: null }),
        single: () => Promise.resolve({ data: data[0] || null, error: null }),
        then: (resolve: any) => resolve({ data, count: data.length, error: null }),
      };

      return builder;
    },
  } as any;
}

let passed = 0;
let failed = 0;
const failedTests: string[] = [];

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
    failedTests.push(message);
  }
}

async function runPhase6Tests() {
  console.log('\n======================================================');
  console.log('WHATSBILL PHASE 6 TEST SUITE: ENGINEERING SPECIALISTS');
  console.log('AI Engineer | Backend Architect | DevOps Automator');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // SUITE 1: Agent Registry & Configuration
  // --------------------------------------------------------------------------
  console.log('👉 SUITE 1: Engineering Agent Registry & Configuration');

  const allAgents = getAllAgents();
  assert(allAgents.length >= 15, `Agent registry contains ${allAgents.length} specialists`);

  const aiEng = AGENT_REGISTRY['ai_engineer'];
  assert(Boolean(aiEng), 'ai_engineer is registered');
  assert(aiEng?.category === 'engineering', 'ai_engineer has category "engineering"');
  assert(aiEng?.isEngineeringSpecialist === true, 'ai_engineer has isEngineeringSpecialist flag set to true');
  assert(aiEng?.allowedTools.includes('tool_get_ai_system_health'), 'ai_engineer includes tool_get_ai_system_health');
  assert(aiEng?.allowedTools.includes('tool_get_audit_events'), 'ai_engineer includes tool_get_audit_events');

  const backendArch = AGENT_REGISTRY['backend_architect'];
  assert(Boolean(backendArch), 'backend_architect is registered');
  assert(backendArch?.category === 'engineering', 'backend_architect has category "engineering"');
  assert(backendArch?.isEngineeringSpecialist === true, 'backend_architect has isEngineeringSpecialist flag set to true');
  assert(backendArch?.allowedTools.includes('tool_get_backend_architecture'), 'backend_architect includes tool_get_backend_architecture');

  const devops = AGENT_REGISTRY['devops_automator'];
  assert(Boolean(devops), 'devops_automator is registered');
  assert(devops?.category === 'engineering', 'devops_automator has category "engineering"');
  assert(devops?.isEngineeringSpecialist === true, 'devops_automator has isEngineeringSpecialist flag set to true');
  assert(devops?.allowedTools.includes('tool_get_devops_status'), 'devops_automator includes tool_get_devops_status');

  // --------------------------------------------------------------------------
  // SUITE 2: Router Dispatch & Intent Classification
  // --------------------------------------------------------------------------
  console.log('\n👉 SUITE 2: Router Dispatch & Intent Classification');

  // 1. AI Layer Queries
  const aiQuery = selectRelevantAgents('How is our AI layer performing and are prompt templates safe?');
  assert(aiQuery.some((a) => a.id === 'ai_engineer'), 'AI query routes to ai_engineer');
  assert(!aiQuery.some((a) => a.id === 'growth_executive'), 'AI query excludes unrequested growth executive');

  // 2. Backend & RLS Queries
  const backendQuery = selectRelevantAgents('Review database schema relations, query latency and RLS policies');
  assert(backendQuery.some((a) => a.id === 'backend_architect'), 'Database & RLS query routes to backend_architect');

  // 3. DevOps & Deployment Queries
  const devopsQuery = selectRelevantAgents('Audit DevOps deployment environment, container port 3000, and secret hygiene');
  assert(devopsQuery.some((a) => a.id === 'devops_automator'), 'Deployment and secret hygiene query routes to devops_automator');

  // 4. Cross-Cutting Engineering Queries
  const engQuery = selectRelevantAgents('Engineering architecture review across AI, backend, and devops');
  assert(engQuery.some((a) => a.id === 'ai_engineer'), 'Cross-cutting engineering review includes ai_engineer');
  assert(engQuery.some((a) => a.id === 'backend_architect'), 'Cross-cutting engineering review includes backend_architect');
  assert(engQuery.some((a) => a.id === 'devops_automator'), 'Cross-cutting engineering review includes devops_automator');

  // 5. Strict Exclusion on Business Queries
  const bizQuery1 = selectRelevantAgents('What is our total revenue and collections this month?');
  assert(!bizQuery1.some((a) => a.isEngineeringSpecialist), 'Business finance query strictly excludes all engineering specialists');

  const bizQuery2 = selectRelevantAgents('How can we acquire more customers through Reddit or Instagram?');
  assert(!bizQuery2.some((a) => a.isEngineeringSpecialist), 'Marketing acquisition query strictly excludes all engineering specialists');

  const bizQuery3 = selectRelevantAgents('Why are merchants dropping off during onboarding?');
  assert(!bizQuery3.some((a) => a.isEngineeringSpecialist), 'Product onboarding query strictly excludes all engineering specialists');

  // --------------------------------------------------------------------------
  // SUITE 3: Deterministic Tool Executions
  // --------------------------------------------------------------------------
  console.log('\n👉 SUITE 3: Deterministic Tool Executions');

  const mockSupabase = createPhase6MockSupabase();
  const context = {
    supabase: mockSupabase,
    adminUserId: 'admin-1',
    adminPhone: '919876543210',
    userPhone: '919876543210',
    permissionLevel: 'level_1_safe' as const,
  };

  // Tool 19: tool_get_ai_system_health
  const aiHealthRes = await executeServerTool('tool_get_ai_system_health', {}, context);
  assert(aiHealthRes.success, 'tool_get_ai_system_health executed successfully');
  assert(aiHealthRes.data?.modelConfig?.primaryModel === 'gemini-3.8-flash', 'AI health tool reports primaryModel: gemini-3.8-flash');
  assert(aiHealthRes.data?.modelConfig?.temperature === 0.2, 'AI health tool reports temperature: 0.2');
  assert(aiHealthRes.data?.promptSafety?.antiHallucinationGuardrailsActive === true, 'Anti-hallucination guardrails marked active');
  assert(aiHealthRes.data?.promptSafety?.realityCheckerIntegration === true, 'Reality checker integration confirmed');
  assert(aiHealthRes.data?.resilienceAndFallback?.deterministicFallbackConfigured === true, 'Deterministic fallback engine active');
  assert(typeof aiHealthRes.data?.telemetryNotice === 'string', 'AI health tool includes explicit telemetryNotice');

  // Tool 20: tool_get_backend_architecture
  const backendArchRes = await executeServerTool('tool_get_backend_architecture', {}, context);
  assert(backendArchRes.success, 'tool_get_backend_architecture executed successfully');
  assert(backendArchRes.data?.schemaOverview?.coreEntities.length >= 7, 'Backend tool identified core relational entities');
  assert(backendArchRes.data?.securityAndTenancy?.multiTenantIsolationField === 'organization_id', 'Multi-tenant isolation field verified as organization_id');
  assert(backendArchRes.data?.securityAndTenancy?.rowLevelSecurityStatus === 'active_enforced', 'Row-Level Security verified active_enforced');
  assert(backendArchRes.data?.queryOptimization?.queryTimeoutLimitMs === 8000, 'Query timeout limit verified as 8000ms');
  assert(backendArchRes.data?.webhookReliability?.whatsappWebhookVerification === true, 'WhatsApp webhook signature verification active');
  assert(backendArchRes.data?.webhookReliability?.idempotentDeliveryHandling === true, 'WhatsApp webhook idempotent deduplication active');
  assert(typeof backendArchRes.data?.telemetryNotice === 'string', 'Backend architecture tool includes explicit telemetryNotice');

  // Tool 21: tool_get_devops_status
  const devopsRes = await executeServerTool('tool_get_devops_status', {}, context);
  assert(devopsRes.success, 'tool_get_devops_status executed successfully');
  assert(devopsRes.data?.deploymentConfiguration?.enforcedPort === 3000, 'DevOps tool confirms strictly enforced port 3000');
  assert(devopsRes.data?.deploymentConfiguration?.portCompliance === true, 'DevOps tool confirms port compliance');
  assert(devopsRes.data?.environmentSecretHygiene?.secretLeakFreeConfirmed === true, 'DevOps tool confirms zero secret leaks');
  assert(devopsRes.data?.monitoringAndObservability?.sentryConfigured === true, 'Sentry error capture configured');
  assert(typeof devopsRes.data?.telemetryNotice === 'string', 'DevOps tool includes explicit telemetryNotice');

  // --------------------------------------------------------------------------
  // SUITE 4: Reality Checker Audits for Engineering
  // --------------------------------------------------------------------------
  console.log('\n👉 SUITE 4: Reality Checker Audits for Engineering');

  const testPlatformMetrics: any = {
    organizationCount: 3,
    activeOrganizationCount: 2,
    dormantOrganizationCount: 1,
    invoiceCount: 3,
    billedValue: 50000,
    collectedValue: 25000,
    outstandingReceivables: 25000,
    userCount: 3,
    customerCount: 3,
    productCount: 3,
  };

  // 1. Valid AI Engineer finding
  const validAiFinding: any = {
    agentId: 'ai_engineer',
    agentName: 'AI Engineer',
    category: 'engineering',
    status: 'success',
    summary: 'AI layer is grounded with Gemini 3.8 Flash, temperature 0.2, and fallback on 429 quota exhaustion.',
    findingSummary: 'AI layer is grounded with Gemini 3.8 Flash, temperature 0.2, and fallback on 429 quota exhaustion.',
    keyFindings: [
      'Active Gemini model: gemini-3.8-flash (T: 0.2)',
      'API Key isolated server-side with zero NEXT_PUBLIC_ exposure',
      'Telemetry Notice: Direct token consumption logs from Google AI Studio are unintegrated.',
    ],
    evidence: ['Verified model config'],
    metricsUsed: {},
    recommendedActions: [],
    executionTimeMs: 12,
  };

  const rcValid = evaluateRealityCheck({
    query: 'AI system check',
    specialistFindings: [validAiFinding],
    toolResults: {
      tool_get_ai_system_health: aiHealthRes,
    },
    platformMetrics: testPlatformMetrics,
  });
  assert(rcValid.unsupportedAssumptions.length === 0, 'Reality Checker accepts properly grounded AI findings without errors');

  // 2. Prohibited client-side key exposure
  const leakyAiFinding: any = {
    agentId: 'ai_engineer',
    agentName: 'AI Engineer',
    category: 'engineering',
    status: 'partial',
    summary: 'Expose NEXT_PUBLIC_GEMINI_API_KEY in client components for direct calls.',
    findingSummary: 'Expose NEXT_PUBLIC_GEMINI_API_KEY in client components for direct calls.',
    keyFindings: [
      'Propose exposing NEXT_PUBLIC_GEMINI_API_KEY for client-side API key usage',
    ],
    evidence: [],
    metricsUsed: {},
    recommendedActions: [],
    executionTimeMs: 10,
  };

  const rcLeaky = evaluateRealityCheck({
    query: 'AI key architecture',
    specialistFindings: [leakyAiFinding],
    toolResults: {},
    platformMetrics: testPlatformMetrics,
  });
  assert(
    rcLeaky.unsupportedAssumptions.some((a) => a.includes('exposing Gemini API key')),
    'Reality Checker catches and flags client-side API key exposure violation'
  );

  // 3. Prohibited RLS bypass proposal
  const rlsBypassFinding: any = {
    agentId: 'backend_architect',
    agentName: 'Backend Architect',
    category: 'engineering',
    status: 'partial',
    summary: 'Speed up query execution by disabling RLS across invoice tables.',
    findingSummary: 'Speed up query execution by disabling RLS across invoice tables.',
    keyFindings: [
      'Propose to disable RLS to improve query throughput',
    ],
    evidence: [],
    metricsUsed: {},
    recommendedActions: [],
    executionTimeMs: 10,
  };

  const rcRls = evaluateRealityCheck({
    query: 'Backend optimization',
    specialistFindings: [rlsBypassFinding],
    toolResults: {},
    platformMetrics: testPlatformMetrics,
  });
  assert(
    rcRls.unsupportedAssumptions.some((a) => a.includes('disabling Row-Level Security')),
    'Reality Checker catches and flags RLS bypass proposal'
  );

  // 4. Prohibited non-3000 port proposal
  const portViolationFinding: any = {
    agentId: 'devops_automator',
    agentName: 'DevOps Automator',
    category: 'engineering',
    status: 'partial',
    summary: 'Change server port to 5173 for local vite dev mode.',
    findingSummary: 'Change server port to 5173 for local vite dev mode.',
    keyFindings: [
      'Change port to 5173 for development server',
    ],
    evidence: [],
    metricsUsed: {},
    recommendedActions: [],
    executionTimeMs: 10,
  };

  const rcPort = evaluateRealityCheck({
    query: 'Port configuration',
    specialistFindings: [portViolationFinding],
    toolResults: {},
    platformMetrics: testPlatformMetrics,
  });
  assert(
    rcPort.unsupportedAssumptions.some((a) => a.includes('port 3000 is strictly mandated')),
    'Reality Checker catches and flags non-3000 port proposals'
  );

  // --------------------------------------------------------------------------
  // SUITE 5: End-to-End Orchestrator Pipeline Integration
  // --------------------------------------------------------------------------
  console.log('\n👉 SUITE 5: End-to-End Orchestrator Pipeline Integration');

  const adminUser = {
    id: 'admin-1',
    phone: '919876543210',
    role: 'master_admin',
  };

  // 1. Executive query on AI Architecture
  const aiExecutiveRes = await executeExecutiveQuery(
    'How is our AI architecture configured and what are our prompt safety safeguards?',
    mockSupabase,
    adminUser
  );
  assert(Boolean(aiExecutiveRes), 'Executive query on AI architecture returned valid response');
  const aiContribution = aiExecutiveRes.specialistContributions.find((c) => c.agentId === 'ai_engineer');
  assert(Boolean(aiContribution), 'AI Engineer contribution present in response');
  assert(Boolean(aiContribution?.structure?.MODEL_CONFIGURATION), 'ai_engineer has structured MODEL_CONFIGURATION');
  assert(Boolean(aiContribution?.structure?.PROMPT_SAFETY_AND_INVARIANTS), 'ai_engineer has structured PROMPT_SAFETY_AND_INVARIANTS');
  assert(Boolean(aiContribution?.structure?.FALLBACK_RELIABILITY), 'ai_engineer has structured FALLBACK_RELIABILITY');
  assert(Boolean(aiContribution?.structure?.TOKEN_AND_COST_PROFILE), 'ai_engineer has structured TOKEN_AND_COST_PROFILE');

  // 2. Executive query on Backend Architecture
  const backendExecutiveRes = await executeExecutiveQuery(
    'Review our backend database schema, query latency limits and RLS policies',
    mockSupabase,
    adminUser
  );
  assert(Boolean(backendExecutiveRes), 'Executive query on Backend architecture returned valid response');
  const backendContribution = backendExecutiveRes.specialistContributions.find((c) => c.agentId === 'backend_architect');
  assert(Boolean(backendContribution), 'Backend Architect contribution present in response');
  assert(Boolean(backendContribution?.structure?.SCHEMA_AND_RELATIONS), 'backend_architect has structured SCHEMA_AND_RELATIONS');
  assert(Boolean(backendContribution?.structure?.TENANT_ISOLATION_AND_RLS), 'backend_architect has structured TENANT_ISOLATION_AND_RLS');
  assert(Boolean(backendContribution?.structure?.QUERY_PATTERNS_AND_INDEXING), 'backend_architect has structured QUERY_PATTERNS_AND_INDEXING');
  assert(Boolean(backendContribution?.structure?.WEBHOOK_IDEMPOTENCY), 'backend_architect has structured WEBHOOK_IDEMPOTENCY');

  // 3. Executive query on DevOps and Deployment
  const devopsExecutiveRes = await executeExecutiveQuery(
    'Audit DevOps deployment status, container port 3000, and secret hygiene',
    mockSupabase,
    adminUser
  );
  assert(Boolean(devopsExecutiveRes), 'Executive query on DevOps status returned valid response');
  const devopsContribution = devopsExecutiveRes.specialistContributions.find((c) => c.agentId === 'devops_automator');
  assert(Boolean(devopsContribution), 'DevOps Automator contribution present in response');
  assert(Boolean(devopsContribution?.structure?.ENVIRONMENT_SECRET_HYGIENE), 'devops_automator has structured ENVIRONMENT_SECRET_HYGIENE');
  assert(Boolean(devopsContribution?.structure?.DEPLOYMENT_AND_RUNTIME), 'devops_automator has structured DEPLOYMENT_AND_RUNTIME');
  assert(Boolean(devopsContribution?.structure?.ERROR_TRACKING_AND_LOGS), 'devops_automator has structured ERROR_TRACKING_AND_LOGS');

  // 4. Verification of unmeasurable data flagging for engineering metrics
  const unmeasuredRes = await executeExecutiveQuery(
    'What is our exact Gemini token spend and PostgreSQL explain analyze query plan cache hit ratio?',
    mockSupabase,
    adminUser
  );
  assert(Boolean(unmeasuredRes.unknownOrMissingData), 'Orchestrator identifies unknownOrMissingData for unmeasured technical metrics');
  assert(
    unmeasuredRes.unknownOrMissingData?.some((d) => d.includes('token usage logs') || d.includes('EXPLAIN ANALYZE')),
    'Orchestrator explicitly states token billing or PostgreSQL execution plans are unmeasured'
  );

  console.log('\n======================================================');
  console.log(`PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  if (failedTests.length > 0) {
    console.log('Failed tests:');
    failedTests.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  }
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests().catch((err) => {
  console.error('Fatal error during Phase 6 tests:', err);
  process.exit(1);
});
