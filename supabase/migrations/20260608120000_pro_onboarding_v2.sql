-- Expand the pro onboarding flow into the full trust pipeline:
--   Phone OTP → Aadhaar → Selfie Match → Category → Skill Assessment →
--   Background Verification → Bank Account → Tool Verification →
--   Trust Score Generated → Live.
--
-- Written to be idempotent and tolerant of drift: on some environments the
-- onboarding_step column was never added, so we add it here rather than only
-- re-constraining it.

-- New columns for the added verification steps (stubbed today, ready for real
-- provider integrations later).
alter table pro_details
  add column if not exists selfie_match_score numeric(4,1)
    check (selfie_match_score is null or selfie_match_score between 0 and 100),
  add column if not exists background_status text
    check (background_status is null or background_status in ('pending', 'clear', 'review')),
  add column if not exists trust_score numeric(4,1)
    check (trust_score is null or trust_score between 0 and 100),
  add column if not exists onboarding_step text;

-- Remap any legacy step names to the new ones.
update pro_details set onboarding_step = case onboarding_step
  when 'identity'  then 'selfie'      -- identity bundled Aadhaar + selfie
  when 'skills'    then 'category'
  when 'interview' then 'assessment'
  when 'toolkit'   then 'tools'
  when 'inventory' then 'complete'
  else onboarding_step
end
where onboarding_step in ('identity', 'skills', 'interview', 'toolkit', 'inventory');

-- Rows that predate the onboarding flow (null / unknown step) are already
-- operating pros — mark them complete so they keep dashboard access.
update pro_details set onboarding_step = 'complete'
where onboarding_step is null
   or onboarding_step not in (
     'aadhaar', 'selfie', 'category', 'assessment',
     'background', 'bank', 'tools', 'trust', 'complete'
   );

alter table pro_details alter column onboarding_step set default 'aadhaar';
alter table pro_details alter column onboarding_step set not null;

alter table pro_details drop constraint if exists pro_details_onboarding_step_check;
alter table pro_details
  add constraint pro_details_onboarding_step_check
  check (onboarding_step in (
    'aadhaar', 'selfie', 'category', 'assessment',
    'background', 'bank', 'tools', 'trust', 'complete'
  ));
