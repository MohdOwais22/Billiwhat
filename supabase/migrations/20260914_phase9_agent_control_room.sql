-- ============================================================================
-- WHATSBILL PHASE 9 MIGRATION: AGENT CONTROL ROOM & EXECUTION OBSERVABILITY
-- ============================================================================

-- 1. Agent Executions Table (persists execution trace & lifecycle state)
CREATE TABLE IF NOT EXISTS public.agent_executions (
    id TEXT PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, FAILED, BLOCKED, REQUIRES_APPROVAL, RUNNING
    lifecycle_state TEXT NOT NULL DEFAULT 'COMPLETED', -- REQUESTED, ROUTING, QUEUED, RUNNING, TOOLS_EXECUTING, ANALYZING, REALITY_CHECK, EXECUTIVE_SYNTHESIS, COMPLETED, FAILED
    selected_agents TEXT[] NOT NULL DEFAULT '{}',
    tools_executed TEXT[] NOT NULL DEFAULT '{}',
    confidence_score TEXT NOT NULL DEFAULT 'high', -- high, moderate, low, insufficient_evidence
    reality_check_verdict TEXT DEFAULT 'PASSED', -- PASSED, FLAGGED, BLOCKED, UNKNOWN
    reality_check_summary JSONB DEFAULT '{}'::jsonb,
    total_duration_ms INTEGER DEFAULT 0,
    tool_duration_ms INTEGER DEFAULT 0,
    specialist_duration_ms INTEGER DEFAULT 0,
    reality_check_duration_ms INTEGER DEFAULT 0,
    fallback_used BOOLEAN DEFAULT false,
    actions_count INTEGER DEFAULT 0,
    pending_approvals_count INTEGER DEFAULT 0,
    error_message TEXT,
    user_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 2. Agent Execution Events Table (fine-grained event stream for timelines & live activity)
CREATE TABLE IF NOT EXISTS public.agent_execution_events (
    id TEXT PRIMARY KEY,
    execution_id TEXT NOT NULL REFERENCES public.agent_executions(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    agent_id TEXT,
    tool_name TEXT,
    event_type TEXT NOT NULL, -- EXECUTION_CREATED, ROUTING_STARTED, AGENT_SELECTED, AGENT_STARTED, TOOL_STARTED, TOOL_COMPLETED, AGENT_COMPLETED, AGENT_FAILED, REALITY_CHECK_STARTED, REALITY_CHECK_COMPLETED, ACTION_PROPOSED, APPROVAL_REQUESTED, ACTION_APPROVED, ACTION_REJECTED, EXECUTION_COMPLETED, EXECUTION_FAILED
    status TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. High Performance Indexes
CREATE INDEX IF NOT EXISTS idx_agent_executions_org ON public.agent_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON public.agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created ON public.agent_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_exec ON public.agent_execution_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent ON public.agent_execution_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_type ON public.agent_execution_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_events_created ON public.agent_execution_events(created_at DESC);

-- 4. Enable Row-Level Security
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Service Role & Master Admin (platform-wide) and Tenant Isolation
CREATE POLICY "Service role full access on agent_executions"
    ON public.agent_executions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access on agent_execution_events"
    ON public.agent_execution_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users view tenant agent_executions"
    ON public.agent_executions
    FOR SELECT
    TO authenticated
    USING (
        organization_id IS NULL OR 
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users view tenant agent_execution_events"
    ON public.agent_execution_events
    FOR SELECT
    TO authenticated
    USING (
        organization_id IS NULL OR 
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );
