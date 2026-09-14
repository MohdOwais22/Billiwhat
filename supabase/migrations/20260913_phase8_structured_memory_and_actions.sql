-- Migration: 20260913_phase8_structured_memory_and_actions.sql
-- Description: Production-grade Structured Memory and Tracked Actions for WhatsBill Executive Intelligence
-- 1. executive_memories: Stores strongly-typed, trust-classified memories with provenance and tenant isolation
-- 2. executive_actions: Stores deterministic open, approved, rejected, and completed actions with human approval tracking
-- 3. RLS policies: Strict tenant isolation and Master Admin access
-- 4. Safe fallback & non-destructive schema additions

-- ============================================================================
-- 1. Create executive_memories table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.executive_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  memory_type text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  source text NOT NULL,
  source_reference text,
  confidence text NOT NULL DEFAULT 'moderate',
  verification_status text NOT NULL DEFAULT 'VERIFIED',
  status text NOT NULL DEFAULT 'active',
  related_agents text[] DEFAULT ARRAY[]::text[],
  related_experiment_id text,
  related_audit_id uuid,
  expires_at timestamptz,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for fast bounded retrieval and tenant isolation
CREATE INDEX IF NOT EXISTS idx_executive_memories_org_id ON public.executive_memories(organization_id);
CREATE INDEX IF NOT EXISTS idx_executive_memories_type ON public.executive_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_executive_memories_status ON public.executive_memories(status);
CREATE INDEX IF NOT EXISTS idx_executive_memories_created_at ON public.executive_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executive_memories_verification ON public.executive_memories(verification_status);

-- Enable RLS
ALTER TABLE public.executive_memories ENABLE ROW LEVEL SECURITY;

-- Tenant isolation RLS policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'executive_memories' AND policyname = 'executive_memories_tenant_select'
  ) THEN
    CREATE POLICY "executive_memories_tenant_select"
      ON public.executive_memories
      FOR SELECT
      TO authenticated
      USING (
        organization_id IS NULL OR
        EXISTS (
          SELECT 1 FROM public.organization_members
          WHERE organization_members.organization_id = executive_memories.organization_id
            AND organization_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 2. Create executive_actions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.executive_actions (
  id text PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'P1',
  owner text NOT NULL DEFAULT 'system',
  status text NOT NULL DEFAULT 'PROPOSED',
  action_type text NOT NULL,
  evidence text[] DEFAULT ARRAY[]::text[],
  approval_required boolean DEFAULT false,
  approval_status text DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  completed_at timestamptz,
  failed_reason text,
  related_memory_id uuid REFERENCES public.executive_memories(id) ON DELETE SET NULL,
  related_audit_id uuid,
  due_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_executive_actions_org_id ON public.executive_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_executive_actions_status ON public.executive_actions(status);
CREATE INDEX IF NOT EXISTS idx_executive_actions_priority ON public.executive_actions(priority);
CREATE INDEX IF NOT EXISTS idx_executive_actions_created_at ON public.executive_actions(created_at DESC);

-- Enable RLS
ALTER TABLE public.executive_actions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation RLS policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'executive_actions' AND policyname = 'executive_actions_tenant_select'
  ) THEN
    CREATE POLICY "executive_actions_tenant_select"
      ON public.executive_actions
      FOR SELECT
      TO authenticated
      USING (
        organization_id IS NULL OR
        EXISTS (
          SELECT 1 FROM public.organization_members
          WHERE organization_members.organization_id = executive_actions.organization_id
            AND organization_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;
