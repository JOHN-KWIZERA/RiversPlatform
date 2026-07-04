-- ============================================================
-- RIVERS PLATFORM — Sponsor activity (abandoned-donation flows)
-- and admin email broadcasts (marketing).
-- Activity rows store user_id + event + campaign_id only (no PII).
-- ============================================================

-- ── Sponsor activity — powers abandoned-donation nudges ──────
CREATE TABLE IF NOT EXISTS public.sponsor_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id  uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event       text NOT NULL,   -- campaign_view | donation_started | donation_completed
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_activity_sponsor ON public.sponsor_activity(sponsor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_activity_event   ON public.sponsor_activity(event, created_at);

ALTER TABLE public.sponsor_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor_activity_insert_own"
  ON public.sponsor_activity FOR INSERT
  TO authenticated
  WITH CHECK (sponsor_id = auth.uid());

CREATE POLICY "sponsor_activity_select_own"
  ON public.sponsor_activity FOR SELECT
  TO authenticated
  USING (sponsor_id = auth.uid() OR public.my_role() = 'admin');

-- ── Email broadcasts — admin marketing ──────────────────────
CREATE TABLE IF NOT EXISTS public.email_broadcasts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject         text NOT NULL,
  body_html       text NOT NULL,
  segment         text NOT NULL DEFAULT 'all',  -- all | sponsors | community_leader | volunteer
  status          text NOT NULL DEFAULT 'draft', -- draft | sending | sent
  sent_by         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sent_at         timestamptz,
  recipient_count int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_broadcasts_created ON public.email_broadcasts(created_at DESC);

ALTER TABLE public.email_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_broadcasts_admin_all"
  ON public.email_broadcasts FOR ALL
  TO authenticated
  USING (public.my_role() = 'admin')
  WITH CHECK (public.my_role() = 'admin');

-- ── One-click unsubscribe RPC (public, by token) ────────────
-- Flips email_opt_out for the matching user. DEFINER so anon can call.
CREATE OR REPLACE FUNCTION public.unsubscribe_email(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean;
BEGIN
  UPDATE public.users
  SET email_opt_out = true
  WHERE unsubscribe_token = p_token
  RETURNING true INTO v_found;
  RETURN COALESCE(v_found, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.unsubscribe_email(uuid) TO anon, authenticated;
