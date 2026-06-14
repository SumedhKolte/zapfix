-- Production-grade notification creation.
--
-- Client-side INSERTs into public.notifications fail with 42501 whenever a user
-- notifies *another* user (customer -> pro, pro -> customer) and the brittle
-- multi-policy RLS WITH CHECK stack doesn't line up (e.g. a pro notifying the
-- customer before pro_id is assigned, or an unverified pro). We replace that
-- with one SECURITY DEFINER function that does the authorization check itself
-- and inserts with definer privileges.
--
-- Authorization rules (caller = auth.uid()):
--   * self-notification (caller == target) always allowed
--   * for a job: caller and target must BOTH be participants of that job, OR
--     the caller is a verified pro and the target is that job's customer
--     (covers a pro acting on a still-"searching" job whose pro_id is null).
--
-- Returns the inserted row plus the recipient's push token so the client can
-- fan out an Expo push without needing read access to the other user's profile.

create or replace function public.send_job_notification(
  p_user_id   uuid,
  p_title     text,
  p_body      text,
  p_type      public.notification_type default 'job_update',
  p_job_id    uuid  default null,
  p_deep_link text  default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller  uuid := auth.uid();
  v_row     public.notifications;
  v_token   text;
  v_allowed boolean := false;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if v_caller = p_user_id then
    v_allowed := true;
  elsif p_job_id is not null then
    select true into v_allowed
    from public.jobs j
    where j.id = p_job_id
      and (
        -- both caller and target are participants of this job
        (
          (j.customer_id = v_caller or j.pro_id = v_caller)
          and (j.customer_id = p_user_id or j.pro_id = p_user_id)
        )
        -- or a verified pro notifying the job's customer (pro may be unassigned)
        or (j.customer_id = p_user_id and public.is_verified_pro(v_caller))
      );
  end if;

  if not coalesce(v_allowed, false) then
    raise exception 'Not authorized to notify this user';
  end if;

  insert into public.notifications (user_id, type, title, body, job_id, deep_link, is_read)
  values (p_user_id, p_type, p_title, p_body, p_job_id, p_deep_link, false)
  returning * into v_row;

  select fcm_token into v_token from public.profiles where id = p_user_id;

  return jsonb_build_object('notification', to_jsonb(v_row), 'push_token', v_token);
end;
$$;

revoke all on function public.send_job_notification(uuid, text, text, public.notification_type, uuid, text) from public;
grant execute on function public.send_job_notification(uuid, text, text, public.notification_type, uuid, text) to authenticated;
