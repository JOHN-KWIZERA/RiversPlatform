-- Expenditure logging — the engine room of Surface A (money-to-impact trace)
CREATE TABLE IF NOT EXISTS expenditures (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  recorded_by      uuid REFERENCES users(id) NOT NULL,
  amount           numeric(12,2) NOT NULL CHECK (amount > 0),
  description      text NOT NULL,
  category         text NOT NULL DEFAULT 'supplies',
  date             date NOT NULL,
  receipt_url      text NOT NULL DEFAULT '',
  delivery_note    text NOT NULL DEFAULT '',
  beneficiary_count int NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenditures_campaign ON expenditures(campaign_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_recorded_by ON expenditures(recorded_by);

-- RLS
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;

-- Anyone can view expenditures (public accountability)
CREATE POLICY "expenditures_select" ON expenditures
  FOR SELECT USING (true);

-- Only the campaign's own leader can insert
CREATE POLICY "expenditures_insert" ON expenditures
  FOR INSERT WITH CHECK (
    recorded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE id = campaign_id AND leader_id = auth.uid()
    )
  );

-- Leader who recorded it, or admin, can update
CREATE POLICY "expenditures_update" ON expenditures
  FOR UPDATE USING (
    recorded_by = auth.uid() OR my_role() = 'admin'
  );

-- Leader who recorded it, or admin, can delete
CREATE POLICY "expenditures_delete" ON expenditures
  FOR DELETE USING (
    recorded_by = auth.uid() OR my_role() = 'admin'
  );
