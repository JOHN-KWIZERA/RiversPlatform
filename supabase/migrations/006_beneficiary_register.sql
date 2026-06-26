-- Anonymised beneficiary register — Surface B
CREATE TABLE IF NOT EXISTS beneficiary_register (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id          uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  recorded_by          uuid REFERENCES users(id) NOT NULL,
  record_id            text NOT NULL,          -- e.g. BNF-001 (never a real name)
  age_band             text NOT NULL DEFAULT '',-- e.g. '8–10 yrs'
  grade                text NOT NULL DEFAULT '',-- e.g. 'P4'
  kit_type             text NOT NULL DEFAULT 'full', -- 'full' | 'core'
  received_at          date,
  expenditure_id       uuid REFERENCES expenditures(id) ON DELETE SET NULL,
  is_verified          boolean NOT NULL DEFAULT false,
  verified_at          timestamptz,
  delivery_confirmed   boolean NOT NULL DEFAULT false,
  confirmation_note    text NOT NULL DEFAULT '',
  notes                text NOT NULL DEFAULT '',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beneficiary_register_campaign ON beneficiary_register(campaign_id);

ALTER TABLE beneficiary_register ENABLE ROW LEVEL SECURITY;

-- Public can read (anonymised, no real names stored)
CREATE POLICY "ben_register_select" ON beneficiary_register FOR SELECT USING (true);

-- Only the campaign leader can insert
CREATE POLICY "ben_register_insert" ON beneficiary_register FOR INSERT WITH CHECK (
  recorded_by = auth.uid() AND
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND leader_id = auth.uid())
);

-- Leader or admin can update
CREATE POLICY "ben_register_update" ON beneficiary_register FOR UPDATE USING (
  recorded_by = auth.uid() OR my_role() = 'admin'
);

-- Leader or admin can delete
CREATE POLICY "ben_register_delete" ON beneficiary_register FOR DELETE USING (
  recorded_by = auth.uid() OR my_role() = 'admin'
);
