-- Migration: 20260907_whatsapp_integration_provider_identity.sql
-- Description: Minimal schema addition for Meta WhatsApp Cloud API identity mapping & idempotency

ALTER TABLE IF EXISTS public.organizations 
  ADD COLUMN IF NOT EXISTS meta_phone_number_id text,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text;

CREATE INDEX IF NOT EXISTS idx_organizations_meta_phone_number_id 
  ON public.organizations (meta_phone_number_id) 
  WHERE meta_phone_number_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_whatsapp_phone 
  ON public.organizations (whatsapp_phone) 
  WHERE whatsapp_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_logs_org_external_msg_id 
  ON public.message_logs (organization_id, external_message_id) 
  WHERE external_message_id IS NOT NULL;
