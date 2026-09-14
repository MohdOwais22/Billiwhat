import { AGENT_REGISTRY, selectRelevantAgents, getAllAgents } from '../lib/services/agentTeam/agentRegistry';
import {
  toolGetExperiments,
  toolCalculateSprintPriorities,
  toolGetAcquisitionFunnel,
  toolGetGrowthOpportunities,
  toolGetContentMatrix,
  executeServerTool,
} from '../lib/services/agentTeam/toolRegistry';
import { evaluateRealityCheck } from '../lib/services/agentTeam/realityChecker';
import { executeExecutiveQuery } from '../lib/services/agentTeam/orchestrator';

// Deterministic Mock Supabase Client for Phase 5 Testing
function createPhase5MockSupabase() {
  const invoices = [
    { id: 'inv-1', organization_id: 'org-1', customer_id: 'cust-1', total: 10000, status: 'paid', due_date: new Date(Date.now() - 10 * 86400000).toISOString(), created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
    { id: 'inv-2', organization_id: 'org-1', customer_id: 'cust-2', total: 25000, status: 'unpaid', due_date: new Date(Date.now() - 40 * 86400000).toISOString(), created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
    { id: 'inv-3', organization_id: 'org-2', customer_id: 'cust-3', total: 15000, status: 'partially_paid', due_date: new Date(Date.now() + 10 * 86400000).toISOString(), created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'inv-4', organization_id: 'org-2', customer_id: 'cust-2', total: 50000, status: 'overdue', due_date: new Date(Date.now() - 70 * 86400000).toISOString(), created_at: new Date(Date.now() - 75 * 86400000).toISOString() },
    { id: 'inv-5', organization_id: 'org-3', customer_id: 'cust-4', total: 12000, status: 'paid', due_date: new Date(Date.now() - 5 * 86400000).toISOString(), created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
    { id: 'inv-6', organization_id: 'org-4', customer_id: 'cust-5', total: 30000, status: 'paid', due_date: new Date(Date.now() - 20 * 86400000).toISOString(), created_at: new Date(Date.now() - 25 * 86400000).toISOString() },
  ];

  const payments = [
    { id: 'pay-1', organization_id: 'org-1', invoice_id: 'inv-1', amount: 10000, payment_method: 'upi', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
    { id: 'pay-2', organization_id: 'org-2', invoice_id: 'inv-3', amount: 5000, payment_method: 'bank_transfer', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'pay-3', organization_id: 'org-3', invoice_id: 'inv-5', amount: 12000, payment_method: 'upi', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'pay-4', organization_id: 'org-4', invoice_id: 'inv-6', amount: 30000, payment_method: 'upi', created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
  ];

  const organizations = [
    { id: 'org-1', name: 'Apex Traders', email: 'apex@test.com', phone: '919876543210', created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: 'org-2', name: 'Bharat Logistics', email: 'bharat@test.com', phone: '919876543211', created_at: new Date(Date.now() - 40 * 86400000).toISOString() },
    { id: 'org-3', name: 'Calcutta Textiles', email: 'calcutta@test.com', phone: '919876543212', created_at: new Date(Date.now() - 25 * 86400000).toISOString() },
    { id: 'org-4', name: 'Delhi Electricals', email: 'delhi@test.com', phone: '919876543213', created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
    { id: 'org-5', name: 'Everest Supplies', email: 'everest@test.com', phone: null, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  ];

  const messageLogs = [
    { id: 'msg-1', organization_id: 'org-1', status: 'delivered', template_name: 'invoice_pdf', error_message: null, error_code: null, created_at: new Date().toISOString() },
    { id: 'msg-2', organization_id: 'org-1', status: 'failed', template_name: 'invoice_pdf', error_message: 'Recipient phone number not on WhatsApp', error_code: '131026', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 'msg-3', organization_id: 'org-2', status: 'failed', template_name: 'payment_receipt', error_message: 'Template parameter missing', error_code: '132000', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  ];

  const auditLogs = [
    { id: 'aud-1', organization_id: 'org-1', user_id: 'user-1', action: 'CREATE_INVOICE', entity_type: 'invoice', metadata: {}, created_at: new Date().toISOString() },
  ];

  return {
    from: (table: string) => {
      let data: any[] = [];
      if (table === 'invoices') data = [...invoices];
      else if (table === 'payments') data = [...payments];
      else if (table === 'organizations') data = [...organizations];
      else if (table === 'message_logs') data = [...messageLogs];
      else if (table === 'audit_logs') data = [...auditLogs];

      const builder: any = {
        select: (_cols?: string, opts?: { count?: 'exact' }) => {
          if (opts?.count === 'exact') {
            return Promise.resolve({ data, count: data.length, error: null });
          }
          return builder;
        },
        eq: (col: string, val: any) => {
          data = data.filter((row) => row[col] === val);
          return builder;
        },
        gt: (col: string, val: any) => {
          data = data.filter((row) => row[col] > val);
          return builder;
        },
        gte: (col: string, val: any) => {
          data = data.filter((row) => row[col] >= val);
          return builder;
        },
        lt: (col: string, val: any) => {
          data = data.filter((row) => row[col] < val);
          return builder;
        },
        lte: (col: string, val: any) => {
          data = data.filter((row) => row[col] <= val);
          return builder;
        },
        in: (col: string, vals: any[]) => {
          data = data.filter((row) => vals.includes(row[col]));
          return builder;
        },
        is: (col: string, val: any) => {
          data = data.filter((row) => row[col] === val);
          return builder;
        },
        not: (col: string, op: string, val: any) => {
          if (op === 'is' && val === null) {
            data = data.filter((row) => row[col] !== null);
          }
          return builder;
        },
        order: () => builder,
        limit: (n: number) => {
          data = data.slice(0, n);
          return builder;
        },
        single: () => Promise.resolve({ data: data[0] || null, error: null }),
        then: (resolve: (val: any) => void) => resolve({ data, count: data.length, error: null }),
      };
      return builder;
    },
  };
}

let passed = 0;
let failed = 0;

function assert(desc: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  FAIL: ${desc} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('WHATSBiLL AI MANAGEMENT TEAM — PHASE 5 VERIFICATION');
  console.log('Growth, Experimentation, Prioritization & Specialists');
  console.log('====================================================\n');

  const mockSupabase = createPhase5MockSupabase() as any;
  const context = {
    supabase: mockSupabase,
    adminUserId: 'admin-test-uid',
    adminPhone: '919876543210',
  };

  // ----------------------------------------------------
  // TEST SUITE 1: AGENT REGISTRATION
  // ----------------------------------------------------
  console.log('--- Suite 1: Phase 5 Agent Registry ---');
  const allAgents = getAllAgents();
  const phase5AgentIds = [
    'experiment_tracker',
    'sprint_prioritizer',
    'growth_executive',
    'reddit_community_agent',
    'meta_growth_agent',
    'google_seo_agent',
    'content_engine_agent',
    'lead_intelligence_agent',
    'conversion_optimizer',
    'growth_analytics_agent',
  ];

  phase5AgentIds.forEach((id) => {
    const agent = AGENT_REGISTRY[id];
    assert(`Agent [${id}] is registered in AGENT_REGISTRY`, !!agent);
    assert(`Agent [${id}] has valid category`, ['growth', 'product', 'marketing', 'governance', 'executive'].includes(agent?.category || ''));
    assert(`Agent [${id}] has allowedTools defined`, Array.isArray(agent?.allowedTools) && agent.allowedTools.length > 0);
  });

  // ----------------------------------------------------
  // TEST SUITE 2: ROUTING INTENT DISPATCH
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Router Dispatch & Specialist Selection ---');
  const queries = [
    { q: 'What growth experiments should we prioritize next?', expected: ['experiment_tracker', 'sprint_prioritizer'] },
    { q: 'Prioritize our product backlog and engineering sprint', expected: ['sprint_prioritizer'] },
    { q: 'How can we acquire customers via Reddit discussions without spam?', expected: ['reddit_community_agent'] },
    { q: 'Give me Meta and Instagram ad creative hooks for kirana shops', expected: ['meta_growth_agent'] },
    { q: 'What is our Google search and SEO keyword strategy?', expected: ['google_seo_agent'] },
    { q: 'Turn our invoice guide into a multi-channel content matrix', expected: ['content_engine_agent'] },
    { q: 'What lead segments show the highest intent for WhatsApp billing?', expected: ['lead_intelligence_agent'] },
    { q: 'Where are merchants dropping off in the onboarding conversion funnel?', expected: ['conversion_optimizer'] },
    { q: 'What is our acquisition analytics and customer funnel status?', expected: ['growth_analytics_agent'] },
    { q: 'Outline our high-level growth strategy and acquisition roadmap', expected: ['growth_executive'] },
  ];

  queries.forEach(({ q, expected }) => {
    const selected = selectRelevantAgents(q);
    const selectedIds = selected.map((a) => a.id);
    expected.forEach((expId) => {
      assert(`Query "${q.slice(0, 35)}..." routed to [${expId}]`, selectedIds.includes(expId), `Got: ${selectedIds.join(', ')}`);
    });
  });

  // ----------------------------------------------------
  // TEST SUITE 3: PHASE 5 DETERMINISTIC TOOLS
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Deterministic Tool Executions ---');

  // Tool 1: tool_get_experiments
  const expRes = await executeServerTool('tool_get_experiments', {}, context);
  assert('tool_get_experiments executes successfully', expRes.success);
  assert('tool_get_experiments returns totalExperiments >= 2', (expRes.data?.totalExperiments ?? 0) >= 2);
  assert('tool_get_experiments defines guardrail metrics on experiments', !!expRes.data?.experiments[0]?.guardrailMetrics?.length);
  assert('tool_get_experiments notes causality requirement', (expRes.data?.experiments[0]?.hypothesis || '').length > 0);

  // Tool 2: tool_calculate_sprint_priorities
  const sprintRes = await executeServerTool('tool_calculate_sprint_priorities', { methodology: 'ICE' }, context);
  assert('tool_calculate_sprint_priorities executes successfully', sprintRes.success);
  assert('tool_calculate_sprint_priorities classifies P0, P1, P2 items', !!sprintRes.data?.byPriority.P0 && !!sprintRes.data?.byPriority.P1);
  assert('tool_calculate_sprint_priorities uses deterministic formula', sprintRes.data?.methodologyUsed === 'ICE');
  assert('tool_calculate_sprint_priorities ranks highest score first in P0', (sprintRes.data?.byPriority.P0[0]?.calculatedScore ?? 0) > 0);

  // Tool 3: tool_get_acquisition_funnel
  const funnelRes = await executeServerTool('tool_get_acquisition_funnel', {}, context);
  assert('tool_get_acquisition_funnel executes successfully', funnelRes.success);
  assert('tool_get_acquisition_funnel counts verified signups (5 orgs)', funnelRes.data?.funnelStages.signups.count === 5);
  assert('tool_get_acquisition_funnel calculates activation rate', typeof funnelRes.data?.funnelStages.activatedUsers.ratePercent === 'number');
  assert('tool_get_acquisition_funnel notes incomplete attribution', funnelRes.data?.attributionStatus.includes('Incomplete') || funnelRes.data?.attributionStatus.includes('incomplete'));

  // Tool 4: tool_get_growth_opportunities
  const oppRes = await executeServerTool('tool_get_growth_opportunities', {}, context);
  assert('tool_get_growth_opportunities executes successfully', oppRes.success);
  assert('tool_get_growth_opportunities returns scored opportunities', (oppRes.data?.opportunities.length ?? 0) >= 4);
  assert('tool_get_growth_opportunities contains spam compliance notice', oppRes.data?.spamComplianceNotice.includes('SPAM') || oppRes.data?.spamComplianceNotice.includes('spam'));

  // Tool 5: tool_get_content_matrix
  const contentRes = await executeServerTool('tool_get_content_matrix', { topic: 'GST Billing on WhatsApp' }, context);
  assert('tool_get_content_matrix executes successfully', contentRes.success);
  assert('tool_get_content_matrix generates distinct platform variants', !!contentRes.data?.matrix.platformVariants.blogConcept && !!contentRes.data?.matrix.platformVariants.instagramReel);
  assert('tool_get_content_matrix includes anti-duplication confirmation', !!contentRes.data?.antiDuplicationConfirmation);

  // ----------------------------------------------------
  // TEST SUITE 4: REALITY CHECKER AUDITING
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Reality Checker Verification ---');

  // Test 4a: Flagging unmeasured marketing claims (CAC without caveat)
  const badFinding: any = {
    agentId: 'growth_analytics_agent',
    agentName: 'Growth Analytics Agent',
    category: 'growth',
    status: 'completed',
    summary: 'Analyzed CAC',
    metricsUsed: [],
    keyFindings: ['Our customer acquisition cost (CAC) is currently ₹250 per merchant.'],
    evidence: [],
  };
  const realityCheckBad = evaluateRealityCheck({
    query: 'What is our CAC?',
    specialistFindings: [badFinding],
    toolResults: { tool_get_acquisition_funnel: funnelRes },
  });
  assert('Reality Checker flags unmeasured CAC claim as unsupported assumption', realityCheckBad.unsupportedAssumptions.some((a) => a.includes('CAC')));

  // Test 4b: Flagging causality without caveat
  const badHackerFinding: any = {
    agentId: 'growth_hacker',
    agentName: 'Growth Specialist',
    category: 'growth',
    status: 'completed',
    summary: 'Analyzed retention causality',
    metricsUsed: [],
    keyFindings: ['Adding a video walkthrough will definitely cause retention to double immediately.'],
    evidence: [],
  };
  const realityCheckCausality = evaluateRealityCheck({
    query: 'Does onboarding increase retention?',
    specialistFindings: [badHackerFinding],
    toolResults: {},
  });
  assert('Reality Checker flags definitive causality claims without evidence caveat', realityCheckCausality.unsupportedAssumptions.some((a) => a.includes('Causality is not established')));

  // Test 4c: Flagging spam / automated bot suggestions
  const badRedditFinding: any = {
    agentId: 'reddit_community_agent',
    agentName: 'Reddit Community Agent',
    category: 'growth',
    status: 'completed',
    summary: 'Analyzed Reddit posting',
    metricsUsed: [],
    keyFindings: ['We should set up an auto-post bot with multiple fake accounts to mass-post links in subreddits.'],
    evidence: [],
  };
  const realityCheckSpam = evaluateRealityCheck({
    query: 'How should we post on Reddit?',
    specialistFindings: [badRedditFinding],
    toolResults: {},
  });
  assert('Reality Checker flags automated bot posting and fake accounts as ethical violation', realityCheckSpam.unsupportedAssumptions.some((a) => a.includes('automated posting') || a.includes('fake account')));

  // ----------------------------------------------------
  // TEST SUITE 5: END-TO-END ORCHESTRATOR SYNTHESIS
  // ----------------------------------------------------
  console.log('\n--- Suite 5: End-to-End Unified Executive Query ---');
  const execResult = await executeExecutiveQuery(
    'What is our growth strategy, which experiments should we run, and how should we prioritize our sprint backlog?',
    mockSupabase,
    { id: 'admin-test-uid', phone: '919876543210' }
  );

  assert('Executive orchestrator returns whatIsHappening', !!execResult.whatIsHappening);
  assert('Executive orchestrator returns why', !!execResult.why);
  assert('Executive orchestrator returns affected scope', !!execResult.affected);
  assert('Executive orchestrator returns recommendedActions with deterministic structure', execResult.recommendedActions.length > 0);
  assert('Executive orchestrator includes realityCheck with numerical audit', !!execResult.realityCheck && Array.isArray(execResult.realityCheck.numericalAudit));
  assert('Executive orchestrator includes specialistContributions for selected agents', execResult.specialistContributions.length >= 2);
  assert('Executive orchestrator returns structured experiments', Array.isArray(execResult.experiments) && execResult.experiments.length > 0);
  assert('Executive orchestrator returns prioritizedItems', Array.isArray(execResult.prioritizedItems) && execResult.prioritizedItems.length > 0);

  console.log('\n====================================================');
  console.log(`PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
