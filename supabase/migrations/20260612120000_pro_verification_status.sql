-- Separate the pro's *registration* progress (onboarding_step) from the
-- platform's *verification* decision. Finishing all 8 onboarding steps now only
-- submits the application — it sits in review ('pending') until an admin / the
-- trust pipeline approves ('verified') or rejects it ('rejected'). A rejected
-- pro re-runs the 8 steps, which flips this back to 'pending'.

alter table pro_details
  add column if not exists verification_status text not null default 'pending';

alter table pro_details drop constraint if exists pro_details_verification_status_check;
alter table pro_details
  add constraint pro_details_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected'));

-- Grandfather only pros whose 8 steps are *genuinely* complete. The client now
-- gates "Verified Pro" on real per-step data, not the onboarding_step pointer
-- (which can read 'complete' while steps are still empty), so partially-filled
-- rows must stay 'pending'.
update pro_details p
  set verification_status = 'verified'
  where verification_status = 'pending'
    and aadhaar_ref is not null
    and liveness_verified is true
    and (select count(*) from pro_skills s where s.pro_id = p.pro_id) > 0
    and ai_skill_score is not null
    and background_status = 'clear'
    and bank_account_ref is not null
    and tools_verified is not null
    and trust_score is not null;
