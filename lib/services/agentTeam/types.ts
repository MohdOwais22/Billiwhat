import { SupabaseClient } from '@supabase/supabase-js';

export type AgentCategory = 'business' | 'operations' | 'finance' | 'governance' | 'engineering' | 'growth';

export type ActionPermissionLevel = 'level_1_safe' | 'level_2_confirmation' | 'level_3_high_impact';

export type ConfidenceScore = 'high' | 'moderate' | 'low' | 'insufficient_evidence';

export interface ServerToolContext {
  supabase: SupabaseClient;
  adminUserId: string;
  adminPhone: string | null;
}

export interface ToolExecutionResult<T = any> {
  toolName: string;
  success: boolean;
  data?: T;
  error?: string;
  executionTimeMs: number;
  telemetryEvidence: string[];
}

export interface AgentTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  requiredPermission: ActionPermissionLevel;
  execute: (input: TInput, context: ServerToolContext) => Promise<ToolExecutionResult<TOutput>>;
}

export interface AgentContext {
  query: string;
  adminUserId: string;
  adminPhone: string | null;
  targetOrgId?: string;
  matchedOrgName?: string;
  sessionId?: string;
  timestamp: string;
}

export interface ActionProposal {
  id: string;
  title: string;
  description: string;
  permissionLevel: ActionPermissionLevel;
  actionType: string;
  targetEntity?: string;
  targetId?: string;
  parameters?: Record<string, unknown>;
  status: 'auto_executed' | 'pending_approval' | 'rejected' | 'executed';
  requiresExplicitConfirmation: boolean;
  estimatedImpact: string;
  priority?: 'P0' | 'P1' | 'P2';
}

export interface AgentFinding {
  agentId: string;
  agentName: string;
  category: AgentCategory;
  status: 'success' | 'partial' | 'error' | 'unavailable';
  summary: string;
  keyFindings: string[];
  evidence: string[];
  metricsUsed: Record<string, number | string | boolean>;
  recommendedActions: ActionProposal[];
  limitationsOrMissingData?: string[];
  executionTimeMs: number;
}

export interface AgentDefinition {
  id: string;
  name: string;
  category: AgentCategory;
  description: string;
  primaryQuestions: string[];
  allowedTools: string[];
  isEngineeringSpecialist: boolean;
  systemPrompt: string;
}

export interface RealityCheckReport {
  confidenceScore: ConfidenceScore;
  numericalAudit: Array<{
    claim: string;
    verified: boolean;
    sourceTool: string;
    databaseValue?: number | string;
    discrepancy?: string;
  }>;
  sampleSizeAssessment: {
    sampleCount: number;
    isAdequate: boolean;
    notes: string;
  };
  unsupportedAssumptions: string[];
  missingDataPoints: string[];
  contradictionsDetected: string[];
  riskAssessment: string;
  verdict: string;
}

export interface ExecutionTrace {
  traceId: string;
  query: string;
  intentDetected: string;
  selectedSpecialistIds: string[];
  toolsExecuted: string[];
  toolExecutionTimeMs: number;
  specialistExecutionTimeMs: number;
  realityCheckTimeMs: number;
  totalTimeMs: number;
  fallbackUsed: boolean;
  auditLogged: boolean;
}

export interface SpecialistContribution {
  agentId: string;
  agentName: string;
  category: AgentCategory;
  findingSummary: string;
  keyFindings?: string[];
  structure?: Record<string, string>;
}

export interface ExecutiveResponse {
  query: string;
  whatIsHappening: string;
  why: string;
  affected: string;
  severity: 'normal' | 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  specialistContributions: SpecialistContribution[];
  realityCheck: RealityCheckReport;
  recommendedAction?: string;
  recommendedActions: ActionProposal[];
  unknownOrMissingData?: string[];
  marketIntelligence?: Array<{
    source: string;
    date: string;
    claim: string;
    category?: string;
  }>;
  trace: ExecutionTrace;
  diagnosticsData: Record<string, any>;
  experiments?: Experiment[];
  prioritizedItems?: PrioritizedItem[];
  ceoBrief?: CEOBrief;
  quickAction?: {
    type: 'inspect_org' | 'view_invoices' | 'view_whatsapp' | 'view_audit' | 'purge_dummy';
    label: string;
    targetId?: string;
  };
}

export interface Experiment {
  id?: string;
  title: string;
  problem: string;
  hypothesis: string;
  rationale: string;

  baseline?: {
    metric: string;
    value: number | string;
    period?: string;
    source: string;
  };

  target?: {
    metric: string;
    value: number | string;
    period?: string;
  };

  primaryMetric: string;
  secondaryMetrics?: string[];
  successCriteria: string;
  guardrailMetrics?: string[];
  proposedChange: string;
  audience?: string;
  channel?: string;
  duration?: string;
  owner?: string;
  effort?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  expectedImpact?: 'low' | 'medium' | 'high';
  confidence?: number;
  risks?: string[];
  dependencies?: string[];
  status: 'draft' | 'proposed' | 'approved' | 'running' | 'completed' | 'cancelled';
}

export interface PrioritizedItem {
  id: string;
  title: string;
  category: 'experiment' | 'feature' | 'acquisition_channel' | 'operational_fix' | 'content_initiative';
  methodology: 'ICE' | 'RICE';
  methodologyReason: string;
  reach?: number;
  impact: number; // 1 - 10
  confidence: number; // 1 - 10
  effortScore: number; // 1 - 10
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  evidenceStrength: 'verified_telemetry' | 'early_indicator' | 'hypothesis';
  urgency: 'high' | 'medium' | 'low';
  calculatedScore: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  dependencies?: string[];
  rationale: string;
}

export interface GrowthOpportunity {
  id: string;
  channel: 'reddit' | 'meta' | 'google_seo' | 'content' | 'lead_intel' | 'direct';
  title: string;
  targetAudience: string;
  intentCategory: 'INFORMATIONAL' | 'COMMERCIAL' | 'TRANSACTIONAL' | 'NAVIGATIONAL';
  painPoint: string;
  recommendedAction: string;
  experimentHypothesis?: string;
  spamComplianceNotice: string;
  externalSource?: {
    source: string;
    date: string;
    claim: string;
  };
}

export interface ContentMatrixItem {
  topic: string;
  targetAudience: string;
  platformVariants: {
    blogConcept: { title: string; hook: string; outline: string[]; cta: string };
    landingPageConcept: { headline: string; subheadline: string; heroCta: string; socialProofAngle: string };
    instagramReel: { visualHook: string; audioAngle: string; scriptOutline: string; caption: string; cta: string };
    instagramCarousel: { slide1Hook: string; slidesBody: string[]; finalSlideCta: string };
    linkedInPost: { hook: string; problemInsight: string; actionableAdvice: string; cta: string };
    redditDiscussionAngle: { subreddit: string; threadTopic: string; helpfulAdvice: string; contextMention: string; ruleCompliance: string };
    faqSection: Array<{ question: string; answer: string }>;
  };
}

export interface AISystemHealthOutput {
  modelConfig: {
    primaryModel: string;
    temperature: number;
    mimeType: string;
    sdk: string;
    isApiKeyConfigured: boolean;
    isSecretIsolatedServerSide: boolean;
  };
  promptSafety: {
    antiHallucinationGuardrailsActive: boolean;
    realityCheckerIntegration: boolean;
    strictJsonSchemaEnforced: boolean;
    groundedInDatabaseFacts: boolean;
  };
  resilienceAndFallback: {
    deterministicFallbackConfigured: boolean;
    gracefulRateLimitHandling: boolean;
    observedAiAuditEventsCount: number;
  };
  tokenBudgetProfile: {
    modelTier: 'Flash' | 'Pro';
    estimatedLatencyBracket: string;
    fallbackCost: string;
  };
  telemetryNotice: string;
}

export interface BackendArchitectureOutput {
  schemaOverview: {
    coreEntities: string[];
    foreignKeyRelationships: Array<{
      fromTable: string;
      fromColumn: string;
      toTable: string;
      toColumn: string;
    }>;
    verifiedTableCounts: {
      organizations: number;
      invoices: number;
      payments: number;
      customers: number;
      products: number;
      messageLogs: number;
      auditLogs: number;
    };
  };
  securityAndTenancy: {
    multiTenantIsolationField: string;
    rowLevelSecurityStatus: 'active_enforced' | 'partially_enforced' | 'unconfigured';
    masterAdminRoleGate: string;
    unauthorizedAccessProtection: boolean;
  };
  queryOptimization: {
    queryTimeoutLimitMs: number;
    paginationStandardLimit: number;
    indexCoverage: string[];
  };
  webhookReliability: {
    whatsappWebhookVerification: boolean;
    idempotentDeliveryHandling: boolean;
    signatureValidationProtocol: string;
  };
  telemetryNotice: string;
}

export interface DevOpsStatusOutput {
  environmentSecretHygiene: {
    serverSecretsConfigured: Array<{
      name: string;
      isConfigured: boolean;
      isServerOnly: boolean;
      hasPublicLeak: boolean;
    }>;
    secretLeakFreeConfirmed: boolean;
  };
  deploymentConfiguration: {
    enforcedPort: number;
    portCompliance: boolean;
    runtimeTarget: string;
    framework: string;
    reverseProxyAlignment: string;
  };
  monitoringAndObservability: {
    sentryConfigured: boolean;
    auditLogsActive: boolean;
    messageLogsActive: boolean;
    recentAuditLogsCount: number;
  };
  backgroundTaskHealth: {
    asynchronousTaskExecution: boolean;
    schedulerCompliance: string;
  };
  telemetryNotice: string;
}

export interface Metric<T = number | string> {
  value: T;
  unit?: string;
  source: string;
  calculated: boolean;
  period?: string;
  confidence: ConfidenceScore;
  verified: boolean;
  notes?: string;
}

export interface CEOBriefAction {
  id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  score: number;
  title: string;
  rationale: string;
  evidence: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  category?: string;
}

export interface CEOBriefRisk {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
  impact: string;
  mitigation: string;
}

export interface CEOBriefOpportunity {
  id: string;
  title: string;
  potentialImpact: string;
  evidence: string;
  recommendedStep: string;
}

export interface CEOBriefDataQuality {
  verifiedMetricsCount: number;
  unverifiedMetricsCount: number;
  missingTelemetryPoints: string[];
  externalSources: Array<{ source: string; date: string; claim: string }>;
  warnings: string[];
  overallConfidence: ConfidenceScore;
}

export interface CEOBrief {
  generatedAt: string;
  period: string;
  executiveSummary: {
    businessStatus: string;
    biggestPositiveSignal: string;
    biggestRisk: string;
    biggestOpportunity: string;
    mostImportantAction: string;
  };
  business: {
    totalBilled: Metric<number>;
    totalCollected: Metric<number>;
    outstanding: Metric<number>;
    realizationRate: Metric<number>;
    totalOrganizations: Metric<number>;
    activeOrganizations: Metric<number>;
    invoiceVolume: Metric<number>;
    wowInvoiceVolumeChange: Metric<string>;
    timeToFirstInvoice: Metric<string>;
    growthNotes: string[];
  };
  product: {
    activeMerchants: Metric<number>;
    invoiceCreationAdoption: Metric<number>;
    whatsappPdfUsageRate: Metric<number>;
    customerLedgerUsageRate: Metric<number>;
    receivablesUsageRate: Metric<number>;
    onboardingCompletionRate: Metric<number>;
    featureAdoptionNotes: string[];
    frictionPoints: string[];
  };
  finance: {
    billed: Metric<number>;
    collected: Metric<number>;
    outstanding: Metric<number>;
    overdue: Metric<number>;
    agingBuckets: {
      lessThan30d: Metric<number>;
      thirtyOneToSixtyDays: Metric<number>;
      sixtyOneToNinetyDays: Metric<number>;
      greaterThan90d: Metric<number>;
    };
    collectionVelocity: Metric<string>;
    concentrationRisk: Metric<string>;
    partialPaymentsSummary: Metric<string>;
    prohibitedMetricsNotice: string;
  };
  whatsapp: {
    sent: Metric<number>;
    delivered: Metric<number>;
    failed: Metric<number>;
    bounced: Metric<number>;
    deliveryRate: Metric<number>;
    failureRate: Metric<number>;
    webhookEvents: Metric<number>;
    idempotencyStatus: Metric<string>;
    latencyObserved: Metric<string>;
    operationalHealth: 'healthy' | 'degraded' | 'critical' | 'not_directly_measured';
    healthEvidence: string;
  };
  growth: {
    googleSeoStatus: string;
    instagramMetaAdAngle: string;
    redditCommunityActivity: string;
    contentEngineOutput: string;
    conversionLandingToSignup: Metric<number>;
    conversionSignupToFirstInvoice: Metric<number>;
    acquisitionChannels: string[];
    unmeasuredGrowthMetricsNotice: string;
  };
  experiments: {
    running: Array<{
      title: string;
      problem: string;
      hypothesis: string;
      baseline: string;
      target: string;
      primaryMetric: string;
      guardrailMetric: string;
      status: 'running' | 'completed' | 'winning' | 'failed';
      evidenceLevel: string;
      statisticalSignificance: string;
    }>;
    completed: number;
    winning: number;
    failed: number;
    statisticalIntegrityNotice: string;
  };
  engineering: {
    aiSystemHealth: {
      primaryModel: string;
      temperature: number;
      fallbackActive: boolean;
      serverSideIsolation: boolean;
    };
    backendArchitecture: {
      database: string;
      rlsMultiTenantIsolation: boolean;
      webhookIdempotency: boolean;
    };
    devopsStatus: {
      portEnforcement: number;
      secretHygieneConfirmed: boolean;
      runtimeTarget: string;
    };
    telemetryNotice: string;
  };
  risks: CEOBriefRisk[];
  opportunities: CEOBriefOpportunity[];
  topActions: CEOBriefAction[];
  unknowns: string[];
  dataQuality: CEOBriefDataQuality;
  historicalContinuity?: {
    previousDecisionsCount: number;
    openActionsCount: number;
    unresolvedRisksCount: number;
    recentDecisions: Array<{
      title: string;
      status: string;
      date: string;
    }>;
    openActionItems: Array<{
      title: string;
      priority: string;
      status: string;
    }>;
    continuityNotice: string;
  };
}

// ============================================================================
// PHASE 8: STRUCTURED MEMORY & AUDIT INTELLIGENCE TYPES
// ============================================================================

export type StructuredMemoryType =
  | 'DECISION'
  | 'EXPERIMENT'
  | 'INSIGHT'
  | 'RISK'
  | 'OPPORTUNITY'
  | 'ACTION'
  | 'PREFERENCE'
  | 'FACT'
  | 'FOLLOW_UP'
  | 'RECOMMENDATION'
  | 'OUTCOME';

export type MemoryTrustLevel =
  | 'VERIFIED'
  | 'INFERRED'
  | 'HYPOTHESIS'
  | 'UNVERIFIED'
  | 'EXPIRED';

export type MemorySource =
  | 'DATABASE'
  | 'DETERMINISTIC_TOOL'
  | 'AUDIT_LOG'
  | 'EXPERIMENT'
  | 'EXTERNAL_SOURCE'
  | 'HUMAN_APPROVAL'
  | 'AI_INFERENCE';

export type MemoryStatus = 'active' | 'archived' | 'invalidated' | 'superseded';

export interface StructuredMemory {
  id: string;
  organizationId: string | null; // null represents platform-wide master admin memory
  createdAt: string;
  updatedAt: string;
  type: StructuredMemoryType;
  title: string;
  summary: string;
  details?: Record<string, any>;
  source: MemorySource;
  sourceReference?: string;
  externalSourceInfo?: {
    source: string;
    date: string;
    claim: string;
  };
  confidence: ConfidenceScore;
  verificationStatus: MemoryTrustLevel;
  status: MemoryStatus;
  relatedAgents: string[];
  relatedExperimentId?: string;
  relatedAuditId?: string;
  expiresAt?: string;
  tags?: string[];
  supersededBy?: string;
  staleReason?: string;
}

export type ActionItemStatus =
  | 'PROPOSED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'DEFERRED'
  | 'FAILED';

export type ActionItemPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface TrackedAction {
  id: string;
  organizationId: string | null;
  title: string;
  description?: string;
  priority: ActionItemPriority;
  owner: string;
  status: ActionItemStatus;
  actionType: string;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  evidence: string[];
  approvalRequired: boolean;
  approvalStatus?: 'approved' | 'rejected' | 'pending' | 'deferred';
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
  failedReason?: string;
  relatedMemoryId?: string;
  relatedAuditId?: string;
}

export interface HistoricalChangeReport {
  available: boolean;
  periodLabel: string;
  previousPeriodDate?: string;
  currentPeriodDate: string;
  deltas: Array<{
    metric: string;
    previousValue: number | string;
    currentValue: number | string;
    deltaStr: string;
    trend: 'improved' | 'degraded' | 'neutral' | 'unmeasured';
  }>;
  newDecisionsCount: number;
  resolvedActionsCount: number;
  newRisksIdentified: string[];
  improvementsRecorded: string[];
  staleMemoriesCount: number;
  unresolvedFollowUps: string[];
  summary: string;
}

export interface AuditIntelligenceReport {
  scannedAuditLogsCount: number;
  timeWindowHours: number;
  repeatedFailures: Array<{
    pattern: string;
    count: number;
    affectedArea: string;
    firstSeen: string;
    lastSeen: string;
    causalityNotice: string;
  }>;
  recurringRisks: Array<{
    risk: string;
    occurrences: number;
    severity: 'high' | 'medium' | 'low';
    firstDetected: string;
  }>;
  unresolvedActionItems: TrackedAction[];
  recentDecisions: Array<{
    id: string;
    decision: string;
    status: ActionItemStatus;
    timestamp: string;
    actor: string;
    evidence: string;
  }>;
  experimentLifecycleChanges: Array<{
    experimentId: string;
    title: string;
    previousStatus: string;
    newStatus: string;
    timestamp: string;
    outcome?: string;
  }>;
  operationalAnomalies: Array<{
    anomaly: string;
    severity: 'critical' | 'high' | 'medium';
    evidence: string[];
  }>;
  agentActivityPatterns: Array<{
    agentId: string;
    invocations: number;
    topFindingsCount: number;
  }>;
  causalityIntegrityNotice: string;
}

export interface MemoryConflictReport {
  hasConflicts: boolean;
  conflicts: Array<{
    memoryId: string;
    memoryTitle: string;
    memoryClaim: string;
    currentDataFact: string;
    resolution: 'current_data_overrides_memory' | 'human_decision_overrides';
    flaggedStale: boolean;
  }>;
}


export interface ExecutiveBrief {
  date: string;
  business: {
    growthNotes: string[];
    activeOrgsCount: number;
    totalOrgsCount: number;
  };
  product: {
    featureAdoptionNotes: string[];
    frictionPoints: string[];
  };
  finance: {
    billedValue: number;
    collectedValue: number;
    outstandingReceivables: number;
    invoiceCount: number;
    paymentCount: number;
  };
  operations: {
    whatsappSuccessRate: number;
    failureCount: number;
    healthStatus: 'healthy' | 'degraded' | 'critical';
  };
  growth: {
    activationRate: number;
    dropoffStage: string;
  };
  market: {
    competitorNotes: string[];
    regulatoryNotes: string[];
  };
  topPriorities: Array<{
    rank: number;
    title: string;
    impact: 'high' | 'medium' | 'low';
    urgency: 'high' | 'medium' | 'low';
    confidence: ConfidenceScore;
    evidence: string;
  }>;
}

// ============================================================================
// PHASE 9: AGENT CONTROL ROOM & OBSERVABILITY TYPES
// ============================================================================

export type AgentStatus =
  | 'IDLE'
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'REQUIRES_APPROVAL'
  | 'DISABLED';

export type ExecutionLifecycleState =
  | 'REQUESTED'
  | 'ROUTING'
  | 'QUEUED'
  | 'RUNNING'
  | 'TOOLS_EXECUTING'
  | 'ANALYZING'
  | 'REALITY_CHECK'
  | 'EXECUTIVE_SYNTHESIS'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'REQUIRES_APPROVAL';

export type AgentHealthStatus = 'HEALTHY' | 'DEGRADED' | 'FAILING' | 'UNKNOWN';

export type ObservabilityEventType =
  | 'EXECUTION_CREATED'
  | 'ROUTING_STARTED'
  | 'AGENT_SELECTED'
  | 'AGENT_STARTED'
  | 'TOOL_STARTED'
  | 'TOOL_COMPLETED'
  | 'AGENT_COMPLETED'
  | 'AGENT_FAILED'
  | 'REALITY_CHECK_STARTED'
  | 'REALITY_CHECK_COMPLETED'
  | 'ACTION_PROPOSED'
  | 'APPROVAL_REQUESTED'
  | 'ACTION_APPROVED'
  | 'ACTION_REJECTED'
  | 'EXECUTION_COMPLETED'
  | 'EXECUTION_FAILED';

export interface ObservabilityEvent {
  id: string;
  executionId: string;
  organizationId?: string | null;
  agentId?: string | null;
  toolName?: string | null;
  eventType: ObservabilityEventType;
  status: 'info' | 'success' | 'warning' | 'error';
  details: Record<string, any>;
  timestamp: string;
}

export interface PersistedAgentExecution {
  id: string;
  organizationId?: string | null;
  query: string;
  status: AgentStatus;
  lifecycleState: ExecutionLifecycleState;
  selectedAgents: string[];
  toolsExecuted: string[];
  confidenceScore: ConfidenceScore;
  realityCheckVerdict: 'PASSED' | 'FLAGGED' | 'BLOCKED' | 'UNKNOWN';
  realityCheckSummary: {
    claimsVerified?: number;
    claimsFlagged?: number;
    unsupportedCount?: number;
    missingDataCount?: number;
    conflictsDetected?: number;
    notes?: string;
  };
  totalDurationMs: number;
  toolDurationMs: number;
  specialistDurationMs: number;
  realityCheckDurationMs: number;
  fallbackUsed: boolean;
  actionsCount: number;
  pendingApprovalsCount: number;
  errorMessage?: string | null;
  userId?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string | null;
}

export interface AgentTelemetrySummary {
  id: string;
  name: string;
  category: AgentCategory;
  description: string;
  capabilities: string[];
  supportedIntents: string[];
  permissions: ActionPermissionLevel;
  allowedTools: string[];
  isEngineeringSpecialist: boolean;
  status: AgentStatus;
  health: AgentHealthStatus;
  confidence: ConfidenceScore;
  executionCount: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastActivity: string | null;
  averageDurationMs?: number | null;
  recentDecisionsCount?: number;
  realityCheckFlagsCount?: number;
}

export interface ControlRoomSnapshot {
  systemStatus: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  totalAgents: number;
  agentsByCategory: Record<string, number>;
  activeRunningCount: number;
  pendingApprovalsCount: number;
  recentExecutionsCount: number;
  failedExecutionsCount: number;
  unknownHealthCount: number;
  lastTelemetryUpdate: string;
  agents: AgentTelemetrySummary[];
}

export interface ApprovalActionItem {
  id: string;
  actionId: string;
  executionId?: string;
  organizationId?: string | null;
  title: string;
  description: string;
  requestingAgent: string;
  permissionLevel: ActionPermissionLevel;
  actionType: string;
  estimatedImpact: string;
  status: 'AWAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED';
  parameters?: Record<string, any>;
  createdAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

