-- ============================================================
-- RIVERS PLATFORM — Guest (logged-out) donations
-- Allow visitors to donate without an account, and let any
-- authenticated user donate. Guest rows carry no PII — only
-- amount, campaign, message and payment reference.
-- ============================================================

-- Guests have no user row, so sponsor_id must be optional.
ALTER TABLE public.donations ALTER COLUMN sponsor_id DROP NOT NULL;

-- Any authenticated user can donate as themselves, or as a guest (sponsor_id
-- null) if the client couldn't resolve their id. Was limited to
-- sponsor/community_leader/admin, which blocked other roles.
DROP POLICY IF EXISTS "donations_insert" ON public.donations;
CREATE POLICY "donations_insert"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (sponsor_id = auth.uid() OR sponsor_id IS NULL);

-- Anonymous visitors can create guest donations (no account → sponsor_id null).
DROP POLICY IF EXISTS "donations_insert_guest" ON public.donations;
CREATE POLICY "donations_insert_guest"
  ON public.donations FOR INSERT
  TO anon
  WITH CHECK (sponsor_id IS NULL);

-- Ensure the anon role has table-level INSERT privilege (RLS still applies).
GRANT INSERT ON public.donations TO anon;

-- Notify trigger: handle guest / anonymous / named donors safely.
CREATE OR REPLACE FUNCTION public.notify_on_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader_id      UUID;
  v_campaign_title TEXT;
  v_donor_name     TEXT;
  v_raised         NUMERIC;
  v_target         NUMERIC;
  v_pct            NUMERIC;
  v_prev_pct       NUMERIC;
BEGIN
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT c.leader_id, c.title, c.raised_amount + NEW.amount, c.target_amount
  INTO v_leader_id, v_campaign_title, v_raised, v_target
  FROM campaigns c WHERE c.id = NEW.campaign_id;

  IF NEW.sponsor_id IS NULL THEN
    v_donor_name := 'A supporter';           -- guest, no account
  ELSIF NEW.is_anonymous THEN
    v_donor_name := 'An anonymous donor';
  ELSE
    SELECT COALESCE(full_name, 'A supporter') INTO v_donor_name
    FROM users WHERE id = NEW.sponsor_id;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    v_leader_id,
    'donation_received',
    'New Donation Received',
    v_donor_name || ' donated ' || NEW.amount || ' ' || NEW.currency || ' to "' || v_campaign_title || '".',
    '/dashboard/donations'
  );

  IF v_target > 0 THEN
    v_pct      := LEAST(ROUND(((v_raised)             / v_target * 100)::numeric, 0), 100);
    v_prev_pct := LEAST(ROUND(((v_raised - NEW.amount) / v_target * 100)::numeric, 0), 100);

    IF v_prev_pct < 50 AND v_pct >= 50 THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (v_leader_id, 'campaign_milestone', '50% Funded!',
        '"' || v_campaign_title || '" has reached 50% of its funding goal.', '/dashboard/campaigns');
    END IF;

    IF v_prev_pct < 100 AND v_pct >= 100 THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (v_leader_id, 'campaign_milestone', 'Fully Funded!',
        'Congratulations — "' || v_campaign_title || '" has reached its full funding goal!', '/dashboard/campaigns');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
