-- ============================================================
-- RIVERS PLATFORM — Row Level Security Policies
-- ============================================================

-- Enable RLS on every table
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_assistance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_reports   ENABLE ROW LEVEL SECURITY;

-- Helper: get the current user's role (runs as DEFINER so it can read users table)
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ── USERS ────────────────────────────────────────────────────
-- All authenticated users can read profiles (needed for campaign leader info, etc.)
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Users update only their own row; admin can update any
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.my_role() = 'admin')
  WITH CHECK (id = auth.uid() OR public.my_role() = 'admin');

-- Insert handled by trigger; allow service role only
CREATE POLICY "users_insert_trigger"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ── CAMPAIGNS ────────────────────────────────────────────────
-- Public can browse approved/active/completed campaigns
CREATE POLICY "campaigns_select_public"
  ON public.campaigns FOR SELECT
  USING (status IN ('approved','active','completed'));

-- Authenticated users see their own campaigns regardless of status
CREATE POLICY "campaigns_select_own"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (leader_id = auth.uid());

-- Admins see everything
CREATE POLICY "campaigns_select_admin"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (public.my_role() = 'admin');

-- Community leaders can create campaigns
CREATE POLICY "campaigns_insert"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    public.my_role() IN ('community_leader','admin')
    AND leader_id = auth.uid()
  );

-- Leaders update their own campaigns; admins update any
CREATE POLICY "campaigns_update"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (leader_id = auth.uid() OR public.my_role() = 'admin')
  WITH CHECK (leader_id = auth.uid() OR public.my_role() = 'admin');

-- ── DONATIONS ────────────────────────────────────────────────
-- Sponsors see their own donations
CREATE POLICY "donations_select_own"
  ON public.donations FOR SELECT
  TO authenticated
  USING (sponsor_id = auth.uid());

-- Leaders see donations to their campaigns
CREATE POLICY "donations_select_leader"
  ON public.donations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.leader_id = auth.uid()
    )
  );

-- Admins see all
CREATE POLICY "donations_select_admin"
  ON public.donations FOR SELECT
  TO authenticated
  USING (public.my_role() = 'admin');

-- Sponsors and leaders can create donations
CREATE POLICY "donations_insert"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.my_role() IN ('sponsor','community_leader','admin')
    AND sponsor_id = auth.uid()
  );

-- ── BENEFICIARIES ─────────────────────────────────────────────
-- Beneficiaries see their own profile
CREATE POLICY "beneficiaries_select_own"
  ON public.beneficiaries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Leaders and admins see all
CREATE POLICY "beneficiaries_select_staff"
  ON public.beneficiaries FOR SELECT
  TO authenticated
  USING (public.my_role() IN ('admin','community_leader'));

-- Beneficiaries insert/update their own profile
CREATE POLICY "beneficiaries_insert_own"
  ON public.beneficiaries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.my_role() = 'admin');

CREATE POLICY "beneficiaries_update_own"
  ON public.beneficiaries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.my_role() IN ('admin','community_leader'))
  WITH CHECK (user_id = auth.uid() OR public.my_role() IN ('admin','community_leader'));

-- ── BENEFICIARY ASSISTANCE ───────────────────────────────────
CREATE POLICY "assistance_select"
  ON public.beneficiary_assistance FOR SELECT
  TO authenticated
  USING (
    public.my_role() IN ('admin','community_leader')
    OR EXISTS (SELECT 1 FROM public.beneficiaries b WHERE b.id = beneficiary_id AND b.user_id = auth.uid())
  );

CREATE POLICY "assistance_insert"
  ON public.beneficiary_assistance FOR INSERT
  TO authenticated
  WITH CHECK (
    public.my_role() IN ('admin','community_leader')
    AND recorded_by = auth.uid()
  );

-- ── BENEFICIARY PROGRESS ─────────────────────────────────────
CREATE POLICY "progress_select"
  ON public.beneficiary_progress FOR SELECT
  TO authenticated
  USING (
    public.my_role() IN ('admin','community_leader')
    OR EXISTS (SELECT 1 FROM public.beneficiaries b WHERE b.id = beneficiary_id AND b.user_id = auth.uid())
  );

CREATE POLICY "progress_insert"
  ON public.beneficiary_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    public.my_role() IN ('admin','community_leader')
    AND recorded_by = auth.uid()
  );

-- ── OPPORTUNITIES ─────────────────────────────────────────────
-- Public can read open opportunities
CREATE POLICY "opportunities_select_public"
  ON public.opportunities FOR SELECT
  USING (status = 'open');

-- Authenticated users see all (to manage their applications)
CREATE POLICY "opportunities_select_auth"
  ON public.opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "opportunities_insert"
  ON public.opportunities FOR INSERT
  TO authenticated
  WITH CHECK (
    public.my_role() IN ('admin','community_leader')
    AND created_by = auth.uid()
  );

CREATE POLICY "opportunities_update"
  ON public.opportunities FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.my_role() = 'admin')
  WITH CHECK (created_by = auth.uid() OR public.my_role() = 'admin');

-- ── VOLUNTEER APPLICATIONS ───────────────────────────────────
-- Users see their own applications
CREATE POLICY "applications_select_own"
  ON public.volunteer_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Leaders/admins see all applications for their opportunities
CREATE POLICY "applications_select_staff"
  ON public.volunteer_applications FOR SELECT
  TO authenticated
  USING (
    public.my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_id AND o.created_by = auth.uid()
    )
  );

CREATE POLICY "applications_insert"
  ON public.volunteer_applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Applicants can withdraw; leaders/admins can accept/reject
CREATE POLICY "applications_update"
  ON public.volunteer_applications FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_id AND o.created_by = auth.uid()
    )
  );

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Triggers insert notifications; allow service role.
-- Also allow authenticated inserts so the client can create info notifications.
CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── AUDIT LOGS ────────────────────────────────────────────────
CREATE POLICY "audit_logs_select"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.my_role() = 'admin');

CREATE POLICY "audit_logs_insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- ── IMPACT REPORTS ────────────────────────────────────────────
CREATE POLICY "impact_reports_select_public"
  ON public.impact_reports FOR SELECT
  USING (is_published = true);

CREATE POLICY "impact_reports_select_admin"
  ON public.impact_reports FOR SELECT
  TO authenticated
  USING (public.my_role() = 'admin');

CREATE POLICY "impact_reports_insert"
  ON public.impact_reports FOR INSERT
  TO authenticated
  WITH CHECK (public.my_role() = 'admin' AND admin_id = auth.uid());

CREATE POLICY "impact_reports_update"
  ON public.impact_reports FOR UPDATE
  TO authenticated
  USING (public.my_role() = 'admin');

-- ── VERIFICATION REPORTS ──────────────────────────────────────
CREATE POLICY "verification_reports_select"
  ON public.verification_reports FOR SELECT
  TO authenticated
  USING (
    leader_id = auth.uid()
    OR public.my_role() = 'admin'
  );

CREATE POLICY "verification_reports_insert"
  ON public.verification_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    public.my_role() IN ('community_leader','admin')
    AND leader_id = auth.uid()
  );

CREATE POLICY "verification_reports_update"
  ON public.verification_reports FOR UPDATE
  TO authenticated
  USING (leader_id = auth.uid() OR public.my_role() = 'admin');

-- ── STORAGE ───────────────────────────────────────────────────
-- Allow authenticated users to upload to rivers-uploads bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('rivers-uploads', 'rivers-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rivers-uploads');

CREATE POLICY "storage_insert_auth"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'rivers-uploads');

CREATE POLICY "storage_update_auth"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'rivers-uploads');

CREATE POLICY "storage_delete_auth"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'rivers-uploads');
