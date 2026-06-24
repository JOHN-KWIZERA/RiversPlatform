-- ============================================================
-- RIVERS PLATFORM — Database Functions & Triggers
-- ============================================================

-- ── TRIGGER: create public.users row on signup ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, organisation, community, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'beneficiary'),
    COALESCE(NEW.raw_user_meta_data->>'organisation', ''),
    COALESCE(NEW.raw_user_meta_data->>'community', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── TRIGGER: update campaigns.raised_amount on donation ──────
CREATE OR REPLACE FUNCTION public.update_campaign_on_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status TEXT := COALESCE(OLD.status, '');
  v_new_status TEXT := NEW.status;
BEGIN
  -- Add to raised_amount when a donation first becomes 'completed'
  IF v_new_status = 'completed' AND v_old_status != 'completed' THEN
    UPDATE campaigns
    SET
      raised_amount = raised_amount + NEW.amount,
      donor_count   = donor_count + 1
    WHERE id = NEW.campaign_id;
  END IF;

  -- Reverse if a completed donation is refunded/failed
  IF v_old_status = 'completed' AND v_new_status IN ('refunded','failed') THEN
    UPDATE campaigns
    SET
      raised_amount = GREATEST(raised_amount - NEW.amount, 0),
      donor_count   = GREATEST(donor_count - 1, 0)
    WHERE id = NEW.campaign_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_donation_insert
  AFTER INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_on_donation();

CREATE TRIGGER on_donation_update
  AFTER UPDATE OF status ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_on_donation();

-- ── TRIGGER: notify campaign leader on donation ──────────────
CREATE OR REPLACE FUNCTION public.notify_on_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader_id     UUID;
  v_campaign_title TEXT;
  v_donor_name    TEXT;
  v_raised        NUMERIC;
  v_target        NUMERIC;
  v_pct           NUMERIC;
  v_prev_pct      NUMERIC;
BEGIN
  -- Only notify on new completed donations
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT c.leader_id, c.title, c.raised_amount + NEW.amount, c.target_amount
  INTO v_leader_id, v_campaign_title, v_raised, v_target
  FROM campaigns c WHERE c.id = NEW.campaign_id;

  IF NOT NEW.is_anonymous THEN
    SELECT full_name INTO v_donor_name FROM users WHERE id = NEW.sponsor_id;
  ELSE
    v_donor_name := 'An anonymous donor';
  END IF;

  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    v_leader_id,
    'donation_received',
    'New Donation Received',
    v_donor_name || ' donated ' || NEW.amount || ' ' || NEW.currency || ' to "' || v_campaign_title || '".',
    '/dashboard/donations'
  );

  -- Milestone notifications (50% and 100%)
  IF v_target > 0 THEN
    v_pct      := LEAST(ROUND(((v_raised)           / v_target * 100)::numeric, 0), 100);
    v_prev_pct := LEAST(ROUND(((v_raised - NEW.amount) / v_target * 100)::numeric, 0), 100);

    IF v_prev_pct < 50 AND v_pct >= 50 THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (
        v_leader_id,
        'campaign_milestone',
        '50% Funded!',
        '"' || v_campaign_title || '" has reached 50% of its funding goal.',
        '/dashboard/campaigns'
      );
    END IF;

    IF v_prev_pct < 100 AND v_pct >= 100 THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (
        v_leader_id,
        'campaign_milestone',
        'Fully Funded!',
        'Congratulations — "' || v_campaign_title || '" has reached its full funding goal!',
        '/dashboard/campaigns'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_donation_notify
  AFTER INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_donation();

-- ── TRIGGER: notify leader on campaign status change ─────────
CREATE OR REPLACE FUNCTION public.notify_on_campaign_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      NEW.leader_id,
      'campaign_approved',
      'Campaign Approved',
      'Your campaign "' || NEW.title || '" has been approved and is now live.',
      '/dashboard/campaigns'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      NEW.leader_id,
      'campaign_rejected',
      'Campaign Not Approved',
      'Your campaign "' || NEW.title || '" was not approved. ' || COALESCE(NULLIF(NEW.admin_note,''), 'Please review and resubmit.'),
      '/dashboard/campaigns'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_campaign_status_change
  AFTER UPDATE OF status ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_campaign_status();

-- ── TRIGGER: update filled_slots on application status ───────
CREATE OR REPLACE FUNCTION public.update_slots_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR OLD.status != 'accepted') THEN
    UPDATE opportunities SET filled_slots = filled_slots + 1 WHERE id = NEW.opportunity_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    UPDATE opportunities SET filled_slots = GREATEST(filled_slots - 1, 0) WHERE id = NEW.opportunity_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_application_status
  AFTER INSERT OR UPDATE OF status ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_slots_on_application();

-- ── TRIGGER: notify volunteer on application status change ────
CREATE OR REPLACE FUNCTION public.notify_on_application_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opp_title TEXT;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT title INTO v_opp_title FROM opportunities WHERE id = NEW.opportunity_id;

  IF NEW.status = 'accepted' THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id, 'info',
      'Application Accepted',
      'Your application for "' || v_opp_title || '" has been accepted. Welcome aboard!',
      '/dashboard/opportunities'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id, 'info',
      'Application Update',
      'Your application for "' || v_opp_title || '" was not selected this time.',
      '/dashboard/opportunities'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_application_notify
  AFTER UPDATE OF status ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_status();

-- ── ANALYTICS RPC: admin dashboard stats ─────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'totalCampaigns',      (SELECT COUNT(*) FROM campaigns),
    'pendingReview',       (SELECT COUNT(*) FROM campaigns WHERE status = 'pending_review'),
    'activeCampaigns',     (SELECT COUNT(*) FROM campaigns WHERE status IN ('approved','active')),
    'completedCampaigns',  (SELECT COUNT(*) FROM campaigns WHERE status = 'completed'),
    'totalUsers',          (SELECT COUNT(*) FROM users),
    'totalBeneficiaries',  (SELECT COUNT(*) FROM users WHERE role = 'beneficiary'),
    'totalSponsors',       (SELECT COUNT(*) FROM users WHERE role = 'sponsor'),
    'totalVolunteers',     (SELECT COUNT(*) FROM users WHERE role = 'volunteer'),
    'totalLeaders',        (SELECT COUNT(*) FROM users WHERE role = 'community_leader'),
    'totalRaised',         COALESCE((SELECT SUM(amount) FROM donations WHERE status = 'completed'), 0),
    'familiesSupported',   COALESCE((SELECT SUM(household_size) FROM beneficiaries WHERE status = 'active'), 0),
    'pendingCampaigns',    (
      SELECT json_agg(row_to_json(c))
      FROM (
        SELECT ca.id, ca.title, ca.category, ca.community, ca.created_at,
               u.full_name AS leader_name
        FROM campaigns ca
        JOIN users u ON u.id = ca.leader_id
        WHERE ca.status = 'pending_review'
        ORDER BY ca.created_at ASC
        LIMIT 10
      ) c
    ),
    'monthlyDonations',    (
      SELECT json_agg(row_to_json(m))
      FROM (
        SELECT
          TO_CHAR(DATE_TRUNC('month', donated_at), 'Mon YYYY') AS month,
          SUM(amount)                                           AS total,
          COUNT(*)                                             AS count
        FROM donations
        WHERE status = 'completed'
          AND donated_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', donated_at)
        ORDER BY DATE_TRUNC('month', donated_at) ASC
      ) m
    )
  );
$$;

-- ── ANALYTICS RPC: community leader stats ────────────────────
CREATE OR REPLACE FUNCTION public.get_leader_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'totalCampaigns',    (SELECT COUNT(*) FROM campaigns WHERE leader_id = auth.uid()),
    'activeCampaigns',   (SELECT COUNT(*) FROM campaigns WHERE leader_id = auth.uid() AND status IN ('approved','active')),
    'totalRaised',       COALESCE((
      SELECT SUM(d.amount)
      FROM donations d
      JOIN campaigns c ON c.id = d.campaign_id
      WHERE c.leader_id = auth.uid() AND d.status = 'completed'
    ), 0),
    'totalDonors',       COALESCE((
      SELECT COUNT(DISTINCT d.sponsor_id)
      FROM donations d
      JOIN campaigns c ON c.id = d.campaign_id
      WHERE c.leader_id = auth.uid() AND d.status = 'completed'
    ), 0),
    'totalBeneficiaries', (
      SELECT COALESCE(SUM(beneficiary_count), 0) FROM campaigns WHERE leader_id = auth.uid()
    ),
    'campaigns',          (
      SELECT json_agg(row_to_json(c))
      FROM (
        SELECT id, title, status, category, raised_amount, target_amount, progress_percent,
               donor_count, beneficiary_count, cover_image, created_at
        FROM campaigns
        WHERE leader_id = auth.uid()
        ORDER BY created_at DESC
      ) c
    ),
    'monthlyDonations',   (
      SELECT json_agg(row_to_json(m))
      FROM (
        SELECT
          TO_CHAR(DATE_TRUNC('month', d.donated_at), 'Mon YYYY') AS month,
          SUM(d.amount)                                           AS total,
          COUNT(*)                                               AS count
        FROM donations d
        JOIN campaigns c ON c.id = d.campaign_id
        WHERE c.leader_id = auth.uid()
          AND d.status = 'completed'
          AND d.donated_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', d.donated_at)
        ORDER BY DATE_TRUNC('month', d.donated_at) ASC
      ) m
    )
  );
$$;

-- ── ANALYTICS RPC: sponsor stats ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_sponsor_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'totalDonated',         COALESCE((
      SELECT SUM(amount) FROM donations
      WHERE sponsor_id = auth.uid() AND status = 'completed'
    ), 0),
    'campaignsSupported',   COALESCE((
      SELECT COUNT(DISTINCT campaign_id) FROM donations WHERE sponsor_id = auth.uid()
    ), 0),
    'totalDonations',       (SELECT COUNT(*) FROM donations WHERE sponsor_id = auth.uid()),
    'recentDonations',      (
      SELECT json_agg(row_to_json(d))
      FROM (
        SELECT
          dn.id, dn.amount, dn.currency, dn.status, dn.payment_method,
          dn.is_anonymous, dn.donated_at,
          c.id         AS campaign_id,
          c.title      AS campaign_title,
          c.cover_image AS campaign_cover_image,
          c.category   AS campaign_category
        FROM donations dn
        JOIN campaigns c ON c.id = dn.campaign_id
        WHERE dn.sponsor_id = auth.uid()
        ORDER BY dn.donated_at DESC
        LIMIT 20
      ) d
    ),
    'monthlyDonations',     (
      SELECT json_agg(row_to_json(m))
      FROM (
        SELECT
          TO_CHAR(DATE_TRUNC('month', donated_at), 'Mon YYYY') AS month,
          SUM(amount)                                           AS total,
          COUNT(*)                                             AS count
        FROM donations
        WHERE sponsor_id = auth.uid()
          AND status = 'completed'
          AND donated_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', donated_at)
        ORDER BY DATE_TRUNC('month', donated_at) ASC
      ) m
    )
  );
$$;
