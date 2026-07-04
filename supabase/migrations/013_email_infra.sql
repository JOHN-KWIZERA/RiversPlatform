-- ============================================================
-- RIVERS PLATFORM — Email infrastructure & scheduling
-- Foundation for pledge reminders, abandoned-donation nudges,
-- and admin broadcasts. Uses Supabase-native pg_cron + pg_net.
--
-- IMPORTANT — one-time manual setup (see README):
--   1. Enable extensions: Database → Extensions → pg_cron, pg_net
--      (or the CREATE EXTENSION lines below will enable them).
--   2. Store project URL + service role key once:
--        insert into private.app_config(key, value) values
--          ('project_url',      'https://<ref>.supabase.co'),
--          ('service_role_key', '<service-role-key>');
--   3. Set edge-function secrets: RESEND_API_KEY, FROM_EMAIL, PUBLIC_SITE_URL.
--
-- No PII: email_log stores user_id + kind + status only — never
-- email addresses or message bodies.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Email preferences on users (one-click unsubscribe) ───────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_opt_out boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_users_unsubscribe_token ON public.users(unsubscribe_token);

-- ── Email log — de-dupe / cooldown / audit (no PII) ──────────
CREATE TABLE IF NOT EXISTS public.email_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE,
  kind       text NOT NULL,   -- pledge_reminder | pledge_lapsed | abandoned_nudge | broadcast
  ref_id     uuid,            -- e.g. recurring_donation.id / campaign.id / broadcast.id
  status     text NOT NULL DEFAULT 'sent',  -- sent | failed | skipped
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON public.email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_kind_ref ON public.email_log(kind, ref_id, created_at);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the log from the client; edge functions use the
-- service role (bypasses RLS) to insert.
CREATE POLICY "email_log_select_admin"
  ON public.email_log FOR SELECT
  TO authenticated
  USING (public.my_role() = 'admin');

-- ── Private config for scheduled jobs (never client-readable) ─
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);
-- No RLS policies → not reachable via PostgREST / anon / authenticated.
ALTER TABLE private.app_config ENABLE ROW LEVEL SECURITY;

-- ── Helper: invoke an edge function from a cron job ──────────
CREATE OR REPLACE FUNCTION private.invoke_edge(fn text, payload jsonb DEFAULT '{}'::jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, net
AS $$
DECLARE
  v_url text;
  v_key text;
  v_request_id bigint;
BEGIN
  SELECT value INTO v_url FROM private.app_config WHERE key = 'project_url';
  SELECT value INTO v_key FROM private.app_config WHERE key = 'service_role_key';
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE NOTICE 'invoke_edge skipped: app_config not set';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url     := v_url || '/functions/v1/' || fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := payload
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

-- ── Daily schedules (08:00 UTC) ──────────────────────────────
-- Re-running these updates the existing job of the same name.
SELECT cron.schedule('rivers-pledge-reminders', '0 8 * * *',
  $$ SELECT private.invoke_edge('pledge-reminders'); $$);

SELECT cron.schedule('rivers-abandoned-nudge', '0 9 * * *',
  $$ SELECT private.invoke_edge('abandoned-nudge'); $$);
