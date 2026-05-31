-- Cashfree payment columns on jobs.
-- Customers pay BEFORE a Pro is matched (pre-auth pattern). The job row is
-- only inserted once Cashfree returns a paid status, so we store the
-- references on the same row rather than a separate payments table.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS cf_order_id           text,
  ADD COLUMN IF NOT EXISTS cf_payment_session_id text,
  ADD COLUMN IF NOT EXISTS cf_payment_id         text,
  ADD COLUMN IF NOT EXISTS payment_status        text
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS paid_amount           integer, -- in paise
  ADD COLUMN IF NOT EXISTS paid_at               timestamptz,
  ADD COLUMN IF NOT EXISTS fixed_issue_key       text,    -- maps to constants/pricing.ts
  ADD COLUMN IF NOT EXISTS service_category      text;    -- 'AC Repair' etc., for fixed-price flow

CREATE INDEX IF NOT EXISTS idx_jobs_cf_order_id ON jobs(cf_order_id);
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON jobs(payment_status);
