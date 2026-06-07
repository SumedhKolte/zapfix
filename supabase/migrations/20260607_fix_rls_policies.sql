-- Fix missing RLS policies for pro tables and catalog tables
-- These policies were blocking the pro onboarding flow

-- pro_availability: pros can insert/read/update own row
CREATE POLICY IF NOT EXISTS "pro_availability: insert own" ON pro_availability
  FOR INSERT WITH CHECK (auth.uid() = pro_id);

CREATE POLICY IF NOT EXISTS "pro_availability: read own" ON pro_availability
  USING (auth.uid() = pro_id);

CREATE POLICY IF NOT EXISTS "pro_availability: update own" ON pro_availability
  FOR UPDATE USING (auth.uid() = pro_id) WITH CHECK (auth.uid() = pro_id);

-- pro_skills: pros can read own
CREATE POLICY IF NOT EXISTS "pro_skills: read own" ON pro_skills
  USING (auth.uid() = pro_id);

-- matching_log: readable by involved pro or customer (via job)
CREATE POLICY IF NOT EXISTS "matching_log: read participant" ON matching_log
  USING (
    auth.uid() = pro_id OR auth.uid() IN (
      SELECT customer_id FROM jobs WHERE jobs.id = job_id
    )
  );

-- catalog tables: readable by all (admin-managed, filtered by is_active)
CREATE POLICY IF NOT EXISTS "catalog_skills: read all" ON catalog_skills
  FOR SELECT USING (is_active = true);

CREATE POLICY IF NOT EXISTS "catalog_parts: read all" ON catalog_parts
  FOR SELECT USING (is_active = true);

CREATE POLICY IF NOT EXISTS "service_areas: read all" ON service_areas
  FOR SELECT USING (is_active = true);
