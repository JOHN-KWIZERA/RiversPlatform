-- ============================================================
-- RIVERS PLATFORM — Customizable application fields per opportunity
-- Adds application_fields JSONB to opportunities so creators can
-- choose which fields volunteers must fill in.
-- ============================================================

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS application_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
