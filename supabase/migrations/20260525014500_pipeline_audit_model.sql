-- LoexAI · P1 · Pipeline data model hardening
--
-- Adds per-scan item tracking, per-stage run audit records, persisted QA
-- results, and versioned deterministic outputs for gap/score stages.

alter table public.gap_analyses
  add column if not exists template_version text not null default 'industry-template-v1',
  add column if not exists analysis_version text not null default 'gap-v1',
  add column if not exists evidence jsonb not null default '[]'::jsonb,
  add column if not exists expectation_snapshot jsonb;

comment on column public.gap_analyses.template_version is
  'Industry expectation template version used to produce the gaps.';
comment on column public.gap_analyses.analysis_version is
  'Deterministic gap engine version.';
comment on column public.gap_analyses.evidence is
  'Observed facts supporting each gap. AI stages may summarize this but must not invent facts.';
comment on column public.gap_analyses.expectation_snapshot is
  'Copy of the template expectations used at analysis time for replay/debugging.';

alter table public.opportunities
  add column if not exists scoring_formula_version text not null default 'opportunity-score-v1',
  add column if not exists score_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists scored_at timestamptz;

comment on column public.opportunities.scoring_formula_version is
  'Deterministic scoring formula version used for opportunity_score.';
comment on column public.opportunities.score_breakdown is
  'Machine-readable score components and weights.';
comment on column public.opportunities.scored_at is
  'Timestamp when the current opportunity score was calculated.';

create table if not exists public.scan_job_items (
  id                 uuid primary key default gen_random_uuid(),
  scan_job_id        uuid not null references public.scan_jobs(id) on delete cascade,
  business_id        uuid references public.businesses(id) on delete set null,
  provider           text not null check (provider in ('google_places', 'rapidapi', 'manual')),
  provider_place_id  text,
  discovery_rank     integer check (discovery_rank is null or discovery_rank > 0),
  status             text not null default 'discovered'
                     check (status in ('discovered', 'queued', 'analyzing', 'completed', 'failed', 'skipped')),
  raw_result         jsonb,
  error_message      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.scan_job_items is
  'Per-business discovery items for a scan. Lets one scan track many provider results before and after business upsert.';

create unique index if not exists scan_job_items_job_business_unique
  on public.scan_job_items (scan_job_id, business_id)
  where business_id is not null;

create unique index if not exists scan_job_items_provider_unique
  on public.scan_job_items (scan_job_id, provider, provider_place_id)
  where provider_place_id is not null;

create index if not exists idx_scan_job_items_job_status
  on public.scan_job_items (scan_job_id, status);

create index if not exists idx_scan_job_items_business
  on public.scan_job_items (business_id);

drop trigger if exists set_updated_at on public.scan_job_items;
create trigger set_updated_at
  before update on public.scan_job_items
  for each row execute function public.tg_set_updated_at();

alter table public.scan_job_items enable row level security;

drop policy if exists "scan_job_items_select_own" on public.scan_job_items;
create policy "scan_job_items_select_own"
  on public.scan_job_items
  for select
  using (
    exists (
      select 1 from public.scan_jobs sj
      where sj.id = scan_job_items.scan_job_id and sj.user_id = auth.uid()
    )
  );

drop policy if exists "scan_job_items_insert_own" on public.scan_job_items;
create policy "scan_job_items_insert_own"
  on public.scan_job_items
  for insert
  with check (
    exists (
      select 1 from public.scan_jobs sj
      where sj.id = scan_job_items.scan_job_id and sj.user_id = auth.uid()
    )
  );

drop policy if exists "scan_job_items_update_own" on public.scan_job_items;
create policy "scan_job_items_update_own"
  on public.scan_job_items
  for update
  using (
    exists (
      select 1 from public.scan_jobs sj
      where sj.id = scan_job_items.scan_job_id and sj.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.scan_jobs sj
      where sj.id = scan_job_items.scan_job_id and sj.user_id = auth.uid()
    )
  );

drop policy if exists "scan_job_items_delete_own" on public.scan_job_items;
create policy "scan_job_items_delete_own"
  on public.scan_job_items
  for delete
  using (
    exists (
      select 1 from public.scan_jobs sj
      where sj.id = scan_job_items.scan_job_id and sj.user_id = auth.uid()
    )
  );

create table if not exists public.pipeline_stage_runs (
  id                   uuid primary key default gen_random_uuid(),
  scan_job_id          uuid references public.scan_jobs(id) on delete set null,
  scan_job_item_id     uuid references public.scan_job_items(id) on delete set null,
  business_id          uuid not null references public.businesses(id) on delete cascade,
  stage                text not null
                       check (stage in ('discovery', 'enrichment', 'gap_analysis', 'scoring', 'solution_recommendation', 'sales_strategy', 'build_prompt', 'qa')),
  status               text not null default 'queued'
                       check (status in ('queued', 'running', 'succeeded', 'failed', 'skipped')),
  attempt_number       integer not null default 1 check (attempt_number > 0),
  provider             text,
  model                text,
  idempotency_key      text,
  input_hash           text,
  output_ref           text,
  output_summary       jsonb,
  error_code           text,
  error_message        text,
  metadata             jsonb not null default '{}'::jsonb,
  started_at           timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.pipeline_stage_runs is
  'Append-friendly audit trail for each pipeline stage attempt per business.';
comment on column public.pipeline_stage_runs.output_ref is
  'Logical pointer to the persisted output row, e.g. gap_analyses:<uuid>.';

create unique index if not exists pipeline_stage_runs_business_stage_attempt_unique
  on public.pipeline_stage_runs (business_id, stage, attempt_number);

create unique index if not exists pipeline_stage_runs_idempotency_unique
  on public.pipeline_stage_runs (idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_pipeline_stage_runs_job
  on public.pipeline_stage_runs (scan_job_id, stage, status);

create index if not exists idx_pipeline_stage_runs_business
  on public.pipeline_stage_runs (business_id, stage, created_at desc);

drop trigger if exists set_updated_at on public.pipeline_stage_runs;
create trigger set_updated_at
  before update on public.pipeline_stage_runs
  for each row execute function public.tg_set_updated_at();

alter table public.pipeline_stage_runs enable row level security;

drop policy if exists "pipeline_stage_runs_select_own" on public.pipeline_stage_runs;
create policy "pipeline_stage_runs_select_own"
  on public.pipeline_stage_runs
  for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = pipeline_stage_runs.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "pipeline_stage_runs_insert_own" on public.pipeline_stage_runs;
create policy "pipeline_stage_runs_insert_own"
  on public.pipeline_stage_runs
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = pipeline_stage_runs.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "pipeline_stage_runs_update_own" on public.pipeline_stage_runs;
create policy "pipeline_stage_runs_update_own"
  on public.pipeline_stage_runs
  for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = pipeline_stage_runs.business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = pipeline_stage_runs.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "pipeline_stage_runs_delete_own" on public.pipeline_stage_runs;
create policy "pipeline_stage_runs_delete_own"
  on public.pipeline_stage_runs
  for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = pipeline_stage_runs.business_id and b.user_id = auth.uid()
    )
  );

create table if not exists public.qa_results (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references public.businesses(id) on delete cascade,
  opportunity_id        uuid references public.opportunities(id) on delete cascade,
  scan_job_id           uuid references public.scan_jobs(id) on delete set null,
  pipeline_stage_run_id uuid references public.pipeline_stage_runs(id) on delete set null,
  validator_version     text not null default 'qa-v1',
  status                text not null check (status in ('passed', 'warning', 'failed')),
  confidence            numeric(4, 3)
                        check (confidence is null or (confidence >= 0 and confidence <= 1)),
  checks                jsonb not null default '[]'::jsonb,
  issues                jsonb not null default '[]'::jsonb,
  evidence              jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.qa_results is
  'Persisted QA validation output. Every AI-heavy artifact can be traced to checks, issues, and evidence.';

create index if not exists idx_qa_results_business
  on public.qa_results (business_id, created_at desc);

create index if not exists idx_qa_results_opportunity
  on public.qa_results (opportunity_id);

create index if not exists idx_qa_results_run
  on public.qa_results (pipeline_stage_run_id);

drop trigger if exists set_updated_at on public.qa_results;
create trigger set_updated_at
  before update on public.qa_results
  for each row execute function public.tg_set_updated_at();

alter table public.qa_results enable row level security;

drop policy if exists "qa_results_select_own" on public.qa_results;
create policy "qa_results_select_own"
  on public.qa_results
  for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = qa_results.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "qa_results_insert_own" on public.qa_results;
create policy "qa_results_insert_own"
  on public.qa_results
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = qa_results.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "qa_results_update_own" on public.qa_results;
create policy "qa_results_update_own"
  on public.qa_results
  for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = qa_results.business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = qa_results.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "qa_results_delete_own" on public.qa_results;
create policy "qa_results_delete_own"
  on public.qa_results
  for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = qa_results.business_id and b.user_id = auth.uid()
    )
  );
