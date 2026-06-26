-- Recurring donation preferences — Stage 3
CREATE TABLE IF NOT EXISTS recurring_donations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id      uuid REFERENCES users(id) NOT NULL,
  campaign_id     uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),
  currency        text NOT NULL DEFAULT 'RWF',
  frequency       text NOT NULL DEFAULT 'monthly', -- monthly | quarterly
  status          text NOT NULL DEFAULT 'active',  -- active | paused | cancelled
  next_due_date   date,
  last_charged_at timestamptz,
  total_given     numeric(12,2) NOT NULL DEFAULT 0,
  charge_count    int NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(sponsor_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_recurring_sponsor ON recurring_donations(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_campaign ON recurring_donations(campaign_id);

ALTER TABLE recurring_donations ENABLE ROW LEVEL SECURITY;

-- Sponsor can only see their own
CREATE POLICY "recurring_select" ON recurring_donations FOR SELECT USING (
  sponsor_id = auth.uid() OR my_role() = 'admin'
);

CREATE POLICY "recurring_insert" ON recurring_donations FOR INSERT WITH CHECK (
  sponsor_id = auth.uid()
);

CREATE POLICY "recurring_update" ON recurring_donations FOR UPDATE USING (
  sponsor_id = auth.uid() OR my_role() = 'admin'
);

CREATE POLICY "recurring_delete" ON recurring_donations FOR DELETE USING (
  sponsor_id = auth.uid() OR my_role() = 'admin'
);
