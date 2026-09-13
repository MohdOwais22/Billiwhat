import { AGENT_REGISTRY, selectRelevantAgents, getAllAgents } from '../lib/services/agentTeam/agentRegistry';
import {
  toolGetPlatformMetrics,
  toolGetPeriodComparison,
  toolGetOperationalErrors,
  toolGetMarketIntelligence,
  toolGetActivationFunnel,
  toolGetFeatureAdoption,
  toolGetWhatsAppTelemetry,
  toolGetCustomerAging,
  executeServerTool,
} from '../lib/services/agentTeam/toolRegistry';
import { evaluateRealityCheck } from '../lib/services/agentTeam/realityChecker';
import { executeExecutiveQuery } from '../lib/services/agentTeam/orchestrator';

// Mock Supabase client for deterministic testing
function createMockSupabase(overrides?: {
  invoices?: any[];
  payments?: any[];
  organizations?: any[];
  messageLogs?: any[];
  auditLogs?: any[];
  customers?: any[];
  products?: any[];
  gstProfiles?: any[];
}) {
  const invoices = overrides?.invoices ?? [
    { id: 'inv-1', organization_id: 'org-1', total: 1000, status: 'paid', created_at: new Date().toISOString() },
    { id: 'inv-2', organization_id: 'org-1', total: 2000, status: 'unpaid', created_at: new Date().toISOString() },
    { id: 'inv-3', organization_id: 'org-2', total: 1500, status: 'unpaid', created_at: new Date(Date.now() - 40 * 86400000).toISOString() },
  ];

  const payments = overrides?.payments ?? [
    { id: 'pay-1', organization_id: 'org-1', invoice_id: 'inv-1', amount: 1000, payment_method: 'upi', created_at: new Date().toISOString() },
  ];

  const organizations = overrides?.organizations ?? [
    { id: 'org-1', name: 'Alpha Traders', email: 'alpha@test.com', phone: '919876543210', created_at: new Date().toISOString() },
    { id: 'org-2', name: 'Beta Supplies', email: 'beta@test.com', phone: '919876543211', created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
    { id: 'org-3', name: 'Gamma Wholesalers', email: 'gamma@test.com', phone: '919876543212', created_at: new Date().toISOString() },
  ];

  const messageLogs = overrides?.messageLogs ?? [
    { id: 'msg-1', organization_id: 'org-1', status: 'delivered', template_name: 'invoice_pdf', error_message: null, error_code: null, created_at: new Date().toISOString() },
    { id: 'msg-2', organization_id: 'org-1', status: 'failed', template_name: 'invoice_pdf', error_message: 'Recipient phone number not on WhatsApp', error_code: '131026', created_at: new Date().toISOString() },
  ];

  const auditLogs = overrides?.auditLogs ?? [
    { id: 'aud-1', organization_id: 'org-1', user_id: 'user-1', action: 'CREATE_INVOICE', entity_type: 'invoice', metadata: {}, created_at: new Date().toISOString() },
  ];

  const customers = overrides?.customers ?? [
    { id: 'cust-1', organization_id: 'org-1', name: 'Retailer A' },
  ];

  const products = overrides?.products ?? [
    { id: 'prod-1', organization_id: 'org-1', name: 'Item X' },
  ];

  const gstProfiles = overrides?.gstProfiles ?? [
    { id: 'gst-1', organization_id: 'org-1', gstin: '27AAAAA0000A1Z5' },
  ];

  return {
    from: (table: string) => {
      let data: any[] = [];
      if (table === 'invoices') data = [...invoices];
      else if (table === 'payments') data = [...payments];
      else if (table === 'organizations') data = [...organizations];
      else if (table === 'message_logs') data = [...messageLogs];
      else if (table === 'audit_logs') data = [...auditLogs];
      else if (table === 'customers') data = [...customers];
      else if (table === 'products') data = [...products];
      else if (table === 'gst_profiles') data = [...gstProfiles];

      const builder: any = {
        select: (_cols?: string) => builder,
        eq: (col: string, val: any) => {
          data = data.filter((row) => row[col] === val);
          return builder;
        },
        neq: (col: string, val: any) => {
          data = data.filter((row) => row[col] !== val);
          return builder;
        },
        gte: (col: string, val: any) => {
          data = data.filter((row) => new Date(row[col]) >= new Date(val));
          return builder;
        },
        ilike: (_col: string, _val: any) => builder,
        in: (col: string, vals: any[]) => {
          data = data.filter((row) => vals.includes(row[col]));
          return builder;
        },
        order: (_col: string, _opts?: any) => builder,
        limit: (n: number) => {
          data = data.slice(0, n);
          return builder;
        },
        single: () => Promise.resolve({ data: data[0] || null, error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        then: (onfulfilled: any) => Promise.resolve({ data, error: null }).then(onfulfilled),
      };
      return builder;
    },
  } as any;
}

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`[PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runAllAgentTests() {
  console.log('===============================================================');
  console.log('STARTING PHASE 3 BUSINESS INTELLIGENCE AGENT SUITE');
  console.log('===============================================================');

  const mockSupabase = createMockSupabase();
  const mockContext = {
    supabase: mockSupabase,
    adminUserId: 'admin-test-uid',
    adminPhone: '919999999999',
  };

  // --------------------------------------------------------------------------
  // TEST GROUP 1: AGENT REGISTRY AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- 1. AGENT REGISTRY AUDIT ---');
  const allAgents = getAllAgents();
  assert(allAgents.length === 14, 'All 14 agents exist in registry');

  const ar = AGENT_REGISTRY['analytics_reporter'];
  assert(!!ar, 'Analytics Reporter is registered');
  assert(ar.category === 'business', 'Analytics Reporter is category: business');
  assert(!ar.isEngineeringSpecialist, 'Analytics Reporter is not an engineering specialist');
  assert(ar.allowedTools.includes('tool_get_period_comparison'), 'Analytics Reporter has tool_get_period_comparison');
  assert(ar.systemPrompt.includes('PROHIBITION ON FAKE METRICS'), 'Analytics Reporter prompt strictly bans fake metrics');

  const pm = AGENT_REGISTRY['product_manager'];
  assert(!!pm, 'Product Manager is registered');
  assert(pm.allowedTools.includes('tool_get_feature_adoption'), 'Product Manager has tool_get_feature_adoption');
  assert(pm.systemPrompt.includes('MANDATORY OUTPUT STRUCTURE'), 'Product Manager enforces structured contract');

  const gh = AGENT_REGISTRY['growth_hacker'];
  assert(!!gh, 'Growth Hacker is registered');
  assert(gh.allowedTools.includes('tool_get_activation_funnel'), 'Growth Hacker has tool_get_activation_funnel');
  assert(gh.systemPrompt.includes('Causality is not established'), 'Growth Hacker requires causality disclaimer');

  const fs = AGENT_REGISTRY['feedback_synthesizer'];
  assert(!!fs, 'Feedback Synthesizer is registered');
  assert(fs.allowedTools.includes('tool_get_operational_errors'), 'Feedback Synthesizer has tool_get_operational_errors');

  const tr = AGENT_REGISTRY['trend_researcher'];
  assert(!!tr, 'Trend Researcher is registered');
  assert(tr.allowedTools.includes('tool_get_market_intelligence'), 'Trend Researcher has tool_get_market_intelligence');
  assert(tr.systemPrompt.includes('SOURCE: Official agency'), 'Trend Researcher mandates source attribution');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: INTELLIGENT ROUTER (selectRelevantAgents)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. INTELLIGENT ROUTER TESTS ---');

  const invoiceAgents = selectRelevantAgents('What happened to invoice volume this week?');
  const invoiceIds = invoiceAgents.map((a) => a.id);
  assert(invoiceIds.includes('analytics_reporter'), 'Invoice query routes to Analytics Reporter');
  assert(!invoiceIds.includes('backend_architect'), 'Invoice query excludes Backend Architect');
  assert(!invoiceIds.includes('ai_engineer'), 'Invoice query excludes AI Engineer');

  const dropAgents = selectRelevantAgents('Why are merchants dropping during onboarding?');
  const dropIds = dropAgents.map((a) => a.id);
  assert(dropIds.includes('growth_hacker'), 'Onboarding drop query routes to Growth Hacker');
  assert(dropIds.includes('product_manager'), 'Onboarding drop query routes to Product Manager');
  assert(dropIds.includes('analytics_reporter'), 'Onboarding drop query routes to Analytics Reporter');
  assert(dropIds.includes('feedback_synthesizer'), 'Onboarding drop query routes to Feedback Synthesizer');

  const marketAgents = selectRelevantAgents('What are competitors like Vyapar doing?');
  const marketIds = marketAgents.map((a) => a.id);
  assert(marketIds.includes('trend_researcher'), 'Competitor query routes to Trend Researcher');

  const errorAgents = selectRelevantAgents('What recurring errors and failed messages are happening?');
  const errorIds = errorAgents.map((a) => a.id);
  assert(errorIds.includes('feedback_synthesizer'), 'Error query routes to Feedback Synthesizer');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: DETERMINISTIC PHASE 3 TOOLS
  // --------------------------------------------------------------------------
  console.log('\n--- 3. DETERMINISTIC TOOL EXECUTION TESTS ---');

  // Tool: Period Comparison
  const periodRes = await toolGetPeriodComparison.execute({ windowDays: 30 }, mockContext);
  assert(periodRes.success, 'tool_get_period_comparison executed successfully');
  assert(periodRes.data.currentWindowDays === 30, 'Period comparison window is 30 days');
  assert(typeof periodRes.data.deltas.invoiceCountDeltaPercent === 'number', 'Calculated invoice delta %');
  assert(typeof periodRes.data.deltas.billedValueDeltaPercent === 'number', 'Calculated billed delta %');

  // Tool: Operational Errors
  const opErrorRes = await toolGetOperationalErrors.execute({}, mockContext);
  assert(opErrorRes.success, 'tool_get_operational_errors executed successfully');
  assert(opErrorRes.data.whatsappFailureCount === 1, 'Correctly identified 1 failed WhatsApp message');
  assert(opErrorRes.data.topProblems.length > 0, 'Categorized top operational problem');
  assert(
    opErrorRes.data.topProblems[0].problem.includes('Recipient phone number not on WhatsApp'),
    'Identified specific WhatsApp error code/message'
  );

  // Tool: Market Intelligence
  const marketRes = await toolGetMarketIntelligence.execute({ category: 'all' }, mockContext);
  assert(marketRes.success, 'tool_get_market_intelligence executed successfully');
  assert(marketRes.data.verifiedClaimsCount > 0, 'Retrieved verified external claims');
  const sampleClaim = marketRes.data.claims[0];
  assert(!!sampleClaim.source && !!sampleClaim.date && !!sampleClaim.claim, 'Claim has SOURCE, DATE, CLAIM');
  assert(
    marketRes.data.internalComparisonNotice.includes('EXTERNAL MARKET INTELLIGENCE'),
    'Separation notice present'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: REALITY CHECKER AUDITING
  // --------------------------------------------------------------------------
  console.log('\n--- 4. REALITY CHECKER AUDIT TESTS ---');

  const cleanReport = evaluateRealityCheck({
    query: 'How is the platform performing?',
    specialistFindings: [
      {
        agentId: 'analytics_reporter',
        agentName: 'Analytics Reporter',
        category: 'business',
        status: 'success',
        summary: 'Platform summary',
        keyFindings: ['Total billed is ₹3,000 across 2 invoices', '1 active organization'],
        evidence: ['Billed: ₹3,000', 'Collected: ₹1,000'],
        metricsUsed: {},
        recommendedActions: [],
        executionTimeMs: 10,
      },
    ],
    toolResults: {
      tool_get_platform_metrics: {
        toolName: 'tool_get_platform_metrics',
        success: true,
        data: {
          organizationCount: 3,
          activeOrganizationCount: 1,
          dormantOrganizationCount: 2,
          invoiceCount: 2,
          billedValue: 3000,
          collectedValue: 1000,
          outstandingReceivables: 2000,
          userCount: 3,
          customerCount: 1,
          productCount: 1,
        },
        executionTimeMs: 12,
        telemetryEvidence: ['Billed: ₹3,000'],
      },
    },
    platformMetrics: {
      organizationCount: 3,
      activeOrganizationCount: 1,
      dormantOrganizationCount: 2,
      invoiceCount: 2,
      billedValue: 3000,
      collectedValue: 1000,
      outstandingReceivables: 2000,
      userCount: 3,
      customerCount: 1,
      productCount: 1,
    },
  });

  assert(cleanReport.numericalAudit.length > 0, 'Reality Checker audited platform metrics');
  assert(!cleanReport.sampleSizeAssessment.isAdequate, 'Flagged low sample size (< 5 orgs) as early-stage');

  // Test: Fake Metric Flagging
  const fakeMetricReport = evaluateRealityCheck({
    query: 'What is our CAC and LTV?',
    specialistFindings: [
      {
        agentId: 'growth_hacker',
        agentName: 'Growth Hacker',
        category: 'business',
        status: 'success',
        summary: 'Growth analysis',
        keyFindings: ['Current CAC is ₹500 per merchant', 'We observe strong product retention'],
        evidence: [],
        metricsUsed: {},
        recommendedActions: [],
        executionTimeMs: 10,
      },
    ],
    toolResults: {},
    platformMetrics: {
      organizationCount: 3,
      activeOrganizationCount: 1,
      dormantOrganizationCount: 2,
      invoiceCount: 2,
      billedValue: 3000,
      collectedValue: 1000,
      outstandingReceivables: 2000,
      userCount: 3,
      customerCount: 1,
      productCount: 1,
    },
  });

  const hasCacAssumption = fakeMetricReport.unsupportedAssumptions.some((a) => a.includes('CAC'));
  assert(hasCacAssumption, 'Reality Checker flagged unsupported CAC metric');

  // Test: Growth Hacker Causation Flagging
  const causationReport = evaluateRealityCheck({
    query: 'Does WhatsApp drive retention?',
    specialistFindings: [
      {
        agentId: 'growth_hacker',
        agentName: 'Growth Hacker',
        category: 'business',
        status: 'success',
        summary: 'Analysis',
        keyFindings: ['WhatsApp notification usage causes higher merchant activity'],
        evidence: [],
        metricsUsed: {},
        recommendedActions: [],
        executionTimeMs: 10,
      },
    ],
    toolResults: {},
  });

  const hasCausalityAssumption = causationReport.unsupportedAssumptions.some((a) =>
    a.includes('Causality is not established')
  );
  assert(hasCausalityAssumption, 'Reality Checker caught Growth Hacker causality claim without disclaimer');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: EXECUTIVE ORCHESTRATOR PIPELINE
  // --------------------------------------------------------------------------
  console.log('\n--- 5. EXECUTIVE ORCHESTRATOR END-TO-END PIPELINE ---');

  const execRes = await executeExecutiveQuery(
    'Why are merchants dropping during onboarding and what is our invoice volume?',
    mockSupabase,
    { id: 'admin-test-user', phone: '919999999999' }
  );

  assert(!!execRes.whatIsHappening, 'Generated executive whatIsHappening');
  assert(!!execRes.why, 'Generated executive why');
  assert(!!execRes.affected, 'Generated executive affected');
  assert(!!execRes.severity, 'Generated executive severity');
  assert(!!execRes.recommendedAction, 'Generated executive recommendedAction');
  assert(execRes.evidence.length > 0, 'Returned verified evidence items');
  assert(execRes.specialistContributions.length >= 2, 'Generated multiple specialist contributions');

  // Check structured contribution for Growth Hacker
  const ghContrib = execRes.specialistContributions.find((s) => s.agentId === 'growth_hacker');
  assert(!!ghContrib, 'Growth Hacker contributed to synthesis');
  assert(!!ghContrib?.structure?.CAUSALITY_STATUS, 'Growth Hacker contribution includes CAUSALITY_STATUS');

  // Check structured contribution for Product Manager
  const pmContrib = execRes.specialistContributions.find((s) => s.agentId === 'product_manager');
  assert(!!pmContrib, 'Product Manager contributed to synthesis');
  assert(!!pmContrib?.structure?.CURRENT_STATE, 'Product Manager contribution includes CURRENT_STATE');
  assert(!!pmContrib?.structure?.USER_FRICTION, 'Product Manager contribution includes USER_FRICTION');

  // Check Reality Check
  assert(!!execRes.realityCheck, 'Executive Response includes Reality Check');

  // Check Trace
  assert(execRes.trace.toolsExecuted.length > 0, 'Trace recorded tools executed');
  assert(execRes.trace.auditLogged, 'Trace marked audit log as recorded');

  // Check Market Intelligence Query
  const marketExecRes = await executeExecutiveQuery(
    'What are competitors and GST regulatory mandates for WhatsBill?',
    mockSupabase,
    { id: 'admin-test-user', phone: '919999999999' }
  );

  assert(
    !!marketExecRes.marketIntelligence && marketExecRes.marketIntelligence.length > 0,
    'Executive Response populated marketIntelligence from Trend Researcher'
  );
  assert(
    marketExecRes.marketIntelligence[0].source.length > 0,
    'Market Intelligence claim includes verified source'
  );

  // Check Unmeasured Metric Query (e.g. CAC / LTV)
  const unmeasuredRes = await executeExecutiveQuery(
    'Show me CAC, LTV and customer churn rate',
    mockSupabase,
    { id: 'admin-test-user', phone: '919999999999' }
  );

  assert(
    !!unmeasuredRes.unknownOrMissingData && unmeasuredRes.unknownOrMissingData.length > 0,
    'Executive Response populated unknownOrMissingData for unmeasurable metrics'
  );

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: TOTAL: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log(`FINAL RESULT: ${failedCount === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('===============================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllAgentTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
