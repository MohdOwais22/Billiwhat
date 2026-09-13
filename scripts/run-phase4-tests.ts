import { AGENT_REGISTRY, selectRelevantAgents, getAllAgents } from '../lib/services/agentTeam/agentRegistry';
import {
  toolGetFinancialSummary,
  toolGetReceivablesRisk,
  toolGetSupportIssues,
  toolGetInfrastructureHealth,
  executeServerTool,
} from '../lib/services/agentTeam/toolRegistry';
import { evaluateRealityCheck } from '../lib/services/agentTeam/realityChecker';
import { executeExecutiveQuery } from '../lib/services/agentTeam/orchestrator';

// Deterministic Mock Supabase Client for Phase 4 Testing
function createPhase4MockSupabase(overrides?: {
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
    { id: 'inv-1', organization_id: 'org-1', customer_id: 'cust-1', total: 10000, status: 'paid', due_date: new Date(Date.now() - 10 * 86400000).toISOString(), created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
    { id: 'inv-2', organization_id: 'org-1', customer_id: 'cust-2', total: 25000, status: 'unpaid', due_date: new Date(Date.now() - 40 * 86400000).toISOString(), created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
    { id: 'inv-3', organization_id: 'org-2', customer_id: 'cust-3', total: 15000, status: 'partially_paid', due_date: new Date(Date.now() + 10 * 86400000).toISOString(), created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'inv-4', organization_id: 'org-2', customer_id: 'cust-2', total: 50000, status: 'overdue', due_date: new Date(Date.now() - 70 * 86400000).toISOString(), created_at: new Date(Date.now() - 75 * 86400000).toISOString() },
  ];

  const payments = overrides?.payments ?? [
    { id: 'pay-1', organization_id: 'org-1', invoice_id: 'inv-1', amount: 10000, payment_method: 'upi', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
    { id: 'pay-2', organization_id: 'org-2', invoice_id: 'inv-3', amount: 5000, payment_method: 'bank_transfer', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'pay-3', organization_id: 'org-1', invoice_id: 'inv-old', amount: 8000, payment_method: 'cash', created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
  ];

  const organizations = overrides?.organizations ?? [
    { id: 'org-1', name: 'Apex Traders', email: 'apex@test.com', phone: '919876543210', created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: 'org-2', name: 'Bharat Logistics', email: 'bharat@test.com', phone: '919876543211', created_at: new Date(Date.now() - 40 * 86400000).toISOString() },
    { id: 'org-3', name: 'Calcutta Textiles', email: 'calcutta@test.com', phone: null, created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  ];

  const messageLogs = overrides?.messageLogs ?? [
    { id: 'msg-1', organization_id: 'org-1', status: 'delivered', template_name: 'invoice_pdf', error_message: null, error_code: null, created_at: new Date().toISOString() },
    { id: 'msg-2', organization_id: 'org-1', status: 'failed', template_name: 'invoice_pdf', error_message: 'Recipient phone number not on WhatsApp', error_code: '131026', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 'msg-3', organization_id: 'org-2', status: 'failed', template_name: 'payment_receipt', error_message: 'Template parameter missing', error_code: '132000', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  ];

  const auditLogs = overrides?.auditLogs ?? [
    { id: 'aud-1', organization_id: 'org-1', user_id: 'user-1', action: 'CREATE_INVOICE', entity_type: 'invoice', metadata: {}, created_at: new Date().toISOString() },
    { id: 'aud-2', organization_id: 'org-2', user_id: 'user-2', action: 'SYSTEM_ERROR_WEBHOOK', entity_type: 'webhook', metadata: { error: 'Connection timeout to Meta Graph API' }, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  ];

  const customers = overrides?.customers ?? [
    { id: 'cust-1', organization_id: 'org-1', name: 'Retailer Alpha' },
    { id: 'cust-2', organization_id: 'org-1', name: 'Mega Corp Beta' },
    { id: 'cust-3', organization_id: 'org-2', name: 'Wholesaler Gamma' },
  ];

  const products = overrides?.products ?? [
    { id: 'prod-1', organization_id: 'org-1', name: 'Industrial Valve' },
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
        ilike: (col: string, val: any) => {
          const pattern = String(val).toLowerCase().replace(/%/g, '');
          data = data.filter((row) => String(row[col] || '').toLowerCase().includes(pattern));
          return builder;
        },
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

async function runPhase4Tests() {
  console.log('===============================================================');
  console.log('STARTING PHASE 4 OPERATIONS & FINANCE SPECIALIST AGENT SUITE');
  console.log('===============================================================');

  const mockSupabase = createPhase4MockSupabase();
  const mockContext = {
    supabase: mockSupabase,
    adminUserId: 'admin-test-uid',
    adminPhone: '919999999999',
  };

  // --------------------------------------------------------------------------
  // TEST GROUP 1: AGENT REGISTRY AUDIT FOR PHASE 4 AGENTS
  // --------------------------------------------------------------------------
  console.log('\n--- 1. PHASE 4 AGENT REGISTRY AUDIT ---');
  const allAgents = getAllAgents();
  assert(allAgents.length === 14, `All 14 agents exist in registry (Found: ${allAgents.length})`);

  // Support Responder
  const sr = AGENT_REGISTRY['support_responder'];
  assert(!!sr, 'Support Responder is registered in AGENT_REGISTRY');
  assert(sr.category === 'operations', 'Support Responder category is operations');
  assert(!sr.isEngineeringSpecialist, 'Support Responder is not an engineering specialist');
  assert(sr.allowedTools.includes('tool_get_support_issues'), 'Support Responder has tool_get_support_issues');
  assert(sr.allowedTools.includes('tool_get_operational_errors'), 'Support Responder has tool_get_operational_errors');
  assert(sr.allowedTools.includes('tool_get_whatsapp_telemetry'), 'Support Responder has tool_get_whatsapp_telemetry');
  assert(sr.systemPrompt.includes('Support ticket telemetry is not currently available'), 'Support Responder prompt mandates ticket disclaimer');

  // Finance Tracker
  const ft = AGENT_REGISTRY['finance_tracker'];
  assert(!!ft, 'Finance Tracker is registered in AGENT_REGISTRY');
  assert(ft.category === 'finance', 'Finance Tracker category is finance');
  assert(!ft.isEngineeringSpecialist, 'Finance Tracker is not an engineering specialist');
  assert(ft.allowedTools.includes('tool_get_financial_summary'), 'Finance Tracker has tool_get_financial_summary');
  assert(ft.allowedTools.includes('tool_get_receivables_risk'), 'Finance Tracker has tool_get_receivables_risk');
  assert(ft.allowedTools.includes('tool_get_customer_aging'), 'Finance Tracker has tool_get_customer_aging');
  assert(ft.systemPrompt.includes('Never let AI perform financial arithmetic'), 'Finance Tracker bans unverified calculations');
  assert(ft.systemPrompt.includes('Never fabricate revenue, profit, margin'), 'Finance Tracker explicitly bans ARR/MRR/GMV/profit');

  // Infrastructure Maintainer
  const im = AGENT_REGISTRY['infrastructure_maintainer'];
  assert(!!im, 'Infrastructure Maintainer is registered in AGENT_REGISTRY');
  assert(im.category === 'operations', 'Infrastructure Maintainer category is operations');
  assert(!im.isEngineeringSpecialist, 'Infrastructure Maintainer is not an engineering specialist');
  assert(im.allowedTools.includes('tool_get_infrastructure_health'), 'Infrastructure Maintainer has tool_get_infrastructure_health');
  assert(im.allowedTools.includes('tool_get_operational_errors'), 'Infrastructure Maintainer has tool_get_operational_errors');
  assert(im.systemPrompt.includes('OBSERVED APPLICATION ERROR from INFRASTRUCTURE HYPOTHESIS'), 'Infrastructure Maintainer separates facts and hypotheses');
  assert(im.systemPrompt.includes('Never fabricate uptime, latency, CPU, memory'), 'Infrastructure Maintainer bans fabricated host telemetry');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: INTELLIGENT ROUTER TESTS FOR PHASE 4 QUERIES
  // --------------------------------------------------------------------------
  console.log('\n--- 2. INTELLIGENT ROUTER TESTS ---');

  // Financial queries route to Finance Tracker
  const finAgents1 = selectRelevantAgents('What is our total outstanding balance and collection rate?');
  assert(finAgents1.some((a) => a.id === 'finance_tracker'), 'Finance query routes to Finance Tracker');
  assert(finAgents1.some((a) => a.id === 'analytics_reporter'), 'Finance query includes Analytics Reporter');
  assert(finAgents1.length >= 2 && finAgents1.length <= 4, `Finance query agents bounded to 2-4 (got ${finAgents1.length})`);
  assert(!finAgents1.some((a) => a.isEngineeringSpecialist), 'Finance query excludes engineering specialists');

  // Support queries route to Support Responder
  const supAgents = selectRelevantAgents('Why are customers complaining and WhatsApp messages failing?');
  assert(supAgents.some((a) => a.id === 'support_responder'), 'Support query routes to Support Responder');
  assert(supAgents.some((a) => a.id === 'feedback_synthesizer'), 'Support query includes Feedback Synthesizer');
  assert(supAgents.length >= 2 && supAgents.length <= 4, `Support query agents bounded to 2-4 (got ${supAgents.length})`);
  assert(!supAgents.some((a) => a.isEngineeringSpecialist), 'Support query excludes engineering specialists');

  // Infrastructure queries route to Infrastructure Maintainer
  const infraAgents = selectRelevantAgents('Is our infrastructure healthy, any system crash or downtime?');
  assert(infraAgents.some((a) => a.id === 'infrastructure_maintainer'), 'Infrastructure query routes to Infrastructure Maintainer');
  assert(infraAgents.some((a) => a.id === 'feedback_synthesizer'), 'Infrastructure query includes Feedback Synthesizer');
  assert(infraAgents.length >= 2 && infraAgents.length <= 4, `Infrastructure query agents bounded to 2-4 (got ${infraAgents.length})`);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: DETERMINISTIC TOOL EXECUTION TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- 3. DETERMINISTIC TOOL EXECUTION TESTS ---');

  // tool_get_financial_summary
  const finSummaryRes = await executeServerTool('tool_get_financial_summary', {}, mockContext);
  assert(finSummaryRes.success, 'tool_get_financial_summary executed successfully');
  const finData = finSummaryRes.data;
  assert(finData.billedTotal === 100000, `Billed total calculated correctly (Expected 100000, got ${finData.billedTotal})`);
  assert(finData.collectedTotal === 23000, `Collected total calculated correctly (Expected 23000, got ${finData.collectedTotal})`);
  assert(finData.outstandingTotal === 77000, `Outstanding total calculated correctly (Expected 77000, got ${finData.outstandingTotal})`);
  assert(finData.overdueTotal === 75000, `Overdue total calculated correctly (Expected 75000, got ${finData.overdueTotal})`);
  assert(finData.collectionRatePct === 23, `Collection rate % calculated correctly (Expected 23%, got ${finData.collectionRatePct}%)`);
  assert(finData.topDebtorCustomers.length > 0, 'Identified top debtor customers');
  assert(finData.topDebtorCustomers[0].customerName === 'Mega Corp Beta', 'Top debtor customer correctly identified');
  assert(finData.telemetryLimitations.includes('Revenue, profit margins, ARR/MRR'), 'Telemetry limitations documented in financial summary');

  // tool_get_receivables_risk
  const recRiskRes = await executeServerTool('tool_get_receivables_risk', {}, mockContext);
  assert(recRiskRes.success, 'tool_get_receivables_risk executed successfully');
  const recData = recRiskRes.data;
  assert(recData.totalReceivables === 85000, `Total receivables matches (Expected 85000, got ${recData.totalReceivables})`);
  assert(recData.agingBrackets.over90Days >= 0, 'Aging bracket over 90 days computed');
  assert(recData.agingBrackets.days61to90 === 50000, `Aging bracket 61-90 days computed (Expected 50000, got ${recData.agingBrackets.days61to90})`);
  assert(recData.stalledInvoiceCount === 1, `Stalled invoices (>45d) computed (Expected 1, got ${recData.stalledInvoiceCount})`);
  assert(recData.concentrationRisk.topCustomerSharePct > 0, 'Concentration risk top debtor percentage computed');
  assert(recData.riskAssessment.length > 0, 'Receivables risk assessment generated');

  // tool_get_support_issues
  const supIssuesRes = await executeServerTool('tool_get_support_issues', {}, mockContext);
  assert(supIssuesRes.success, 'tool_get_support_issues executed successfully');
  const supData = supIssuesRes.data;
  assert(supData.totalOperationalErrors === 3, `Total operational errors identified (Expected 3, got ${supData.totalOperationalErrors})`);
  assert(supData.topFailureThemes.length > 0, 'Identified top failure themes');
  assert(supData.onboardingStalledOrgs.length > 0, 'Identified onboarding stalled organizations');
  assert(supData.recommendedSupportInterventions.length > 0, 'Generated recommended support interventions');
  assert(supData.supportTelemetryNotice.includes('Support ticket telemetry is not currently available'), 'Support telemetry limitations disclaimer present');

  // tool_get_infrastructure_health
  const infraHealthRes = await executeServerTool('tool_get_infrastructure_health', {}, mockContext);
  assert(infraHealthRes.success, 'tool_get_infrastructure_health executed successfully');
  const infraData = infraHealthRes.data;
  assert(infraData.observedApplicationErrorsCount === 3, `Observed application errors count matches (Expected 3, got ${infraData.observedApplicationErrorsCount})`);
  assert(infraData.subsystemsObserved.some((s: any) => s.subsystem === 'whatsapp_cloud_api'), 'Monitored WhatsApp Cloud API subsystem');
  assert(infraData.subsystemsObserved.some((s: any) => s.subsystem === 'audit_logging'), 'Monitored Audit subsystem');
  assert(infraData.subsystemsObserved.some((s: any) => s.subsystem === 'database_query_layer'), 'Monitored Database layer');
  assert(infraData.infrastructureHypotheses.length > 0, 'Generated infrastructure hypotheses clearly labeled');
  assert(infraData.telemetryLimitations.some((t: string) => t.toLowerCase().includes('host telemetry')), 'Infrastructure telemetry limitations disclaimer present');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: REALITY CHECKER AUDIT FOR PHASE 4
  // --------------------------------------------------------------------------
  console.log('\n--- 4. REALITY CHECKER PHASE 4 AUDIT TESTS ---');

  const rcInput = {
    query: 'What is our financial health and server uptime?',
    specialistFindings: [
      {
        agentId: 'finance_tracker',
        agentName: 'Finance Tracker',
        category: 'finance' as any,
        status: 'success' as any,
        summary: 'Financial audit completed.',
        keyFindings: [
          'Total Billed: ₹1,00,000 across 4 invoices',
          'Total Collected: ₹15,000 (15% rate)',
          'Net profit was 25% this month', // Should trigger Reality Checker unsupported assumption!
        ],
        evidence: [],
        metricsUsed: {},
        recommendedActions: [],
        executionTimeMs: 10,
      },
      {
        agentId: 'support_responder',
        agentName: 'Support Responder',
        category: 'operations' as any,
        status: 'success' as any,
        summary: 'Support audit completed.',
        keyFindings: [
          'Support ticket volume increased by 40%', // Should trigger Reality Checker unsupported assumption!
        ],
        evidence: [],
        metricsUsed: {},
        recommendedActions: [],
        executionTimeMs: 10,
      },
      {
        agentId: 'infrastructure_maintainer',
        agentName: 'Infrastructure Maintainer',
        category: 'operations' as any,
        status: 'success' as any,
        summary: 'Infrastructure audit completed.',
        keyFindings: [
          'Database crash occurred due to server is down', // Should trigger Reality Checker unsupported assumption!
        ],
        evidence: [],
        metricsUsed: {},
        recommendedActions: [],
        executionTimeMs: 10,
      },
    ],
    toolResults: {
      tool_get_financial_summary: finSummaryRes,
      tool_get_receivables_risk: recRiskRes,
      tool_get_support_issues: supIssuesRes,
      tool_get_infrastructure_health: infraHealthRes,
    },
  };

  const rcReport = evaluateRealityCheck(rcInput);
  assert(rcReport.numericalAudit.some((a) => a.sourceTool === 'tool_get_financial_summary'), 'Reality Checker audited financial summary figures');
  assert(rcReport.unsupportedAssumptions.some((u) => u.includes('[Finance Tracker] referenced profit')), 'Reality Checker flagged unsupported profit metric');
  assert(rcReport.unsupportedAssumptions.some((u) => u.includes('[Support Responder] referenced support tickets')), 'Reality Checker flagged unsupported support tickets');
  assert(rcReport.unsupportedAssumptions.some((u) => u.includes('[Infrastructure Maintainer] asserted host hardware outage')), 'Reality Checker flagged unsupported host outage assumption');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: EXECUTIVE ORCHESTRATOR END-TO-END EXECUTION FOR PHASE 4
  // --------------------------------------------------------------------------
  console.log('\n--- 5. EXECUTIVE ORCHESTRATOR END-TO-END PIPELINE ---');

  // 1. Finance Query End-to-End
  console.log('\n* Testing Finance Query Execution:');
  const finExecRes = await executeExecutiveQuery(
    'What is our outstanding receivables balance and collection rate?',
    mockSupabase,
    { id: 'admin-test-user', phone: '919999999999' }
  );

  assert(!!finExecRes.whatIsHappening, 'Executive whatIsHappening is populated');
  assert(!!finExecRes.why, 'Executive why is populated');
  assert(!!finExecRes.severity, 'Executive severity is populated');
  assert(finExecRes.evidence.length > 0, 'Executive evidence is populated');
  assert(finExecRes.specialistContributions.length >= 2, 'Multiple specialists contributed');
  
  const ftContrib = finExecRes.specialistContributions.find((c) => c.agentId === 'finance_tracker');
  assert(!!ftContrib, 'Finance Tracker contributed to Executive response');
  assert(!!ftContrib?.structure?.FINANCIAL_SNAPSHOT, 'Finance Tracker structure has FINANCIAL_SNAPSHOT');
  assert(!!ftContrib?.structure?.BILLED, 'Finance Tracker structure has BILLED');
  assert(!!ftContrib?.structure?.COLLECTED, 'Finance Tracker structure has COLLECTED');
  assert(!!ftContrib?.structure?.OUTSTANDING, 'Finance Tracker structure has OUTSTANDING');
  assert(!!ftContrib?.structure?.OVERDUE, 'Finance Tracker structure has OVERDUE');
  assert(!!ftContrib?.structure?.AGING, 'Finance Tracker structure has AGING');
  assert(!!ftContrib?.structure?.COLLECTION_TREND, 'Finance Tracker structure has COLLECTION_TREND');
  assert(!!ftContrib?.structure?.TOP_FINANCIAL_RISKS, 'Finance Tracker structure has TOP_FINANCIAL_RISKS');
  assert(!!ftContrib?.structure?.RECOMMENDED_ACTIONS, 'Finance Tracker structure has RECOMMENDED_ACTIONS');
  assert(!!ftContrib?.structure?.TELEMETRY_LIMITATIONS, 'Finance Tracker structure has TELEMETRY_LIMITATIONS');

  // 2. Support Query End-to-End
  console.log('\n* Testing Support Query Execution:');
  const supExecRes = await executeExecutiveQuery(
    'Why are WhatsApp messages failing and merchants having support friction?',
    mockSupabase,
    { id: 'admin-test-user', phone: '919999999999' }
  );

  const srContrib = supExecRes.specialistContributions.find((c) => c.agentId === 'support_responder');
  assert(!!srContrib, 'Support Responder contributed to Executive response');
  assert(!!srContrib?.structure?.SUPPORT_SUMMARY, 'Support Responder structure has SUPPORT_SUMMARY');
  assert(!!srContrib?.structure?.TOP_ISSUES, 'Support Responder structure has TOP_ISSUES');
  assert(!!srContrib?.structure?.AFFECTED_AREA, 'Support Responder structure has AFFECTED_AREA');
  assert(!!srContrib?.structure?.EVIDENCE, 'Support Responder structure has EVIDENCE');
  assert(!!srContrib?.structure?.SEVERITY, 'Support Responder structure has SEVERITY');
  assert(!!srContrib?.structure?.LIKELY_CAUSE, 'Support Responder structure has LIKELY_CAUSE');
  assert(!!srContrib?.structure?.RECOMMENDED_RESPONSE, 'Support Responder structure has RECOMMENDED_RESPONSE');
  assert(!!srContrib?.structure?.TELEMETRY_LIMITATIONS, 'Support Responder structure has TELEMETRY_LIMITATIONS');

  // 3. Infrastructure Query End-to-End
  console.log('\n* Testing Infrastructure Query Execution:');
  const infraExecRes = await executeExecutiveQuery(
    'What is our infrastructure health and subsystem status?',
    mockSupabase,
    { id: 'admin-test-user', phone: '919999999999' }
  );

  const imContrib = infraExecRes.specialistContributions.find((c) => c.agentId === 'infrastructure_maintainer');
  assert(!!imContrib, 'Infrastructure Maintainer contributed to Executive response');
  assert(!!imContrib?.structure?.SYSTEM_HEALTH, 'Infrastructure Maintainer structure has SYSTEM_HEALTH');
  assert(!!imContrib?.structure?.OBSERVED_FAILURES, 'Infrastructure Maintainer structure has OBSERVED_FAILURES');
  assert(!!imContrib?.structure?.ERROR_PATTERNS, 'Infrastructure Maintainer structure has ERROR_PATTERNS');
  assert(!!imContrib?.structure?.AFFECTED_COMPONENT, 'Infrastructure Maintainer structure has AFFECTED_COMPONENT');
  assert(!!imContrib?.structure?.EVIDENCE, 'Infrastructure Maintainer structure has EVIDENCE');
  assert(!!imContrib?.structure?.SEVERITY, 'Infrastructure Maintainer structure has SEVERITY');
  assert(!!imContrib?.structure?.LIKELY_CAUSE, 'Infrastructure Maintainer structure has LIKELY_CAUSE');
  assert(!!imContrib?.structure?.INFRASTRUCTURE_HYPOTHESIS, 'Infrastructure Maintainer structure has INFRASTRUCTURE_HYPOTHESIS');
  assert(!!imContrib?.structure?.RECOMMENDED_ACTION, 'Infrastructure Maintainer structure has RECOMMENDED_ACTION');
  assert(!!imContrib?.structure?.TELEMETRY_LIMITATIONS, 'Infrastructure Maintainer structure has TELEMETRY_LIMITATIONS');

  // 4. Missing / Unmeasurable Metrics Query
  console.log('\n* Testing Unmeasurable Hardware / Tickets / Profit Query:');
  const unmeasExecRes = await executeExecutiveQuery(
    'Show me CPU usage, server uptime, support ticket volume, and company profit',
    mockSupabase,
    { id: 'admin-test-user', phone: '919999999999' }
  );

  assert(!!unmeasExecRes.unknownOrMissingData && unmeasExecRes.unknownOrMissingData.length >= 3, 'Executive response populated unknownOrMissingData for unmeasurable hardware, tickets, and profit');
  assert(unmeasExecRes.unknownOrMissingData.some((u) => u.includes('Support ticket telemetry')), 'unknownOrMissingData includes support ticket disclaimer');
  assert(unmeasExecRes.unknownOrMissingData.some((u) => u.includes('Accounting profit')), 'unknownOrMissingData includes accounting profit disclaimer');
  assert(unmeasExecRes.unknownOrMissingData.some((u) => u.includes('Host hardware telemetry')), 'unknownOrMissingData includes host hardware disclaimer');

  console.log('\n===============================================================');
  console.log(`PHASE 4 TEST SUMMARY: TOTAL: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log(`FINAL RESULT: ${failedCount === 0 ? 'ALL PHASE 4 TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('===============================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
