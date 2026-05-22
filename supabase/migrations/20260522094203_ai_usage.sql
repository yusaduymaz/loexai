-- ───────────────────────────────────────────────────────────────────────────
-- LoexAI · Phase 1 · PLAN-1B · `ai_usage` table + RLS (incl. admin SELECT)
-- ───────────────────────────────────────────────────────────────────────────
--
-- Append-only token + cost log written from every AI call. Admins read the
-- aggregate for cost monitoring (ADM-02). Rows are immutable: no UPDATE,
-- no DELETE — enforced by `USING (false)` policies.

create table if not exists public.ai_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  business_id     uuid references public.businesses(id) on delete set null,
  scan_job_id     uuid references public.scan_jobs(id) on delete set null,
  stage           text not null,
  model           text not null,
  provider        text not null
                  check (provider in ('anthropic', 'openrouter_free')),
  input_tokens    integer not null check (input_tokens >= 0),
  output_tokens   integer not null check (output_tokens >= 0),
  cost_usd        numeric(10, 6) not null default 0 check (cost_usd >= 0),
  created_at      timestamptz not null default now()
);

comment on table public.ai_usage is
  'Append-only AI cost log. Each row = one model call. Updated/Deleted is forbidden via RLS — keep audit integrity.';
comment on column public.ai_usage.stage is
  'Pipeline stage identifier (e.g. enrichment_summary, gap_summary, scoring_reasoning, solution_rec, sales_strategy, build_prompt, qa).';

create index if not exists idx_ai_usage_user_date
  on public.ai_usage (user_id, created_at desc);
create index if not exists idx_ai_usage_job
  on public.ai_usage (scan_job_id);
create index if not exists idx_ai_usage_stage
  on public.ai_usage (stage);

alter table public.ai_usage enable row level security;

-- WHY: user reads their own log.
drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own"
  on public.ai_usage
  for select
  using (auth.uid() = user_id);

-- WHY: admin reads everyone's log (ADM-02). Separate policy is OR-combined
-- with select_own by PostgreSQL — admins also see their own.
drop policy if exists "ai_usage_select_admin" on public.ai_usage;
create policy "ai_usage_select_admin"
  on public.ai_usage
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- WHY: user-side INSERT is allowed (server actions write under user JWT).
-- Service-role bypasses RLS for system-level writes anyway.
drop policy if exists "ai_usage_insert_own" on public.ai_usage;
create policy "ai_usage_insert_own"
  on public.ai_usage
  for insert
  with check (auth.uid() = user_id);

-- WHY: append-only — no UPDATE, no DELETE from any role except service-role.
drop policy if exists "ai_usage_update_forbidden" on public.ai_usage;
create policy "ai_usage_update_forbidden"
  on public.ai_usage
  for update
  using (false);

drop policy if exists "ai_usage_delete_forbidden" on public.ai_usage;
create policy "ai_usage_delete_forbidden"
  on public.ai_usage
  for delete
  using (false);
