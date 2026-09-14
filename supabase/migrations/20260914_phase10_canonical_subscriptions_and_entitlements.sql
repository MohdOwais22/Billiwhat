-- ============================================================================
-- WHATSBILL PHASE 10 MIGRATION: CANONICAL CUSTOMER SUBSCRIPTIONS & ENTITLEMENTS
-- ============================================================================

-- 1. Organization Subscriptions Table (Scoped strictly to Organization)
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'business')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
    billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
    provider TEXT DEFAULT 'manual',
    provider_subscription_id TEXT,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT organization_subscriptions_org_unique UNIQUE (organization_id)
);

-- 2. Organization Usage Counters Table (Monthly deterministic tracking)
CREATE TABLE IF NOT EXISTS public.usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    invoices_count INTEGER NOT NULL DEFAULT 0,
    whatsapp_messages_count INTEGER NOT NULL DEFAULT 0,
    ai_drafts_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT usage_counters_org_period_unique UNIQUE (organization_id, billing_period_start)
);

-- 3. Indexes for Instant Query Execution & Quota Checks
CREATE INDEX IF NOT EXISTS idx_org_subs_org ON public.organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subs_plan ON public.organization_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_org_subs_status ON public.organization_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_counters_org ON public.usage_counters(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_counters_period ON public.usage_counters(billing_period_start);

-- 4. Enable Row Level Security (Tenant Isolation)
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Members of the organization can view their own subscription & usage
DROP POLICY IF EXISTS "Members can view own organization subscription" ON public.organization_subscriptions;
CREATE POLICY "Members can view own organization subscription"
    ON public.organization_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = organization_subscriptions.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can view own organization usage" ON public.usage_counters;
CREATE POLICY "Members can view own organization usage"
    ON public.usage_counters
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = usage_counters.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- 6. Mutations strictly reserved for Service Role
DROP POLICY IF EXISTS "Service role full access on organization_subscriptions" ON public.organization_subscriptions;
CREATE POLICY "Service role full access on organization_subscriptions"
    ON public.organization_subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on usage_counters" ON public.usage_counters;
CREATE POLICY "Service role full access on usage_counters"
    ON public.usage_counters
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. Backfill initial 'free' subscription for all existing organizations without breaking data
INSERT INTO public.organization_subscriptions (organization_id, plan_id, status, billing_interval)
SELECT id, 'free', 'active', 'monthly'
FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;
