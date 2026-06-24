-- Add is_archived flag to campaigns and opportunities
ALTER TABLE campaigns     ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_campaigns_is_archived     ON campaigns(is_archived);
CREATE INDEX IF NOT EXISTS idx_opportunities_is_archived ON opportunities(is_archived);
