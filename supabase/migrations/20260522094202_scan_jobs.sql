-- ───────────────────────────────────────────────────────────────────────────
-- LoexAI · Phase 1 · PLAN-1B · `scan_jobs` table + RLS
-- ───────────────────────────────────────────────────────────────────────────
--
-- Tracks the lifecycle of a discovery + pipeline run for one user.
-- Phase 2+ writes status transitions; admin dashboard reads aggregate counts.
-- RLS: user sees only own jobs. Admin SELECT goes through service-role from
-- a server-only route (no admin-policy on this table — keeps the policy
-- surface small; admin reads via service-role bypass in Phase 5).

create table if not exists public.scan_jobs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  location        text not null,
  category        text not null,
  radius_m        integer not null check (radius_m > 0),
  status          text not null default 'queued'
                  check (status in ('queued', 'running', 'completed', 'partial', 'failed')),
  found_count     integer not null default 0 check (found_count >= 0),
  analyzed_count  integer not null default 0 check (analyzed_count >= 0),
  error_count     integer not null default 0 check (error_count >= 0),
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.scan_jobs is
  'One row per user-initiated discovery + pipeline run. Status drives the dashboard "scans" view and unlocks ai_usage joins.';

create index if not exists idx_scan_jobs_user_status
  on public.scan_jobs (user_id, status);
create index if not exists idx_scan_jobs_created
  on public.scan_jobs (user_id, created_at desc);

alter table public.scan_jobs enable row level security;

-- WHY: user-scoped RLS — same pattern as businesses.
drop policy if exists "scan_jobs_select_own" on public.scan_jobs;
create policy "scan_jobs_select_own"
  on public.scan_jobs
  for select
  using (auth.uid() = user_id);

drop policy if exists "scan_jobs_insert_own" on public.scan_jobs;
create policy "scan_jobs_insert_own"
  on public.scan_jobs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "scan_jobs_update_own" on public.scan_jobs;
create policy "scan_jobs_update_own"
  on public.scan_jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "scan_jobs_delete_own" on public.scan_jobs;
create policy "scan_jobs_delete_own"
  on public.scan_jobs
  for delete
  using (auth.uid() = user_id);
