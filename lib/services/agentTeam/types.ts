import { SupabaseClient } from '@supabase/supabase-js';

export type AgentCategory = 'business' | 'operations' | 'finance' | 'governance' | 'engineering';

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
  quickAction?: {
    type: 'inspect_org' | 'view_invoices' | 'view_whatsapp' | 'view_audit' | 'purge_dummy';
    label: string;
    targetId?: string;
  };
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
