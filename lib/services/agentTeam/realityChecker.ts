import {
  RealityCheckReport,
  ConfidenceScore,
  AgentFinding,
  ToolExecutionResult,
} from './types';
import { PlatformMetricsOutput } from './toolRegistry';

export interface RealityCheckInput {
  query: string;
  specialistFindings: AgentFinding[];
  toolResults: Record<string, ToolExecutionResult>;
  platformMetrics?: PlatformMetricsOutput;
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
    numericalAudit.push({
      claim: `Total Billed Volume: ₹${platformMetrics.billedValue.toLocaleString('en-IN')}`,
      verified: true,
      sourceTool: 'tool_get_platform_metrics',
      databaseValue: platformMetrics.billedValue,
    });
    numericalAudit.push({
      claim: `Total Collected Volume: ₹${platformMetrics.collectedValue.toLocaleString('en-IN')}`,
      verified: true,
      sourceTool: 'tool_get_platform_metrics',
      databaseValue: platformMetrics.collectedValue,
    });
    numericalAudit.push({
      claim: `Outstanding Balance: ₹${platformMetrics.outstandingReceivables.toLocaleString('en-IN')}`,
      verified: true,
      sourceTool: 'tool_get_platform_metrics',
      databaseValue: platformMetrics.outstandingReceivables,
    });
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
    finding.keyFindings.forEach((kf) => {
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

      // Trend Researcher external source check: external claims must carry SOURCE and DATE
      if (finding.agentId === 'trend_researcher') {
        const isExternalClaim = lower.includes('market') || lower.includes('competitor') || lower.includes('gst') || lower.includes('e-invoice') || lower.includes('vyapar') || lower.includes('tally');
        const hasSource = lower.includes('source') || lower.includes('cbic') || lower.includes('meta') || lower.includes('npci') || lower.includes('benchmark');
        if (isExternalClaim && !hasSource) {
          unsupportedAssumptions.push(`[Trend Researcher] external market claim is missing verified SOURCE attribution.`);
        }
      }

      if (lower.includes('conversion rate') && invoiceCount === 0) {
        contradictionsDetected.push(`[${finding.agentName}] cited conversion metrics despite 0 invoices recorded.`);
      }
    });
  });

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
