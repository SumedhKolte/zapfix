-- ============================================================
-- STORAGE BUCKET RLS POLICIES
-- Run this entire file in Supabase Dashboard > SQL Editor
-- ============================================================
-- Prerequisites:
--   1. Go to Storage > kyc-docs > Settings → set bucket to PRIVATE
--   2. Go to Storage > job-media > Settings → set bucket to PRIVATE
--   3. Go to Storage > avatars  > Settings → set bucket to PUBLIC
-- ============================================================

-- Drop existing policies (safe to run multiple times)
DROP POLICY IF EXISTS "kyc-docs: pro insert own" ON storage.objects;
DROP POLICY IF EXISTS "kyc-docs: pro select own" ON storage.objects;
DROP POLICY IF EXISTS "kyc-docs: pro update own" ON storage.objects;
DROP POLICY IF EXISTS "kyc-docs: pro delete own" ON storage.objects;

DROP POLICY IF EXISTS "job-media: participant insert" ON storage.objects;
DROP POLICY IF EXISTS "job-media: participant select" ON storage.objects;
DROP POLICY IF EXISTS "job-media: participant update" ON storage.objects;

DROP POLICY IF EXISTS "avatars: owner insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars: public select" ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner update" ON storage.objects;
DROP POLICY IF EXISTS "avatars: owner delete" ON storage.objects;

DROP POLICY IF EXISTS "media_assets: pro insert own" ON media_assets;
DROP POLICY IF EXISTS "media_assets: job participant insert" ON media_assets;

-- ── kyc-docs bucket ─────────────────────────────────────────
-- Private bucket. Files stored at: <pro_id>/<filename>

CREATE POLICY "kyc-docs: pro insert own"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'kyc-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "kyc-docs: pro select own"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'kyc-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "kyc-docs: pro update own"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'kyc-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'kyc-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "kyc-docs: pro delete own"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'kyc-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- ── job-media bucket ─────────────────────────────────────────
-- Private bucket. Files stored at: jobs/<job_id>/<filename>

CREATE POLICY "job-media: participant insert"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'job-media'
  AND auth.uid() IN (
    SELECT customer_id FROM jobs WHERE id::text = (storage.foldername(name))[2]
    UNION
    SELECT pro_id       FROM jobs WHERE id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "job-media: participant select"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'job-media'
  AND auth.uid() IN (
    SELECT customer_id FROM jobs WHERE id::text = (storage.foldername(name))[2]
    UNION
    SELECT pro_id       FROM jobs WHERE id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "job-media: participant update"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'job-media'
  AND auth.uid() IN (
    SELECT customer_id FROM jobs WHERE id::text = (storage.foldername(name))[2]
    UNION
    SELECT pro_id       FROM jobs WHERE id::text = (storage.foldername(name))[2]
  )
)
WITH CHECK (
  bucket_id = 'job-media'
  AND auth.uid() IN (
    SELECT customer_id FROM jobs WHERE id::text = (storage.foldername(name))[2]
    UNION
    SELECT pro_id       FROM jobs WHERE id::text = (storage.foldername(name))[2]
  )
);


-- ── avatars bucket ───────────────────────────────────────────
-- Public bucket. Files stored at: <user_id>/avatar.jpg

CREATE POLICY "avatars: owner insert"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatars: public select"
ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars: owner update"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatars: owner delete"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- ── media_assets INSERT policies ─────────────────────────────
-- Pros can insert their own KYC / toolkit records
CREATE POLICY "media_assets: pro insert own"
ON media_assets
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = entity_id
  AND entity_type IN ('pro_toolkit', 'pro_selfie', 'pro_aadhaar')
);

-- Job participants can insert job media records
CREATE POLICY "media_assets: job participant insert"
ON media_assets
FOR INSERT TO authenticated
WITH CHECK (
  entity_type IN ('job_before', 'job_after')
  AND auth.uid() IN (
    SELECT customer_id FROM jobs WHERE id = entity_id
    UNION
    SELECT pro_id       FROM jobs WHERE id = entity_id
  )
);
