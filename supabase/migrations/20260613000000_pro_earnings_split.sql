-- ============================================================
-- Pro earnings split: platform keeps 30%, pro receives 70% net.
--
-- The split is computed SERVER-SIDE via a trigger when a job
-- transitions into 'completed'. Doing it here (instead of in client
-- code) means a pro cannot tamper with the amount they are credited —
-- the platform's 30% cut is always enforced, and the customer never
-- sees any fee breakdown (they only ever paid the flat price).
--
-- All amounts are in paise (₹ × 100), matching jobs.paid_amount.
-- ============================================================

-- One earnings row per job — makes completion idempotent if the job
-- status is written more than once.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_earnings_job ON earnings (job_id);

-- Track where the pro's payout is in its lifecycle so the dashboard can
-- show "Pending", "Requested", or "Paid".
ALTER TABLE earnings
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'pending'
    CHECK (payout_status IN ('pending', 'requested', 'paid')),
  ADD COLUMN IF NOT EXISTS requested_at timestamptz;

-- ── Split function ──────────────────────────────────────────
-- Platform commission is held in basis points so the rate is easy to
-- audit / change in one place. 3000 bps = 30.00%.
CREATE OR REPLACE FUNCTION create_earning_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gross      integer;
  v_commission integer;
  v_net        integer;
  v_fee_bps    integer := 3000;   -- 30% platform cut
BEGIN
  IF NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.pro_id IS NOT NULL THEN

    -- Prefer the actually-paid amount; fall back to escrow for legacy rows.
    v_gross := COALESCE(NEW.paid_amount, NEW.escrow_amount, 0);

    IF v_gross > 0 THEN
      v_commission := round(v_gross * v_fee_bps / 10000.0);
      v_net        := v_gross - v_commission;

      INSERT INTO earnings (pro_id, job_id, gross_amount, commission_amount, net_payout, payout_status)
      VALUES (NEW.pro_id, NEW.id, v_gross, v_commission, v_net, 'pending')
      ON CONFLICT (job_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_earning_on_completion ON jobs;
CREATE TRIGGER trg_create_earning_on_completion
  AFTER UPDATE OF status ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION create_earning_on_completion();

-- ── Withdrawal request ──────────────────────────────────────
-- Lets a pro request payout of their pending (unpaid) earnings. Flips
-- those rows to 'requested'; actual bank transfer is settled out of band.
-- SECURITY DEFINER + the explicit pro_id = auth.uid() guard means a pro
-- can only ever move their OWN earnings.
CREATE OR REPLACE FUNCTION request_earnings_withdrawal()
RETURNS TABLE (requested_count integer, requested_amount integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count  integer;
  v_amount integer;
BEGIN
  WITH updated AS (
    UPDATE earnings
       SET payout_status = 'requested',
           requested_at  = now()
     WHERE pro_id = auth.uid()
       AND payout_status = 'pending'
       AND paid_at IS NULL
    RETURNING net_payout
  )
  SELECT count(*)::integer, COALESCE(sum(net_payout), 0)::integer
    INTO v_count, v_amount
    FROM updated;

  RETURN QUERY SELECT v_count, v_amount;
END;
$$;

REVOKE ALL ON FUNCTION request_earnings_withdrawal() FROM public;
GRANT EXECUTE ON FUNCTION request_earnings_withdrawal() TO authenticated;
