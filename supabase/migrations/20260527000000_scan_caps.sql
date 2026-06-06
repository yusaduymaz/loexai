-- ───────────────────────────────────────────────────────────────────────────
-- LoexAI · Phase 2 followup · Monthly scan cap on free tier
-- ───────────────────────────────────────────────────────────────────────────
--
-- Scope:
--   * Adds `monthly_scan_count` + `scan_count_period_start` to public.users
--     so we can enforce the locked free-tier limit of 3 scans / month
--     (see .planning/credit-model-and-discovery-limits.md).
--   * Adds an atomic RPC `reserve_scan_slot(p_cap)` that lazily resets the
--     counter when the calendar month rolls over and reserves a slot in a
--     single statement. Returns the new used count, or -1 if the cap is hit.
--
-- Why an RPC (not two queries in the Server Action):
--   PITFALL §Concurrency — checking & incrementing in two queries lets two
--   parallel scans both pass the check and bypass the cap. UPDATE ... WHERE
--   ... RETURNING is atomic at the row level.
--
-- Why "calendar month" not "rolling 30-day":
--   Predictable for the user ("resets on the 1st"). Trivial to display.
--   Rolling-window UX is harder to communicate at the same dev cost.
--
-- Admin bypass:
--   Admins skip the cap entirely; the check is performed in the RPC so the
--   client/action can stay simple.

alter table public.users
  add column if not exists monthly_scan_count integer not null default 0
    check (monthly_scan_count >= 0);

alter table public.users
  add column if not exists scan_count_period_start date not null
    default date_trunc('month', now())::date;

comment on column public.users.monthly_scan_count is
  'Discovery scans used in the current calendar-month window. Reset to 0 lazily by reserve_scan_slot() when the month rolls over.';
comment on column public.users.scan_count_period_start is
  'First day of the calendar month the current scan count belongs to. Compared against date_trunc(month, now()) to detect rollover.';

-- ─── reserve_scan_slot RPC ────────────────────────────────────────────────
-- Atomically:
--   1. Lazily resets the counter when the calendar month has rolled over.
--   2. Increments the counter and returns the new value if still under cap.
--   3. Returns -1 sentinel if the cap is already reached.
--
-- SECURITY DEFINER:
--   Needs to read auth.uid() AND write the users row in one statement;
--   performs its own owner / admin check before any state change.
--
-- p_cap is passed in by the caller so the cap can vary by plan in Phase 5
-- without re-deploying the function. Free tier today: 3.

create or replace function public.reserve_scan_slot(p_user_id uuid, p_cap integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_period date := date_trunc('month', now())::date;
  caller_is_admin boolean;
  new_count integer;
begin
  if auth.uid() is null then
    raise exception 'forbidden: unauthenticated';
  end if;

  if auth.uid() <> p_user_id then
    -- Only admins can reserve a slot for another user (e.g. backoffice tooling).
    select exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    ) into caller_is_admin;

    if not caller_is_admin then
      raise exception 'forbidden: not owner';
    end if;
  end if;

  if p_cap is null or p_cap <= 0 then
    raise exception 'invalid cap: %', p_cap;
  end if;

  -- Admins bypass the cap entirely (still recorded for analytics).
  select exists (
    select 1 from public.users
    where id = p_user_id and role = 'admin'
  ) into caller_is_admin;

  -- Single statement: rollover-reset + increment + cap-gate.
  --   * If the stored period is older than the current month, reset to 1.
  --   * Otherwise, increment only when below cap (admins ignore cap).
  --   * No matching row → return -1.
  update public.users
     set scan_count_period_start = case
           when scan_count_period_start < current_period then current_period
           else scan_count_period_start
         end,
         monthly_scan_count = case
           when scan_count_period_start < current_period then 1
           else monthly_scan_count + 1
         end
   where id = p_user_id
     and (
       caller_is_admin
       or scan_count_period_start < current_period
       or monthly_scan_count < p_cap
     )
  returning monthly_scan_count into new_count;

  if new_count is null then
    return -1;  -- cap exhausted
  end if;

  return new_count;
end;
$$;

comment on function public.reserve_scan_slot(uuid, integer) is
  'Atomically reserve one scan slot for the current calendar month. Returns the new used-count, or -1 if the per-period cap has been reached. Admins bypass the cap. SECURITY DEFINER; performs its own owner/admin check.';

revoke all on function public.reserve_scan_slot(uuid, integer) from public;
grant execute on function public.reserve_scan_slot(uuid, integer) to authenticated;

-- ─── release_scan_slot RPC ─────────────────────────────────────────────────
-- Atomic refund when the discovery provider fails before producing any leads.
-- Only decrements when the count belongs to the current month (a stale period
-- means the user has nothing to refund — they just rolled over). Floors at 0.

create or replace function public.release_scan_slot(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_period date := date_trunc('month', now())::date;
  new_count integer;
  caller_is_admin boolean;
begin
  if auth.uid() is null then
    raise exception 'forbidden: unauthenticated';
  end if;

  if auth.uid() <> p_user_id then
    select exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    ) into caller_is_admin;

    if not caller_is_admin then
      raise exception 'forbidden: not owner';
    end if;
  end if;

  update public.users
     set monthly_scan_count = greatest(monthly_scan_count - 1, 0)
   where id = p_user_id
     and scan_count_period_start = current_period
     and monthly_scan_count > 0
  returning monthly_scan_count into new_count;

  return coalesce(new_count, 0);
end;
$$;

comment on function public.release_scan_slot(uuid) is
  'Refund one previously-reserved scan slot. Safe no-op if the period has rolled over or the count is already 0.';

revoke all on function public.release_scan_slot(uuid) from public;
grant execute on function public.release_scan_slot(uuid) to authenticated;
