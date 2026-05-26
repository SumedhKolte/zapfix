ALTER TABLE pro_details
  ADD COLUMN IF NOT EXISTS onboarding_step text NOT NULL DEFAULT 'identity';

ALTER TABLE pro_details
  DROP CONSTRAINT IF EXISTS pro_details_onboarding_step_check;

ALTER TABLE pro_details
  ADD CONSTRAINT pro_details_onboarding_step_check
  CHECK (onboarding_step IN ('identity', 'skills', 'interview', 'toolkit', 'inventory', 'complete'));

DROP POLICY IF EXISTS "pro_inventory: insert own" ON pro_inventory;

CREATE POLICY "pro_inventory: insert own" ON pro_inventory
  FOR INSERT WITH CHECK (auth.uid() = pro_id);
