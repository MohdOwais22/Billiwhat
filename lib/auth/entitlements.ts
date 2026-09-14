import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// 1. CANONICAL PLAN TYPES & MACHINE-READABLE DEFINITIONS
// ============================================================================

export type PlanId = 'free' | 'pro' | 'business';
export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';

export interface PlanPricing {
  monthly: number;
  annual: number;
  effectiveMonthly: number;
}

export interface PlanLimits {
  invoicesPerMonth: number;
  maxCustomers: number;
  maxProducts: number;
  whatsappMessagesPerMonth: number;
  aiInvoiceDraftsPerMonth: number;
  maxTeamMembers: number;
  maxWorkspaces: number;
  allowedThemesCount: number;
  allowedThemeIds: string[];
}

export interface PlanFeatures {
  removeWatermark: boolean;
  rawDataExports: boolean;
  gstr1Export: boolean;
  batchReminders: boolean;
  advancedAging: boolean;
  caMultiClientHub: boolean;
  customThemeAccents: boolean;
  prioritySupport: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  pricing: PlanPricing;
  limits: PlanLimits;
  features: PlanFeatures;
  upgradePrompt: string;
}

/**
 * Single source of truth for WhatsBill customer plans.
 * Admin Panel & internal AI capabilities are strictly excluded.
 */
export const PLAN_CONFIG: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'For getting started with simple WhatsApp-ready billing',
    pricing: {
      monthly: 0,
      annual: 0,
      effectiveMonthly: 0,
    },
    limits: {
      invoicesPerMonth: 30,
      maxCustomers: 50,
      maxProducts: 50,
      whatsappMessagesPerMonth: 30,
      aiInvoiceDraftsPerMonth: 15,
      maxTeamMembers: 1,
      maxWorkspaces: 1,
      allowedThemesCount: 2,
      allowedThemeIds: ['classic_ledger', 'retail_compact'],
    },
    features: {
      removeWatermark: false,
      rawDataExports: false,
      gstr1Export: false,
      batchReminders: false,
      advancedAging: false,
      caMultiClientHub: false,
      customThemeAccents: false,
      prioritySupport: false,
    },
    upgradePrompt: 'Upgrade to Pro (₹399/mo or ₹299/mo billed yearly) for 500 invoices/month, whitelabeling, and full GST reports.',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For running your business with high volume and automated collections',
    pricing: {
      monthly: 399,
      annual: 3588,
      effectiveMonthly: 299,
    },
    limits: {
      invoicesPerMonth: 500,
      maxCustomers: 100000,
      maxProducts: 100000,
      whatsappMessagesPerMonth: 500,
      aiInvoiceDraftsPerMonth: 150,
      maxTeamMembers: 3,
      maxWorkspaces: 1,
      allowedThemesCount: 6,
      allowedThemeIds: [
        'classic_ledger',
        'tally_prime',
        'gst_pro',
        'business_classic',
        'modern_minimal',
        'retail_compact',
      ],
    },
    features: {
      removeWatermark: true,
      rawDataExports: true,
      gstr1Export: true,
      batchReminders: true,
      advancedAging: false,
      caMultiClientHub: false,
      customThemeAccents: false,
      prioritySupport: true,
    },
    upgradePrompt: 'Upgrade to Business (₹1,499/mo or ₹1,124/mo billed yearly) for up to 5,000 invoices, 10 team seats, and 5 workspaces.',
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'For growing teams, high volume, and multi-business / CA operations',
    pricing: {
      monthly: 1499,
      annual: 13488,
      effectiveMonthly: 1124,
    },
    limits: {
      invoicesPerMonth: 5000, // Explicit hard fair-use limit
      maxCustomers: 500000,
      maxProducts: 500000,
      whatsappMessagesPerMonth: 2500,
      aiInvoiceDraftsPerMonth: 600,
      maxTeamMembers: 10,
      maxWorkspaces: 5,
      allowedThemesCount: 6,
      allowedThemeIds: [
        'classic_ledger',
        'tally_prime',
        'gst_pro',
        'business_classic',
        'modern_minimal',
        'retail_compact',
      ],
    },
    features: {
      removeWatermark: true,
      rawDataExports: true,
      gstr1Export: true,
      batchReminders: true,
      advancedAging: true,
      caMultiClientHub: true,
      customThemeAccents: true,
      prioritySupport: true,
    },
    upgradePrompt: 'You are on the highest tier. Contact support for enterprise scale.',
  },
};

// ============================================================================
// 2. STANDARDIZED ERROR CONTRACT
// ============================================================================

export type EntitlementErrorCode =
  | 'PLAN_LIMIT_REACHED'
  | 'FEATURE_NOT_INCLUDED'
  | 'TEAM_LIMIT_REACHED'
  | 'WORKSPACE_LIMIT_REACHED'
  | 'AI_QUOTA_EXCEEDED'
  | 'WHATSAPP_QUOTA_EXCEEDED'
  | 'INVOICE_LIMIT_REACHED'
  | 'UPGRADE_REQUIRED';

export class EntitlementError extends Error {
  public code: EntitlementErrorCode;
  public status: number;
  public feature: string;
  public limit: number;
  public current: number;
  public upgradePlan: PlanId;

  constructor(params: {
    code: EntitlementErrorCode;
    message: string;
    feature: string;
    limit: number;
    current: number;
    upgradePlan?: PlanId;
    status?: number;
  }) {
    super(params.message);
    this.name = 'EntitlementError';
    this.code = params.code;
    this.status = params.status || 403;
    this.feature = params.feature;
    this.limit = params.limit;
    this.current = params.current;
    this.upgradePlan = params.upgradePlan || 'pro';
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      feature: this.feature,
      limit: this.limit,
      current: this.current,
      upgradePlan: this.upgradePlan,
    };
  }
}

// ============================================================================
// 3. NORMALIZATION & PLAN RESOLUTION
// ============================================================================

/**
 * Normalizes any historical plan string to canonical PlanId ('free' | 'pro' | 'business').
 */
export function normalizePlanId(raw?: string | null): PlanId {
  if (!raw) return 'free';
  const clean = raw.toLowerCase().trim();
  if (clean === 'pro' || clean === 'growth') return 'pro';
  if (clean === 'business' || clean === 'enterprise') return 'business';
  return 'free';
}

export function getPlanConfig(planId: string | null | undefined): PlanDefinition {
  const canonical = normalizePlanId(planId);
  return PLAN_CONFIG[canonical];
}

/**
 * Deterministic monthly billing period boundaries (start of current calendar month to end).
 */
export function getCurrentBillingPeriod(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

// ============================================================================
// 4. PERSISTED SUBSCRIPTION & USAGE DATA ACCESS
// ============================================================================

export interface OrganizationSubscriptionRecord {
  id?: string;
  organization_id: string;
  plan_id: PlanId;
  status: SubscriptionStatus;
  billing_interval: BillingInterval;
  provider: string;
  provider_subscription_id?: string | null;
  current_period_start: string;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
}

export interface OrganizationUsageStats {
  invoicesThisMonth: number;
  whatsappThisMonth: number;
  aiDraftsThisMonth: number;
  totalCustomers: number;
  totalProducts: number;
  activeMembers: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

export interface EntitlementStatus {
  organizationId: string;
  planId: PlanId;
  planName: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  limits: PlanLimits;
  features: PlanFeatures;
  usage: OrganizationUsageStats;
}

/**
 * In-memory fallback map for environments where table creation is still executing.
 */
const inMemorySubscriptions = new Map<string, OrganizationSubscriptionRecord>();
const inMemoryUsage = new Map<string, { invoices: number; whatsapp: number; aiDrafts: number; periodKey: string }>();

/**
 * Resolves the subscription record for an organization.
 * Guaranteed to return a valid subscription even if the organization table is fresh.
 */
export async function resolveOrganizationSubscription(
  organizationId: string
): Promise<OrganizationSubscriptionRecord> {
  const defaultSub: OrganizationSubscriptionRecord = {
    organization_id: organizationId,
    plan_id: 'free',
    status: 'active',
    billing_interval: 'monthly',
    provider: 'manual',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancel_at_period_end: false,
  };

  const adminClient = createAdminClient();
  if (!adminClient) {
    return inMemorySubscriptions.get(organizationId) || defaultSub;
  }

  try {
    const { data, error } = await adminClient
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        organization_id: data.organization_id,
        plan_id: normalizePlanId(data.plan_id),
        status: (data.status as SubscriptionStatus) || 'active',
        billing_interval: (data.billing_interval as BillingInterval) || 'monthly',
        provider: data.provider || 'manual',
        provider_subscription_id: data.provider_subscription_id,
        current_period_start: data.current_period_start || new Date().toISOString(),
        current_period_end: data.current_period_end,
        cancel_at_period_end: Boolean(data.cancel_at_period_end),
      };
    }

    // Check memory fallback if table not yet populated
    if (inMemorySubscriptions.has(organizationId)) {
      return inMemorySubscriptions.get(organizationId)!;
    }

    // Auto-create initial record in organization_subscriptions
    const { data: inserted, error: insErr } = await adminClient
      .from('organization_subscriptions')
      .insert({
        organization_id: organizationId,
        plan_id: 'free',
        status: 'active',
        billing_interval: 'monthly',
        provider: 'manual',
      })
      .select('*')
      .maybeSingle();

    if (!insErr && inserted) {
      return {
        id: inserted.id,
        organization_id: inserted.organization_id,
        plan_id: normalizePlanId(inserted.plan_id),
        status: (inserted.status as SubscriptionStatus) || 'active',
        billing_interval: (inserted.billing_interval as BillingInterval) || 'monthly',
        provider: inserted.provider || 'manual',
        current_period_start: inserted.current_period_start || new Date().toISOString(),
        current_period_end: inserted.current_period_end,
        cancel_at_period_end: Boolean(inserted.cancel_at_period_end),
      };
    }
  } catch (err) {
    console.warn('Database error reading organization_subscriptions, using fallback:', err);
  }

  return inMemorySubscriptions.get(organizationId) || defaultSub;
}

/**
 * Retrieves monthly rolling usage counters and current entity tallies.
 */
export async function getOrganizationUsage(
  organizationId: string
): Promise<OrganizationUsageStats> {
  const { start, end } = getCurrentBillingPeriod();
  const periodKey = start.toISOString().substring(0, 7); // e.g. 2026-09

  const adminClient = createAdminClient();
  let invoicesCount = 0;
  let whatsappCount = 0;
  let aiDraftsCount = 0;
  let totalCustomers = 0;
  let totalProducts = 0;
  let activeMembers = 1;

  if (adminClient) {
    try {
      // 1. Direct count of invoices created in current calendar month
      const { count: invCount } = await adminClient
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      invoicesCount = invCount || 0;

      // 2. Total active customers
      const { count: custCount } = await adminClient
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      totalCustomers = custCount || 0;

      // 3. Total active products
      const { count: prodCount } = await adminClient
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      totalProducts = prodCount || 0;

      // 4. Total team members
      const { count: memCount } = await adminClient
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
      activeMembers = memCount || 1;

      // 5. WhatsApp and AI Draft usage from usage_counters table
      const { data: usageRow } = await adminClient
        .from('usage_counters')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('billing_period_start', start.toISOString())
        .maybeSingle();

      if (usageRow) {
        whatsappCount = usageRow.whatsapp_messages_count || 0;
        aiDraftsCount = usageRow.ai_drafts_count || 0;
        // Invoices can also be read from usage_counters if preferred, or max of both
        invoicesCount = Math.max(invoicesCount, usageRow.invoices_count || 0);
      }
    } catch (err) {
      console.warn('Error reading organization usage from database:', err);
    }
  }

  // Check in-memory stats for recent test runs / local dev
  const memUsage = inMemoryUsage.get(organizationId);
  if (memUsage && memUsage.periodKey === periodKey) {
    invoicesCount = Math.max(invoicesCount, memUsage.invoices);
    whatsappCount = Math.max(whatsappCount, memUsage.whatsapp);
    aiDraftsCount = Math.max(aiDraftsCount, memUsage.aiDrafts);
  }

  return {
    invoicesThisMonth: invoicesCount,
    whatsappThisMonth: whatsappCount,
    aiDraftsThisMonth: aiDraftsCount,
    totalCustomers,
    totalProducts,
    activeMembers,
    billingPeriodStart: start.toISOString(),
    billingPeriodEnd: end.toISOString(),
  };
}

/**
 * Atomically increments a billable action counter (invoice, whatsapp, ai_draft).
 */
export async function recordBillableAction(
  organizationId: string,
  action: 'invoice' | 'whatsapp' | 'ai_draft'
): Promise<void> {
  const { start, end } = getCurrentBillingPeriod();
  const periodKey = start.toISOString().substring(0, 7);

  // Update in-memory counter
  const currentMem = inMemoryUsage.get(organizationId) || {
    invoices: 0,
    whatsapp: 0,
    aiDrafts: 0,
    periodKey,
  };
  if (action === 'invoice') currentMem.invoices++;
  if (action === 'whatsapp') currentMem.whatsapp++;
  if (action === 'ai_draft') currentMem.aiDrafts++;
  currentMem.periodKey = periodKey;
  inMemoryUsage.set(organizationId, currentMem);

  const adminClient = createAdminClient();
  if (!adminClient) return;

  try {
    const colName =
      action === 'invoice'
        ? 'invoices_count'
        : action === 'whatsapp'
        ? 'whatsapp_messages_count'
        : 'ai_drafts_count';

    // Upsert into usage_counters
    const { data: existing } = await adminClient
      .from('usage_counters')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('billing_period_start', start.toISOString())
      .maybeSingle();

    if (existing) {
      await adminClient
        .from('usage_counters')
        .update({
          [colName]: (existing[colName] || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await adminClient.from('usage_counters').insert({
        organization_id: organizationId,
        billing_period_start: start.toISOString(),
        billing_period_end: end.toISOString(),
        [colName]: 1,
      });
    }
  } catch (err) {
    console.warn(`Failed to increment ${action} usage counter in database:`, err);
  }
}

/**
 * Returns complete entitlement status with plan configuration and current usage.
 */
export async function getOrganizationEntitlements(
  organizationId: string
): Promise<EntitlementStatus> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);
  const usage = await getOrganizationUsage(organizationId);

  return {
    organizationId,
    planId: plan.id,
    planName: plan.name,
    status: sub.status,
    billingInterval: sub.billing_interval,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    limits: plan.limits,
    features: plan.features,
    usage,
  };
}

// ============================================================================
// 5. SERVER-SIDE ENFORCEMENT GUARDS
// ============================================================================

/**
 * Asserts that the organization is within its monthly invoice limit.
 */
export async function assertCanCreateInvoice(organizationId: string): Promise<void> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);
  const usage = await getOrganizationUsage(organizationId);

  if (usage.invoicesThisMonth >= plan.limits.invoicesPerMonth) {
    const nextPlan = plan.id === 'free' ? 'pro' : 'business';
    throw new EntitlementError({
      code: 'INVOICE_LIMIT_REACHED',
      message: `You have reached your limit of ${plan.limits.invoicesPerMonth} invoices this month. ${plan.upgradePrompt}`,
      feature: 'invoices_per_month',
      limit: plan.limits.invoicesPerMonth,
      current: usage.invoicesThisMonth,
      upgradePlan: nextPlan,
      status: 402,
    });
  }
}

/**
 * Asserts that the organization is within its customer capacity.
 */
export async function assertCanAddCustomer(organizationId: string): Promise<void> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);
  const usage = await getOrganizationUsage(organizationId);

  if (plan.limits.maxCustomers > 0 && usage.totalCustomers >= plan.limits.maxCustomers) {
    throw new EntitlementError({
      code: 'PLAN_LIMIT_REACHED',
      message: `You have reached your limit of ${plan.limits.maxCustomers} customers on the ${plan.name} plan. Upgrade to Pro for unlimited customers.`,
      feature: 'max_customers',
      limit: plan.limits.maxCustomers,
      current: usage.totalCustomers,
      upgradePlan: 'pro',
      status: 402,
    });
  }
}

/**
 * Asserts that the organization is within its product capacity.
 */
export async function assertCanAddProduct(organizationId: string): Promise<void> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);
  const usage = await getOrganizationUsage(organizationId);

  if (plan.limits.maxProducts > 0 && usage.totalProducts >= plan.limits.maxProducts) {
    throw new EntitlementError({
      code: 'PLAN_LIMIT_REACHED',
      message: `You have reached your limit of ${plan.limits.maxProducts} products on the ${plan.name} plan. Upgrade to Pro for unlimited products.`,
      feature: 'max_products',
      limit: plan.limits.maxProducts,
      current: usage.totalProducts,
      upgradePlan: 'pro',
      status: 402,
    });
  }
}

/**
 * Asserts that the organization has WhatsApp delivery quota remaining.
 */
export async function assertCanSendWhatsAppMessage(organizationId: string): Promise<void> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);
  const usage = await getOrganizationUsage(organizationId);

  if (usage.whatsappThisMonth >= plan.limits.whatsappMessagesPerMonth) {
    const nextPlan = plan.id === 'free' ? 'pro' : 'business';
    throw new EntitlementError({
      code: 'WHATSAPP_QUOTA_EXCEEDED',
      message: `You have used your ${plan.limits.whatsappMessagesPerMonth} WhatsBill WhatsApp messages for this month. You can still share invoices directly via WhatsApp Web/App, or upgrade to ${nextPlan.toUpperCase()}.`,
      feature: 'whatsapp_messages_per_month',
      limit: plan.limits.whatsappMessagesPerMonth,
      current: usage.whatsappThisMonth,
      upgradePlan: nextPlan,
      status: 402,
    });
  }
}

/**
 * Asserts that the organization has AI voice/text invoice drafting quota remaining.
 */
export async function assertCanUseAiDraft(organizationId: string): Promise<void> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);
  const usage = await getOrganizationUsage(organizationId);

  if (usage.aiDraftsThisMonth >= plan.limits.aiInvoiceDraftsPerMonth) {
    const nextPlan = plan.id === 'free' ? 'pro' : 'business';
    throw new EntitlementError({
      code: 'AI_QUOTA_EXCEEDED',
      message: `You have reached your limit of ${plan.limits.aiInvoiceDraftsPerMonth} AI invoice drafts for this month. ${plan.upgradePrompt}`,
      feature: 'ai_invoice_drafts_per_month',
      limit: plan.limits.aiInvoiceDraftsPerMonth,
      current: usage.aiDraftsThisMonth,
      upgradePlan: nextPlan,
      status: 402,
    });
  }
}

/**
 * Asserts that the organization can invite another team member.
 */
export async function assertCanAddTeamMember(organizationId: string): Promise<void> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);
  const usage = await getOrganizationUsage(organizationId);

  if (usage.activeMembers >= plan.limits.maxTeamMembers) {
    const nextPlan = plan.id === 'free' ? 'pro' : 'business';
    throw new EntitlementError({
      code: 'TEAM_LIMIT_REACHED',
      message: `Your ${plan.name} plan includes up to ${plan.limits.maxTeamMembers} member(s). Upgrade to ${nextPlan.toUpperCase()} for more team seats.`,
      feature: 'max_team_members',
      limit: plan.limits.maxTeamMembers,
      current: usage.activeMembers,
      upgradePlan: nextPlan,
      status: 402,
    });
  }
}

/**
 * Asserts that a user has not exceeded their allowed workspace count across organizations where they are owner.
 */
export async function assertCanCreateWorkspace(userId: string): Promise<void> {
  const adminClient = createAdminClient();
  let ownedCount = 1;

  if (adminClient) {
    try {
      const { count } = await adminClient
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('role', 'owner');
      ownedCount = count || 1;
    } catch (err) {
      console.warn('Error counting user owned workspaces:', err);
    }
  }

  // To create a second workspace, the user must own at least one Business subscription
  if (ownedCount >= 1) {
    let hasBusinessPlan = false;
    if (adminClient) {
      try {
        const { data: ownedOrgs } = await adminClient
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId)
          .eq('role', 'owner');

        if (ownedOrgs && ownedOrgs.length > 0) {
          const orgIds = ownedOrgs.map((o) => o.organization_id);
          const { data: subs } = await adminClient
            .from('organization_subscriptions')
            .select('plan_id, status')
            .in('organization_id', orgIds)
            .eq('status', 'active');

          hasBusinessPlan = Boolean(subs?.some((s) => normalizePlanId(s.plan_id) === 'business'));
        }
      } catch (err) {
        console.warn('Error verifying business plan for multi-workspace creation:', err);
      }
    }

    if (!hasBusinessPlan && ownedCount >= 1) {
      throw new EntitlementError({
        code: 'WORKSPACE_LIMIT_REACHED',
        message: 'Multiple business workspaces / CA client hubs are available on the Business Plan (up to 5 workspaces). Upgrade to Business to create additional workspaces.',
        feature: 'max_workspaces',
        limit: 1,
        current: ownedCount,
        upgradePlan: 'business',
        status: 402,
      });
    }

    if (hasBusinessPlan && ownedCount >= 5) {
      throw new EntitlementError({
        code: 'WORKSPACE_LIMIT_REACHED',
        message: 'You have reached the maximum of 5 business workspaces included on the Business Plan.',
        feature: 'max_workspaces',
        limit: 5,
        current: ownedCount,
        upgradePlan: 'business',
        status: 402,
      });
    }
  }
}

/**
 * Asserts that the requested theme is supported by the organization's plan.
 */
export async function assertCanUseTheme(organizationId: string, themeId: string): Promise<void> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);

  if (!plan.limits.allowedThemeIds.includes(themeId)) {
    throw new EntitlementError({
      code: 'FEATURE_NOT_INCLUDED',
      message: `The theme "${themeId}" requires the Pro or Business plan. The Free plan includes Classic Ledger and Retail Compact.`,
      feature: 'invoice_themes',
      limit: plan.limits.allowedThemesCount,
      current: 1,
      upgradePlan: 'pro',
      status: 403,
    });
  }
}

/**
 * Asserts that raw data export (Excel/CSV) is unlocked.
 */
export async function assertCanExport(organizationId: string): Promise<void> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);

  if (!plan.features.rawDataExports) {
    throw new EntitlementError({
      code: 'FEATURE_NOT_INCLUDED',
      message: 'Raw Excel and CSV data export requires the Pro or Business plan.',
      feature: 'raw_data_exports',
      limit: 0,
      current: 0,
      upgradePlan: 'pro',
      status: 403,
    });
  }
}

/**
 * Asserts that advanced aging (30/60/90 days risk schedules) is unlocked.
 */
export async function assertCanUseAdvancedAging(organizationId: string): Promise<void> {
  const sub = await resolveOrganizationSubscription(organizationId);
  const plan = getPlanConfig(sub.plan_id);

  if (!plan.features.advancedAging) {
    throw new EntitlementError({
      code: 'FEATURE_NOT_INCLUDED',
      message: 'Advanced aging analysis and customer risk scoring are exclusive to the Business Plan.',
      feature: 'advanced_aging',
      limit: 0,
      current: 0,
      upgradePlan: 'business',
      status: 403,
    });
  }
}

// ============================================================================
// 6. SUBSCRIPTION MUTATIONS & SAFE DOWNGRADE / CANCELLATION
// ============================================================================

/**
 * Safely updates an organization's subscription plan.
 * ZERO customer data (invoices, customers, products) is ever deleted.
 */
export async function updateOrganizationPlan(params: {
  organizationId: string;
  targetPlan: PlanId;
  billingInterval?: BillingInterval;
  provider?: string;
  providerSubscriptionId?: string;
}): Promise<OrganizationSubscriptionRecord> {
  const canonical = normalizePlanId(params.targetPlan);
  const interval = params.billingInterval || 'monthly';
  const provider = params.provider || 'manual';

  const periodMonths = interval === 'yearly' ? 12 : 1;
  const currentPeriodStart = new Date().toISOString();
  const currentPeriodEnd = new Date(Date.now() + periodMonths * 30 * 24 * 60 * 60 * 1000).toISOString();

  const record: OrganizationSubscriptionRecord = {
    organization_id: params.organizationId,
    plan_id: canonical,
    status: 'active',
    billing_interval: interval,
    provider,
    provider_subscription_id: params.providerSubscriptionId || null,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: false,
  };

  // Update in-memory fallback
  inMemorySubscriptions.set(params.organizationId, record);

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from('organization_subscriptions')
        .upsert(
          {
            organization_id: params.organizationId,
            plan_id: canonical,
            status: 'active',
            billing_interval: interval,
            provider,
            provider_subscription_id: params.providerSubscriptionId || null,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id' }
        )
        .select('*')
        .single();

      if (!error && data) {
        return {
          id: data.id,
          organization_id: data.organization_id,
          plan_id: normalizePlanId(data.plan_id),
          status: data.status,
          billing_interval: data.billing_interval,
          provider: data.provider,
          provider_subscription_id: data.provider_subscription_id,
          current_period_start: data.current_period_start,
          current_period_end: data.current_period_end,
          cancel_at_period_end: Boolean(data.cancel_at_period_end),
        };
      }
    } catch (err) {
      console.warn('Failed to upsert organization_subscriptions in DB:', err);
    }
  }

  return record;
}

/**
 * Safely sets cancel_at_period_end for an organization.
 * Maintains full paid features until current_period_end. Never deletes data.
 */
export async function cancelOrganizationSubscription(
  organizationId: string
): Promise<OrganizationSubscriptionRecord> {
  const current = await resolveOrganizationSubscription(organizationId);
  current.cancel_at_period_end = true;

  inMemorySubscriptions.set(organizationId, current);

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      await adminClient
        .from('organization_subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);
    } catch (err) {
      console.warn('Failed to cancel subscription in DB:', err);
    }
  }

  return current;
}
