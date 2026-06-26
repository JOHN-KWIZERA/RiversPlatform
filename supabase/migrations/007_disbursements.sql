-- Staged disbursement milestones — Stage 4
CREATE TABLE IF NOT EXISTS disbursement_milestones (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id          uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  created_by           uuid REFERENCES users(id) NOT NULL,
  title                text NOT NULL,
  description          text NOT NULL DEFAULT '',
  target_amount        numeric(12,2) NOT NULL CHECK (target_amount > 0),
  order_index          int NOT NULL DEFAULT 0,
  status               text NOT NULL DEFAULT 'pending', -- pending | proof_submitted | released
  proof_url            text NOT NULL DEFAULT '',
  proof_note           text NOT NULL DEFAULT '',
  proof_submitted_at   timestamptz,
  released_at          timestamptz,
  released_by          uuid REFERENCES users(id),
  due_date             date,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disbursements_campaign ON disbursement_milestones(campaign_id);

ALTER TABLE disbursement_milestones ENABLE ROW LEVEL SECURITY;

-- Public can read milestones (transparency)
CREATE POLICY "disbursement_select" ON disbursement_milestones FOR SELECT USING (true);

-- Campaign leader can create milestones
CREATE POLICY "disbursement_insert" ON disbursement_milestones FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND leader_id = auth.uid())
);

-- Leader can update (to submit proof); admin can release
CREATE POLICY "disbursement_update" ON disbursement_milestones FOR UPDATE USING (
  created_by = auth.uid() OR my_role() = 'admin'
);

CREATE POLICY "disbursement_delete" ON disbursement_milestones FOR DELETE USING (
  created_by = auth.uid() OR my_role() = 'admin'
);
