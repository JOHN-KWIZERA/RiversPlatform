-- ============================================================
-- RIVERS PLATFORM — Initial Schema
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- Users (extends auth.users — one row per authenticated user)
CREATE TABLE public.users (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT        NOT NULL DEFAULT '',
  email         TEXT        NOT NULL UNIQUE,
  role          TEXT        NOT NULL DEFAULT 'beneficiary'
                            CHECK (role IN ('admin','community_leader','sponsor','volunteer','beneficiary')),
  avatar        TEXT        NOT NULL DEFAULT '',
  phone         TEXT        NOT NULL DEFAULT '',
  location      TEXT        NOT NULL DEFAULT '',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  is_verified   BOOLEAN     NOT NULL DEFAULT false,
  organisation  TEXT        NOT NULL DEFAULT '',
  community     TEXT        NOT NULL DEFAULT '',
  access_level  TEXT        NOT NULL DEFAULT 'standard',
  skills        TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns
CREATE TABLE public.campaigns (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id            UUID        NOT NULL REFERENCES public.users(id),
  title                TEXT        NOT NULL,
  description          TEXT        NOT NULL DEFAULT '',
  category             TEXT        NOT NULL
                                   CHECK (category IN ('education','healthcare','food_security','emergency','housing','youth_employment')),
  target_amount        NUMERIC     NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  raised_amount        NUMERIC     NOT NULL DEFAULT 0,
  currency             TEXT        NOT NULL DEFAULT 'RWF',
  status               TEXT        NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft','pending_review','approved','rejected','active','completed','paused')),
  community            TEXT        NOT NULL DEFAULT '',
  sector               TEXT        NOT NULL DEFAULT '',
  district             TEXT        NOT NULL DEFAULT '',
  cover_image          TEXT        NOT NULL DEFAULT '',
  images               TEXT[]      NOT NULL DEFAULT '{}',
  beneficiary_count    INTEGER     NOT NULL DEFAULT 0,
  donor_count          INTEGER     NOT NULL DEFAULT 0,
  start_date           TIMESTAMPTZ,
  end_date             TIMESTAMPTZ,
  admin_note           TEXT        NOT NULL DEFAULT '',
  approved_by          UUID        REFERENCES public.users(id),
  approved_at          TIMESTAMPTZ,
  verification_evidence JSONB      NOT NULL DEFAULT '[]',
  tags                 TEXT[]      NOT NULL DEFAULT '{}',
  is_urgent            BOOLEAN     NOT NULL DEFAULT false,
  is_featured          BOOLEAN     NOT NULL DEFAULT false,
  progress_percent     NUMERIC     GENERATED ALWAYS AS (
                         CASE WHEN target_amount > 0
                           THEN LEAST(ROUND((raised_amount / target_amount * 100)::numeric, 0), 100)
                           ELSE 0
                         END
                       ) STORED,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Donations
CREATE TABLE public.donations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id     UUID        NOT NULL REFERENCES public.users(id),
  campaign_id    UUID        NOT NULL REFERENCES public.campaigns(id),
  amount         NUMERIC     NOT NULL CHECK (amount >= 1),
  currency       TEXT        NOT NULL DEFAULT 'RWF',
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','completed','failed','refunded')),
  payment_method TEXT        NOT NULL DEFAULT 'mobile_money'
                             CHECK (payment_method IN ('mobile_money','bank_transfer','card','cash')),
  payment_ref    TEXT        NOT NULL DEFAULT '',
  receipt_url    TEXT        NOT NULL DEFAULT '',
  message        TEXT        NOT NULL DEFAULT '',
  is_anonymous   BOOLEAN     NOT NULL DEFAULT false,
  donated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Beneficiaries
CREATE TABLE public.beneficiaries (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL UNIQUE REFERENCES public.users(id),
  needs_category     TEXT        CHECK (needs_category IN ('education','healthcare','food_security','housing','youth_employment','emergency','other')),
  household_size     INTEGER     NOT NULL DEFAULT 1,
  district           TEXT        NOT NULL DEFAULT '',
  sector             TEXT        NOT NULL DEFAULT '',
  background         TEXT        NOT NULL DEFAULT '',
  status             TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','graduated','inactive')),
  enrolled_campaigns UUID[]      NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Beneficiary assistance history
CREATE TABLE public.beneficiary_assistance (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id  UUID        NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
  date            TIMESTAMPTZ NOT NULL,
  type            TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  amount          NUMERIC     NOT NULL DEFAULT 0,
  campaign_id     UUID        REFERENCES public.campaigns(id),
  recorded_by     UUID        NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Beneficiary progress updates
CREATE TABLE public.beneficiary_progress (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id  UUID        NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
  date            TIMESTAMPTZ NOT NULL,
  title           TEXT        NOT NULL,
  notes           TEXT        NOT NULL DEFAULT '',
  recorded_by     UUID        NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunities
CREATE TABLE public.opportunities (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  campaign_id UUID        REFERENCES public.campaigns(id),
  community   TEXT        NOT NULL DEFAULT '',
  district    TEXT        NOT NULL DEFAULT '',
  skills      TEXT[]      NOT NULL DEFAULT '{}',
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ NOT NULL,
  slots       INTEGER     NOT NULL DEFAULT 10,
  filled_slots INTEGER    NOT NULL DEFAULT 0,
  status      TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  created_by  UUID        NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Volunteer applications
CREATE TABLE public.volunteer_applications (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id          UUID        NOT NULL REFERENCES public.opportunities(id),
  user_id                 UUID        NOT NULL REFERENCES public.users(id),
  phone                   TEXT        NOT NULL DEFAULT '',
  linked_in               TEXT        NOT NULL DEFAULT '',
  languages               TEXT[]      NOT NULL DEFAULT '{}',
  emergency_contact_name  TEXT        NOT NULL DEFAULT '',
  emergency_contact_phone TEXT        NOT NULL DEFAULT '',
  cv_url                  TEXT        NOT NULL DEFAULT '',
  id_document_url         TEXT        NOT NULL DEFAULT '',
  cover_letter            TEXT        NOT NULL DEFAULT '',
  experience              TEXT        NOT NULL DEFAULT '',
  message                 TEXT        NOT NULL DEFAULT '',
  available_from          TIMESTAMPTZ,
  hours_per_week          INTEGER,
  status                  TEXT        NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  applied_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, user_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL
             CHECK (type IN ('campaign_approved','campaign_rejected','donation_received','campaign_milestone','campaign_created','info')),
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  link       TEXT        NOT NULL DEFAULT '',
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID        NOT NULL REFERENCES public.users(id),
  actor_name   TEXT        NOT NULL DEFAULT '',
  action       TEXT        NOT NULL,
  target_type  TEXT        NOT NULL DEFAULT '',
  target_id    UUID,
  target_label TEXT        NOT NULL DEFAULT '',
  metadata     JSONB       NOT NULL DEFAULT '{}',
  ip           TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Impact reports
CREATE TABLE public.impact_reports (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id        UUID        NOT NULL REFERENCES public.campaigns(id),
  admin_id           UUID        NOT NULL REFERENCES public.users(id),
  summary            TEXT        NOT NULL DEFAULT '',
  funds_used         NUMERIC     NOT NULL DEFAULT 0,
  families_supported INTEGER     NOT NULL DEFAULT 0,
  youth_employed     INTEGER     NOT NULL DEFAULT 0,
  outcomes           JSONB       NOT NULL DEFAULT '[]',
  evidence           JSONB       NOT NULL DEFAULT '[]',
  is_published       BOOLEAN     NOT NULL DEFAULT false,
  generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verification reports
CREATE TABLE public.verification_reports (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id           UUID        NOT NULL REFERENCES public.users(id),
  campaign_id         UUID        NOT NULL REFERENCES public.campaigns(id),
  evidence            JSONB       NOT NULL DEFAULT '[]',
  narrative           TEXT        NOT NULL DEFAULT '',
  beneficiary_details JSONB       NOT NULL DEFAULT '[]',
  status              TEXT        NOT NULL DEFAULT 'submitted'
                                  CHECK (status IN ('submitted','under_review','approved','rejected')),
  reviewed_by         UUID        REFERENCES public.users(id),
  review_note         TEXT        NOT NULL DEFAULT '',
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_campaigns_leader_id   ON public.campaigns (leader_id);
CREATE INDEX idx_campaigns_status      ON public.campaigns (status);
CREATE INDEX idx_campaigns_category    ON public.campaigns (category);
CREATE INDEX idx_campaigns_community   ON public.campaigns (community);
CREATE INDEX idx_donations_sponsor_id  ON public.donations (sponsor_id);
CREATE INDEX idx_donations_campaign_id ON public.donations (campaign_id);
CREATE INDEX idx_donations_status      ON public.donations (status);
CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX idx_notifications_read    ON public.notifications (user_id, read);
CREATE INDEX idx_audit_logs_actor_id   ON public.audit_logs (actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_action     ON public.audit_logs (action, created_at DESC);
CREATE INDEX idx_volunteer_apps_user   ON public.volunteer_applications (user_id);
CREATE INDEX idx_volunteer_apps_opp    ON public.volunteer_applications (opportunity_id);
CREATE INDEX idx_beneficiaries_user    ON public.beneficiaries (user_id);
