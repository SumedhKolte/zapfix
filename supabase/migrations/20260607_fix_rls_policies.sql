-- Fix missing RLS policies for pro tables and catalog tables
-- These policies were blocking the pro onboarding flow
--
-- CREATE POLICY IF NOT EXISTS requires PG17; Supabase runs PG15.
-- Pattern: DROP IF EXISTS then CREATE (idempotent on re-run).

-- ── pro_availability ────────────────────────────────────────
DROP POLICY IF EXISTS "pro_availability: insert own" ON pro_availability;
CREATE POLICY "pro_availability: insert own" ON pro_availability
  FOR INSERT WITH CHECK (auth.uid() = pro_id);

DROP POLICY IF EXISTS "pro_availability: read own" ON pro_availability;
CREATE POLICY "pro_availability: read own" ON pro_availability
  FOR SELECT USING (auth.uid() = pro_id);

DROP POLICY IF EXISTS "pro_availability: update own" ON pro_availability;
CREATE POLICY "pro_availability: update own" ON pro_availability
  FOR UPDATE USING (auth.uid() = pro_id) WITH CHECK (auth.uid() = pro_id);

-- ── pro_skills ───────────────────────────────────────────────
DROP POLICY IF EXISTS "pro_skills: read own" ON pro_skills;
CREATE POLICY "pro_skills: read own" ON pro_skills
  FOR SELECT USING (auth.uid() = pro_id);

-- ── matching_log ─────────────────────────────────────────────
DROP POLICY IF EXISTS "matching_log: read participant" ON matching_log;
CREATE POLICY "matching_log: read participant" ON matching_log
  FOR SELECT USING (
    auth.uid() = pro_id OR auth.uid() IN (
      SELECT customer_id FROM jobs WHERE jobs.id = job_id
    )
  );

-- ── catalog tables (admin-managed, public read) ───────────────
DROP POLICY IF EXISTS "catalog_skills: read all" ON catalog_skills;
CREATE POLICY "catalog_skills: read all" ON catalog_skills
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "catalog_parts: read all" ON catalog_parts;
CREATE POLICY "catalog_parts: read all" ON catalog_parts
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "service_areas: read all" ON service_areas;
CREATE POLICY "service_areas: read all" ON service_areas
  FOR SELECT USING (is_active = true);
