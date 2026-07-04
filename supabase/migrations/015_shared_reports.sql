-- ============================================================
-- RIVERS PLATFORM — Shareable web reports
-- A report is snapshotted at share time (config + resolved data),
-- so the public viewer never needs cross-table read access.
-- No donor names / PII are stored in the snapshot.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shared_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token        uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  title        text NOT NULL DEFAULT 'Impact Report',
  config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_reports_token   ON public.shared_reports(token);
CREATE INDEX IF NOT EXISTS idx_shared_reports_creator ON public.shared_reports(created_by);

ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- Owners and admins can list / manage their own shared reports.
CREATE POLICY "shared_reports_select_own"
  ON public.shared_reports FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR public.my_role() = 'admin');

CREATE POLICY "shared_reports_insert"
  ON public.shared_reports FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "shared_reports_delete_own"
  ON public.shared_reports FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.my_role() = 'admin');

-- Public read is only ever by unguessable token, via this DEFINER RPC.
-- This prevents anonymous enumeration of the table.
CREATE OR REPLACE FUNCTION public.get_shared_report(p_token uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'title',      sr.title,
    'config',     sr.config,
    'snapshot',   sr.snapshot,
    'createdAt',  sr.created_at
  )
  FROM public.shared_reports sr
  WHERE sr.token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_report(uuid) TO anon, authenticated;
