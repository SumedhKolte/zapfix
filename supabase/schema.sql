-- RLS policies (comments only)
-- profiles: users can read/write only their own row
-- jobs: customers can read jobs where customer_id = auth.uid(), pros can read jobs where pro_id = auth.uid() OR status = 'searching'
-- pro_details: pros can read/write own row, customers cannot read any pro_details rows
-- notifications: users can only read their own notifications
-- reviews: authenticated users can insert, read their own given and received reviews
-- earnings: pros can only read their own earnings rows
-- warranties: customers can read warranties where job.customer_id = auth.uid()
-- ============================================================
-- PRONTO AI — Complete Database Schema
-- Compatible with: Supabase (PostgreSQL + PostGIS + pgvector)
-- Notes:
--   • All monetary values stored in paise (₹ × 100)
--   • All timestamps are timestamptz (timezone-aware)
--   • Run this in the Supabase SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('customer', 'pro');

CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'failed');

CREATE TYPE job_status AS ENUM (
  'pending_diagnosis',
  'diagnosing',
  'matching',
  'pro_assigned',
  'pro_en_route',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
);

CREATE TYPE match_outcome AS ENUM ('accepted', 'declined', 'timeout');

CREATE TYPE media_entity_type AS ENUM (
  'job_before',
  'job_after',
  'pro_toolkit',
  'pro_selfie',
  'pro_aadhaar'
);

CREATE TYPE warranty_status AS ENUM ('active', 'expired', 'claimed');

CREATE TYPE dispute_status AS ENUM ('open', 'resolved', 'refunded');

CREATE TYPE notification_type AS ENUM (
  'job_update',
  'payment',
  'warranty_expiry',
  'promo'
);

-- ============================================================
-- SECTION 1: Auth & Profiles
-- ============================================================

-- profiles
-- Extends Supabase auth.users (1-to-1 by id)
CREATE TABLE profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role           user_role        NOT NULL DEFAULT 'customer',
  phone_number   text             UNIQUE,          -- verified phone
  full_name      text,
  avatar_url     text,                             -- supabase storage url
  fcm_token      text,                             -- push notifications
  is_active      boolean          NOT NULL DEFAULT true,
  created_at     timestamptz      NOT NULL DEFAULT now(),
  updated_at     timestamptz      NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_phone_number ON profiles(phone_number);

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- pro_details
-- Extra info for users with role = 'pro'
CREATE TABLE pro_details (
  pro_id                 uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  aadhaar_ref            text,                     -- razorpay kyc ref only
  liveness_verified      boolean          DEFAULT false,
  ai_skill_score         numeric(3,1)     CHECK (ai_skill_score BETWEEN 1.0 AND 10.0),
  interview_transcript   jsonb,                    -- gemini q&a log
  tools_verified         boolean          DEFAULT false,
  tools_missing          text[],                   -- flagged missing tools
  current_location       geography(Point, 4326),   -- PostGIS point
  service_radius_km      integer          DEFAULT 10,
  decline_count          integer          DEFAULT 0,
  interview_locked_until timestamptz,              -- 48hr cooldown
  kyc_status             kyc_status       NOT NULL DEFAULT 'pending',
  bank_account_ref       text                      -- razorpay payout ref
);

-- ============================================================
-- SECTION 2: Pro Availability
-- ============================================================

-- pro_availability
CREATE TABLE pro_availability (
  pro_id             uuid PRIMARY KEY REFERENCES pro_details(pro_id) ON DELETE CASCADE,
  is_online          boolean      NOT NULL DEFAULT false,
  last_ping          timestamptz,                  -- updated every 60s
  current_job_id     uuid,                         -- null if free
  availability_hours jsonb                         -- {"mon": "9-18", ...}
);


-- earnings
CREATE TABLE earnings (
  id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  pro_id            uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id            uuid        NOT NULL,           -- FK to jobs.id (added after jobs table)
  gross_amount      integer     NOT NULL,           -- in paise
  commission_amount integer     NOT NULL,           -- 10% to pronto
  net_payout        integer     NOT NULL,           -- 90% to pro
  rzp_payout_id     text,                           -- razorpay ref
  paid_at           timestamptz                     -- null until released
);

-- ============================================================
-- SECTION 3: Catalogs (Admin-managed)
-- ============================================================

-- catalog_skills
CREATE TABLE catalog_skills (
  id           uuid     PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade        text     NOT NULL,        -- 'AC' | 'Electrical' etc.
  skill_name   text     NOT NULL,        -- e.g. Capacitor Repair
  skill_vector vector(1536),             -- pgvector embedding
  is_active    boolean  NOT NULL DEFAULT true
);


-- catalog_parts
CREATE TABLE catalog_parts (
  id            uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  category      text    NOT NULL,        -- 'AC' | 'Electrical' etc.
  part_name     text    NOT NULL,        -- e.g. 45mfd Capacitor
  part_number   text,                   -- optional SKU
  avg_price_inr integer,                -- for cost estimates (in paise)
  is_active     boolean NOT NULL DEFAULT true
);


-- service_areas
CREATE TABLE service_areas (
  id        uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  city      text    NOT NULL,   -- e.g. Mumbai
  area_name text    NOT NULL,   -- e.g. Andheri West
  pincode   text,
  is_active boolean NOT NULL DEFAULT true
);

-- ============================================================
-- SECTION 4: Pro Skills & Inventory (Junction Tables)
-- ============================================================

-- pro_skills  (composite PK)
CREATE TABLE pro_skills (
  pro_id      uuid        NOT NULL REFERENCES pro_details(pro_id) ON DELETE CASCADE,
  skill_id    uuid        NOT NULL REFERENCES catalog_skills(id) ON DELETE CASCADE,
  years_exp   integer,
  verified_at timestamptz,
  PRIMARY KEY (pro_id, skill_id)
);


-- pro_inventory  (composite PK)
CREATE TABLE pro_inventory (
  pro_id       uuid        NOT NULL REFERENCES pro_details(pro_id) ON DELETE CASCADE,
  part_id      uuid        NOT NULL REFERENCES catalog_parts(id) ON DELETE CASCADE,
  quantity     integer     NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pro_id, part_id)
);

CREATE OR REPLACE FUNCTION set_pro_inventory_updated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pro_inventory_updated
  BEFORE UPDATE ON pro_inventory
  FOR EACH ROW EXECUTE FUNCTION set_pro_inventory_updated();


-- customer_addresses
CREATE TABLE customer_addresses (
  id           uuid                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  uuid                    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label        text,                               -- 'Home' | 'Office'
  address_text text,
  location     geography(Point, 4326),             -- PostGIS point
  is_default   boolean                 NOT NULL DEFAULT false
);

-- ============================================================
-- SECTION 5: Jobs Pipeline
-- ============================================================

-- jobs  (core transaction table)
CREATE TABLE jobs (
  id                     uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id            uuid         NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  pro_id                 uuid                  REFERENCES profiles(id) ON DELETE SET NULL,  -- nullable until matched
  status                 job_status   NOT NULL DEFAULT 'pending_diagnosis',
  ai_diagnosis           text,                     -- gemini output text
  ai_confidence          integer      CHECK (ai_confidence BETWEEN 0 AND 100),
  ai_raw_response        jsonb,                    -- full gemini payload
  required_skill_id      uuid                  REFERENCES catalog_skills(id),
  required_part_id       uuid                  REFERENCES catalog_parts(id),
  est_cost_min           integer,                  -- in paise
  est_cost_max           integer,                  -- in paise
  final_cost             integer,                  -- set on completion
  escrow_amount          integer,                  -- locked via razorpay
  rzp_order_id           text,                     -- razorpay order ref
  rzp_payment_id         text,                     -- on capture
  address_id             uuid                  REFERENCES customer_addresses(id),
  job_location           geography(Point, 4326),   -- denormalized point
  customer_problem_text  text,                     -- raw input from user
  diagnosis_feedback     boolean,                  -- was AI correct?
  created_at             timestamptz  NOT NULL DEFAULT now(),
  matched_at             timestamptz,
  arrived_at             timestamptz,              -- pro tapped arrived
  completed_at           timestamptz               -- triggers warranty
);

CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_pro_id      ON jobs(pro_id);

-- Now that jobs exists, add FK from earnings.job_id
ALTER TABLE earnings
  ADD CONSTRAINT fk_earnings_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT;

-- Also add FK from pro_availability.current_job_id
ALTER TABLE pro_availability
  ADD CONSTRAINT fk_pro_availability_current_job FOREIGN KEY (current_job_id) REFERENCES jobs(id) ON DELETE SET NULL;


-- matching_log  (analytics goldmine)
CREATE TABLE matching_log (
  id                    uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id                uuid           NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  pro_id                uuid           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score           numeric(5,2),             -- composite algorithm score
  distance_km           numeric(6,2),
  skill_score_at_match  numeric(3,1),             -- snapshot
  had_required_part     boolean,
  outcome               match_outcome,
  assigned_at           timestamptz,
  responded_at          timestamptz               -- accept/decline time
);

-- ============================================================
-- SECTION 6: Media & AI Audit
-- ============================================================

-- media_assets
CREATE TABLE media_assets (
  id           uuid               PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id    uuid               NOT NULL,        -- job.id or pro_id
  entity_type  media_entity_type  NOT NULL,
  storage_url  text               NOT NULL,        -- supabase storage path
  ai_verified  boolean            DEFAULT false,
  ai_result    jsonb,                              -- full vision response
  uploaded_at  timestamptz        NOT NULL DEFAULT now()
);


-- invoices
CREATE TABLE invoices (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       uuid        NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  line_items   jsonb       NOT NULL,               -- [{desc, qty, price}]
  subtotal     integer     NOT NULL,               -- in paise
  gst_amount   integer     NOT NULL,               -- 18% on service
  total_amount integer     NOT NULL,               -- in paise
  ai_generated boolean     NOT NULL DEFAULT false,
  pdf_url      text,                               -- generated pdf path
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 7: Trust & Retention
-- ============================================================

-- warranties
CREATE TABLE warranties (
  id          uuid             PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      uuid             NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  pro_id      uuid             NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  valid_until timestamptz      NOT NULL,           -- now() + 90 days
  status      warranty_status  NOT NULL DEFAULT 'active',
  claimed_at  timestamptz                          -- if status = 'claimed'
);


-- reviews
CREATE TABLE reviews (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      uuid        NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE RESTRICT,
  reviewer_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reviewee_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  rating      integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- dispute_logs
CREATE TABLE dispute_logs (
  id                uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id            uuid           NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  raised_by         uuid           NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reason            text,
  ai_diagnosis_wrong boolean,                     -- model feedback signal
  actual_fault      text,                         -- pro's correction
  status            dispute_status NOT NULL DEFAULT 'open',
  resolved_at       timestamptz
);

-- ============================================================
-- SECTION 8: Notifications & Home Health
-- ============================================================

-- notifications
CREATE TABLE notifications (
  id         uuid              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      text              NOT NULL,
  body       text,
  is_read    boolean           NOT NULL DEFAULT false,
  deep_link  text,                                -- pronto://jobs/id
  job_id     uuid              REFERENCES jobs(id) ON DELETE SET NULL,  -- nullable context ref
  created_at timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);


-- appliances
CREATE TABLE appliances (
  id               uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      uuid    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type             text    NOT NULL,   -- 'AC' | 'Fridge' | 'Geyser'
  brand            text,
  model            text,
  purchase_date    date,               -- for health scoring
  last_serviced_at date,               -- from jobs history
  next_service_due date,               -- computed / set by app logic
  health_score     integer CHECK (health_score BETWEEN 0 AND 100),
  job_count        integer NOT NULL DEFAULT 0
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — enable on all tables
-- ============================================================
-- Uncomment and customise policies as needed for your app logic.

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_details        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_availability   ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_skills     ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_parts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_skills         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliances         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- profiles: allow users to insert their own profile during signup
CREATE POLICY "profiles: insert own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- profiles: allow users to read/update/delete their own row
CREATE POLICY "profiles: own row" ON profiles
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: delete own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- pro_details: pros can insert/read/update/delete own row
CREATE POLICY "pro_details: insert own" ON pro_details
  FOR INSERT WITH CHECK (auth.uid() = pro_id);

CREATE POLICY "pro_details: own row" ON pro_details
  USING (auth.uid() = pro_id);

CREATE POLICY "pro_details: update own" ON pro_details
  FOR UPDATE USING (auth.uid() = pro_id) WITH CHECK (auth.uid() = pro_id);

-- customer_addresses: own rows
CREATE POLICY "addresses: insert own" ON customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "addresses: own rows" ON customer_addresses
  USING (auth.uid() = customer_id);

CREATE POLICY "addresses: update own" ON customer_addresses
  FOR UPDATE USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "addresses: delete own" ON customer_addresses
  FOR DELETE USING (auth.uid() = customer_id);

-- notifications: own rows (read)
CREATE POLICY "notifications: read own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- appliances: own rows
CREATE POLICY "appliances: insert own" ON appliances
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "appliances: own rows" ON appliances
  USING (auth.uid() = customer_id);

CREATE POLICY "appliances: update own" ON appliances
  FOR UPDATE USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- jobs: customer can insert and see their jobs, pro can see assigned jobs
CREATE POLICY "jobs: insert own" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "jobs: participant access" ON jobs
  USING (auth.uid() = customer_id OR auth.uid() = pro_id);

CREATE POLICY "jobs: customer update" ON jobs
  FOR UPDATE USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- earnings: pros can only read their own earnings
CREATE POLICY "earnings: read own" ON earnings
  FOR SELECT USING (auth.uid() = pro_id);

-- reviews: authenticated users can read their own reviews
CREATE POLICY "reviews: insert own" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "reviews: read" ON reviews
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

-- warranties: customers can read warranties for their jobs
CREATE POLICY "warranties: read" ON warranties
  USING (
    auth.uid() IN (
      SELECT customer_id FROM jobs WHERE jobs.id = job_id
    )
  );

-- invoices: readable by customer or pro on the job
CREATE POLICY "invoices: read participant" ON invoices
  FOR SELECT USING (
    auth.uid() IN (
      SELECT customer_id FROM jobs WHERE jobs.id = job_id
      UNION
      SELECT pro_id FROM jobs WHERE jobs.id = job_id
    )
  );

-- media_assets: readable by job participants or owning pro
CREATE POLICY "media_assets: read participant" ON media_assets
  FOR SELECT USING (
    (
      entity_type IN ('job_before', 'job_after')
      AND auth.uid() IN (
        SELECT customer_id FROM jobs WHERE jobs.id = entity_id
        UNION
        SELECT pro_id FROM jobs WHERE jobs.id = entity_id
      )
    )
    OR (
      entity_type IN ('pro_toolkit', 'pro_selfie', 'pro_aadhaar')
      AND auth.uid() = entity_id
    )
  );

-- dispute_logs: readable by job participants or the raiser
CREATE POLICY "dispute_logs: read participant" ON dispute_logs
  FOR SELECT USING (
    auth.uid() = raised_by
    OR auth.uid() IN (
      SELECT customer_id FROM jobs WHERE jobs.id = job_id
      UNION
      SELECT pro_id FROM jobs WHERE jobs.id = job_id
    )
  );

-- matching_log: readable by customer or pro on job
CREATE POLICY "matching_log: read" ON matching_log
  USING (
    auth.uid() IN (
      SELECT customer_id FROM jobs WHERE jobs.id = job_id
      UNION
      SELECT pro_id FROM jobs WHERE jobs.id = job_id
    )
  );

-- pro_availability: pros can update their own
CREATE POLICY "pro_availability: own" ON pro_availability
  USING (auth.uid() = pro_id);

CREATE POLICY "pro_availability: update own" ON pro_availability
  FOR UPDATE USING (auth.uid() = pro_id) WITH CHECK (auth.uid() = pro_id);

-- pro_skills: pros can read/insert/delete their own
CREATE POLICY "pro_skills: own" ON pro_skills
  USING (auth.uid() = pro_id);

CREATE POLICY "pro_skills: insert own" ON pro_skills
  FOR INSERT WITH CHECK (auth.uid() = pro_id);

CREATE POLICY "pro_skills: delete own" ON pro_skills
  FOR DELETE USING (auth.uid() = pro_id);

-- pro_inventory: pros can read/update their own
CREATE POLICY "pro_inventory: own" ON pro_inventory
  USING (auth.uid() = pro_id);

CREATE POLICY "pro_inventory: update own" ON pro_inventory
  FOR UPDATE USING (auth.uid() = pro_id) WITH CHECK (auth.uid() = pro_id);

-- Catalog tables: allow all authenticated users to read
CREATE POLICY "catalog_skills: read all" ON catalog_skills
  FOR SELECT USING (true);

CREATE POLICY "catalog_parts: read all" ON catalog_parts
  FOR SELECT USING (true);

CREATE POLICY "service_areas: read all" ON service_areas
  FOR SELECT USING (true);

-- ============================================================
-- END OF SCHEMA
-- Total tables: 18
-- ============================================================