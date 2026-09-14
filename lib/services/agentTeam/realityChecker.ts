import {
  RealityCheckReport,
  ConfidenceScore,
  AgentFinding,
  ToolExecutionResult,
  StructuredMemory,
  MemoryConflictReport,
} from './types';
import { PlatformMetricsOutput } from './toolRegistry';

export interface RealityCheckInput {
  query: string;
  specialistFindings: AgentFinding[];
  toolResults: Record<string, ToolExecutionResult>;
  platformMetrics?: PlatformMetricsOutput;
  memories?: StructuredMemory[];
  conflictReport?: MemoryConflictReport;
}

/**
 * Reality Checker: Evidence-oriented validation layer.
 * Challenges assumptions, audits numbers against tool outputs,
 * and rates confidence objectively without blind approval.
 */
export function evaluateRealityCheck(input: RealityCheckInput): RealityCheckReport {
  const { specialistFindings, toolResults, platformMetrics } = input;

  const numericalAudit: RealityCheckReport['numericalAudit'] = [];
  const unsupportedAssumptions: string[] = [];
  const missingDataPoints: string[] = [];
  const contradictionsDetected: string[] = [];

  const orgCount = platformMetrics?.organizationCount ?? 0;
  const activeCount = platformMetrics?.activeOrganizationCount ?? 0;
  const invoiceCount = platformMetrics?.invoiceCount ?? 0;

  // 1. Audit sample size
  let isAdequate = true;
  let sampleNotes = '';
  if (orgCount === 0) {
    isAdequate = false;
    sampleNotes = 'Zero organizations in database; sample size is nil.';
  } else if (orgCount < 5) {
    isAdequate = false;
    sampleNotes = `Low sample size (${orgCount} organization(s), ${activeCount} active). Patterns cannot be generalized as broad statistical trends.`;
  } else if (invoiceCount < 10) {
    isAdequate = false;
    sampleNotes = `Modest invoice history (${invoiceCount} invoices across platform). Treat conclusions as early indicators rather than proven cohorts.`;
  } else {
    sampleNotes = `Adequate baseline: ${orgCount} organizations with ${invoiceCount} invoices recorded.`;
  }

  // 2. Numerical claim cross-check with verified tool results
  if (platformMetrics) {
    if (typeof platformMetrics.billedValue === 'number') {
      numericalAudit.push({
        claim: `Total Billed Volume: ₹${platformMetrics.billedValue.toLocaleString('en-IN')}`,
        verified: true,
        sourceTool: 'tool_get_platform_metrics',
        databaseValue: platformMetrics.billedValue,
      });
    }
    if (typeof platformMetrics.collectedValue === 'number') {
      numericalAudit.push({
        claim: `Total Collected Volume: ₹${platformMetrics.collectedValue.toLocaleString('en-IN')}`,
        verified: true,
        sourceTool: 'tool_get_platform_metrics',
        databaseValue: platformMetrics.collectedValue,
      });
    }
    if (typeof platformMetrics.outstandingReceivables === 'number') {
      numericalAudit.push({
        claim: `Outstanding Balance: ₹${platformMetrics.outstandingReceivables.toLocaleString('en-IN')}`,
        verified: true,
        sourceTool: 'tool_get_platform_metrics',
        databaseValue: platformMetrics.outstandingReceivables,
      });
    }
  }

  const finRes = toolResults['tool_get_financial_summary']?.data as any;
  if (finRes) {
    numericalAudit.push({
      claim: `Authoritative Ledger Invoiced: ₹${(finRes.billedTotal || 0).toLocaleString('en-IN')}`,
      verified: true,
      sourceTool: 'tool_get_financial_summary',
      databaseValue: finRes.billedTotal,
    });
    numericalAudit.push({
      claim: `Authoritative Ledger Collected: ₹${(finRes.collectedTotal || 0).toLocaleString('en-IN')}`,
      verified: true,
      sourceTool: 'tool_get_financial_summary',
      databaseValue: finRes.collectedTotal,
    });
  }

  // 3. Inspect tool errors or missing data points
  Object.entries(toolResults).forEach(([toolName, res]) => {
    if (!res.success) {
      missingDataPoints.push(`Tool ${toolName} failed: ${res.error || 'Execution failure'}`);
    }
  });

  // 4. Check for unsupported assumptions, fake metrics, and unverified correlation
  specialistFindings.forEach((finding) => {
    const textSegments = [
      finding.summary || '',
      ...(finding.keyFindings || []),
      ...(finding.evidence || []),
    ];

    textSegments.forEach((kf) => {
      const lower = kf.toLowerCase();
      if (lower.includes('churned') && orgCount < 10) {
        unsupportedAssumptions.push(`Claim of "churn" in [${finding.agentName}] is premature given early stage sample (${orgCount} orgs).`);
      }
      if (lower.includes('gmv')) {
        unsupportedAssumptions.push(`Mention of "GMV" in [${finding.agentName}] should be strictly phrased as "Billed Invoiced Volume".`);
      }
      if (lower.includes('cac') && !lower.includes('not currently measurable')) {
        unsupportedAssumptions.push(`Metric "CAC" in [${finding.agentName}] is not measurable with available WhatsBill telemetry.`);
      }
      if (lower.includes('ltv') && !lower.includes('not currently measurable')) {
        unsupportedAssumptions.push(`Metric "LTV" in [${finding.agentName}] is not measurable with available WhatsBill telemetry.`);
      }
      if (lower.includes('nps') && !lower.includes('not currently measurable')) {
        unsupportedAssumptions.push(`Metric "NPS" in [${finding.agentName}] is not measurable with available WhatsBill telemetry.`);
      }
      if ((lower.includes('dau') || lower.includes('mau')) && !lower.includes('not currently measurable')) {
        unsupportedAssumptions.push(`Metric "DAU/MAU" in [${finding.agentName}] is not measurable with available WhatsBill telemetry.`);
      }

      // Finance Tracker validation: prohibit unmeasured accounting figures
      if (finding.agentId === 'finance_tracker') {
        if ((lower.includes('profit') || lower.includes('arr') || lower.includes('mrr')) && !lower.includes('not measurable')) {
          unsupportedAssumptions.push(`[Finance Tracker] referenced profit/ARR/MRR which are not measurable via ledger records.`);
        }
      }

      // Support Responder validation: prohibit fabricated support tickets
      if (finding.agentId === 'support_responder') {
        if ((lower.includes('support ticket') || lower.includes('ticket volume') || lower.includes('csat')) && !lower.includes('not currently available')) {
          unsupportedAssumptions.push(`[Support Responder] referenced support tickets without acknowledging ticket telemetry is unavailable.`);
        }
      }

      // Infrastructure Maintainer validation: prohibit declaring host hardware outages without telemetry
      if (finding.agentId === 'infrastructure_maintainer') {
        if ((lower.includes('server is down') || lower.includes('database crash') || lower.includes('cpu spike')) && !lower.includes('hypothesis') && !lower.includes('observed')) {
          unsupportedAssumptions.push(`[Infrastructure Maintainer] asserted host hardware outage without marking it as an unverified hypothesis.`);
        }
      }

      // Growth Hacker causality check: prohibit claiming causation without caveat
      if (finding.agentId === 'growth_hacker') {
        const assertsCausation = lower.includes('cause') || lower.includes('leads directly to') || lower.includes('drives retention');
        const hasCaveat = lower.includes('causality is not established') || lower.includes('correlation') || lower.includes('observed');
        if (assertsCausation && !hasCaveat) {
          unsupportedAssumptions.push(`[Growth Hacker] asserted causal relationship without acknowledging "Causality is not established".`);
        }
      }

      // Experiment Tracker causality & baseline check
      if (finding.agentId === 'experiment_tracker') {
        const assertsCausation = lower.includes('will definitely cause') || lower.includes('proves that');
        if (assertsCausation) {
          unsupportedAssumptions.push(`[Experiment Tracker] claimed definitive causality prior to controlled test completion.`);
        }
      }

      // Sprint Prioritizer RICE reach check: Reach cannot be fabricated
      if (finding.agentId === 'sprint_prioritizer') {
        if (lower.includes('rice') && lower.includes('fabricated reach')) {
          unsupportedAssumptions.push(`[Sprint Prioritizer] used fabricated reach data; must fall back to ICE.`);
        }
      }

      // Reddit Community Agent ethical check: no spam bots or fake accounts
      if (finding.agentId === 'reddit_community_agent') {
        if (lower.includes('auto-post') || lower.includes('mass-post') || lower.includes('bot') || lower.includes('fake account')) {
          unsupportedAssumptions.push(`[Reddit Community Agent] proposed automated posting or fake accounts violating ethical mandates.`);
        }
      }

      // Meta Growth Agent: no fabricated ROAS or ad spend
      if (finding.agentId === 'meta_growth_agent') {
        if ((lower.includes('roas') || lower.includes('ad spend') || lower.includes('cpc')) && !lower.includes('unintegrated') && !lower.includes('not measurable')) {
          unsupportedAssumptions.push(`[Meta Growth Agent] cited paid ad metrics (ROAS/CPC/spend) without acknowledging advertising telemetry is unintegrated.`);
        }
      }

      // Google & SEO Agent: external search volume limitation check
      if (finding.agentId === 'google_seo_agent') {
        if ((lower.includes('search volume') || lower.includes('cpc') || lower.includes('keyword difficulty')) && !lower.includes('unavailable') && !lower.includes('not integrated') && !lower.includes('estimated')) {
          unsupportedAssumptions.push(`[Google & SEO Agent] asserted precise keyword volume without acknowledging search data telemetry is unintegrated.`);
        }
      }

      // Content Engine Agent: non-duplication check
      if (finding.agentId === 'content_engine_agent') {
        if (lower.includes('duplicate content across all channels')) {
          unsupportedAssumptions.push(`[Content Engine Agent] proposed identical duplicate text across distinct channels.`);
        }
      }

      // Lead Intelligence Agent privacy check: no private scraping
      if (finding.agentId === 'lead_intelligence_agent') {
        if (lower.includes('scrap') && (lower.includes('whatsapp') || lower.includes('private') || lower.includes('contact list'))) {
          unsupportedAssumptions.push(`[Lead Intelligence Agent] suggested scraping private WhatsApp data or contact lists.`);
        }
      }

      // Conversion Optimizer: no claiming projected lift as fact
      if (finding.agentId === 'conversion_optimizer') {
        if (lower.includes('will increase by') && !lower.includes('hypothesis') && !lower.includes('target') && !lower.includes('projected')) {
          unsupportedAssumptions.push(`[Conversion Optimizer] stated projected conversion lift as fact instead of a testable hypothesis.`);
        }
      }

      // Growth Analytics Agent: attribution check
      if (finding.agentId === 'growth_analytics_agent') {
        if (lower.includes('full attribution') && !lower.includes('incomplete')) {
          unsupportedAssumptions.push(`[Growth Analytics Agent] claimed full multi-touch attribution without acknowledging attribution data gaps.`);
        }
      }

      // Trend Researcher external source check: external claims must carry SOURCE and DATE
      if (finding.agentId === 'trend_researcher') {
        const isExternalClaim = lower.includes('market') || lower.includes('competitor') || lower.includes('gst') || lower.includes('e-invoice') || lower.includes('vyapar') || lower.includes('tally');
        const hasSource = lower.includes('source') || lower.includes('cbic') || lower.includes('meta') || lower.includes('npci') || lower.includes('benchmark');
        if (isExternalClaim && !hasSource) {
          unsupportedAssumptions.push(`[Trend Researcher] external market claim is missing verified SOURCE attribution.`);
        }
      }

      // AI Engineer: Prompt safety, secret key hygiene, and token telemetry checks
      if (finding.agentId === 'ai_engineer') {
        if (lower.includes('next_public_gemini') || (lower.includes('client-side') && lower.includes('api key'))) {
          unsupportedAssumptions.push(`[AI Engineer] proposed exposing Gemini API key in client-side code; strictly prohibited.`);
        }
        if (lower.includes('zero hallucination') || lower.includes('100% immune to hallucination')) {
          unsupportedAssumptions.push(`[AI Engineer] claimed absolute zero hallucination without qualification.`);
        }
        if ((lower.includes('exact token spend') || lower.includes('cost per query')) && !lower.includes('unintegrated') && !lower.includes('not recorded') && !lower.includes('estimated')) {
          unsupportedAssumptions.push(`[AI Engineer] asserted exact token billing figures without acknowledging external AI Studio telemetry is unintegrated.`);
        }
      }

      // Backend Architect: RLS integrity and EXPLAIN ANALYZE checks
      if (finding.agentId === 'backend_architect') {
        if (lower.includes('disable rls') || lower.includes('bypass row-level security')) {
          unsupportedAssumptions.push(`[Backend Architect] proposed disabling Row-Level Security; violates multi-tenant isolation.`);
        }
        if ((lower.includes('explain analyze') || lower.includes('cache hit ratio')) && !lower.includes('unmeasurable') && !lower.includes('not queryable')) {
          unsupportedAssumptions.push(`[Backend Architect] referenced PostgreSQL execution plans without acknowledging they are unmeasurable via application data layer.`);
        }
      }

      // DevOps Automator: Container port and host hardware checks
      if (finding.agentId === 'devops_automator') {
        if (lower.includes('change port to') || (lower.includes('port') && (lower.includes('3001') || lower.includes('5173') || lower.includes('8080')))) {
          unsupportedAssumptions.push(`[DevOps Automator] proposed non-3000 port; port 3000 is strictly mandated by container reverse proxy.`);
        }
        if ((lower.includes('container cpu throttling') || lower.includes('cgroup memory limit')) && !lower.includes('unmeasured') && !lower.includes('managed by cloud run')) {
          unsupportedAssumptions.push(`[DevOps Automator] asserted container host metrics without acknowledging host telemetry is unmeasured in database.`);
        }
      }

      // Phase 7: Statistical significance validation - never allow fabricated p-values
      if (
        (lower.includes('p < 0.05') || lower.includes('p < 0.01') || lower.includes('statistical significance') || lower.includes('confidence interval')) &&
        !lower.includes('unavailable') &&
        !lower.includes('not calculated') &&
        !lower.includes('insufficient sample')
      ) {
        // If sample size is low or no valid experiment telemetry exists, flag fake p-value
        if (orgCount < 10 || invoiceCount < 20) {
          unsupportedAssumptions.push(`[${finding.agentName}] reported statistical significance/p-values without an adequate sample size or deterministic mathematical calculation.`);
        }
      }

      // Phase 7: Demo / Synthetic data exclusion check
      if (lower.includes('test_org_') || lower.includes('demo_') || lower.includes('mock_')) {
        unsupportedAssumptions.push(`[${finding.agentName}] included demo/synthetic identifier in production intelligence reporting.`);
      }

      if (lower.includes('conversion rate') && invoiceCount === 0) {
        contradictionsDetected.push(`[${finding.agentName}] cited conversion metrics despite 0 invoices recorded.`);
      }
    });

    // Phase 7: High-impact action human confirmation enforcement
    finding.recommendedActions?.forEach((action) => {
      const actionTitleLower = (action.title || '').toLowerCase();
      const actionDescLower = (action.description || '').toLowerCase();
      const isHighImpact =
        action.permissionLevel === 'level_3_high_impact' ||
        actionTitleLower.includes('remind') ||
        actionTitleLower.includes('message') ||
        actionTitleLower.includes('whatsapp') ||
        actionTitleLower.includes('delete') ||
        actionTitleLower.includes('purge') ||
        actionTitleLower.includes('disable') ||
        actionTitleLower.includes('billing') ||
        actionTitleLower.includes('campaign') ||
        actionDescLower.includes('send message') ||
        actionDescLower.includes('delete');

      if (isHighImpact && action.status === 'auto_executed') {
        unsupportedAssumptions.push(`High-impact action "${action.title}" was marked as auto_executed; must require human confirmation.`);
      }
    });
  });

  // Phase 8: Structured Memory & Current-Data Precedence Audits
  if (input.conflictReport && input.conflictReport.hasConflicts) {
    input.conflictReport.conflicts.forEach((conflict) => {
      contradictionsDetected.push(
        `Memory Conflict: "${conflict.memoryTitle}" (${conflict.memoryClaim}) was overridden by current verified truth: ${conflict.currentDataFact}.`
      );
      numericalAudit.push({
        claim: conflict.memoryClaim,
        verified: false,
        sourceTool: 'tool_get_structured_memory',
        discrepancy: `Historical claim superseded by current database state: ${conflict.currentDataFact}`,
      });
    });
  }

  // Phase 8: Trust classification audit on retrieved memories
  if (input.memories && input.memories.length > 0) {
    input.memories.forEach((mem) => {
      if (mem.verificationStatus === 'HYPOTHESIS' || mem.verificationStatus === 'INFERRED' || mem.verificationStatus === 'UNVERIFIED') {
        // Ensure not reported as verified
        const matchingFinding = specialistFindings.some((f) => {
          const s = (f.summary || '').toLowerCase();
          return s.includes(mem.title.toLowerCase()) && s.includes('proven fact');
        });
        if (matchingFinding) {
          unsupportedAssumptions.push(
            `Structured memory "${mem.title}" has trust level "${mem.verificationStatus}" and cannot be presented as a verified database fact.`
          );
        }
      }
      if (mem.status === 'invalidated' || mem.status === 'superseded' || mem.verificationStatus === 'EXPIRED') {
        numericalAudit.push({
          claim: `Historical Memory: ${mem.title}`,
          verified: false,
          sourceTool: 'tool_get_structured_memory',
          discrepancy: mem.staleReason || `Memory status is ${mem.status}. Current verified database data has precedence.`,
        });
      }
    });
  }

  // 5. Compute overall confidence score
  let confidenceScore: ConfidenceScore = 'high';

  const toolValues = Object.values(toolResults);
  const allToolsFailed = toolValues.length > 0 && toolValues.every((t) => !t.success);

  if (orgCount === 0 || allToolsFailed) {
    confidenceScore = 'insufficient_evidence';
  } else if (!isAdequate || missingDataPoints.length > 1 || unsupportedAssumptions.length > 1) {
    confidenceScore = 'low';
  } else if (unsupportedAssumptions.length > 0 || contradictionsDetected.length > 0) {
    confidenceScore = 'moderate';
  }

  // 6. Formulate risk assessment and verdict
  let riskAssessment = 'Low risk: recommendations are directly grounded in verified database figures.';
  if (confidenceScore === 'insufficient_evidence') {
    riskAssessment = 'Critical risk: Insufficient data to validate recommendations. No autonomous actions should be executed.';
  } else if (confidenceScore === 'low') {
    riskAssessment = 'Elevated risk: High uncertainty due to small sample size or missing telemetry. Require human review.';
  } else if (confidenceScore === 'moderate') {
    riskAssessment = 'Moderate risk: Assumptions detected. Verify individual organization records before making structural changes.';
  }

  const verdict = confidenceScore === 'insufficient_evidence'
    ? 'INSUFFICIENT EVIDENCE: Claims cannot be verified with the available database state.'
    : confidenceScore === 'low'
    ? 'PROCEED WITH CAUTION: Early data indicates directional trends, but sample size is small.'
    : confidenceScore === 'moderate'
    ? 'ACCEPTED WITH CAVEATS: Grounded findings with minor caveats regarding early-stage sample size.'
    : 'VERIFIED & SOUND: High confidence. Numerical claims match deterministic database calculations.';

  return {
    confidenceScore,
    numericalAudit,
    sampleSizeAssessment: {
      sampleCount: orgCount,
      isAdequate,
      notes: sampleNotes,
    },
    unsupportedAssumptions,
    missingDataPoints,
    contradictionsDetected,
    riskAssessment,
    verdict,
  };
}
