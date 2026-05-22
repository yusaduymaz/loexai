-- ───────────────────────────────────────────────────────────────────────────
-- LoexAI · Phase 1 · PLAN-1B · 6 pipeline tables + RLS via business join
-- ───────────────────────────────────────────────────────────────────────────
--
-- Tables (all 1—1 with their parent for idempotent upsert):
--   * business_enrichments  — UNIQUE (business_id)
--   * gap_analyses          — UNIQUE (business_id)
--   * opportunities         — UNIQUE (business_id)   (MVP: one opportunity per business)
--   * solution_recommendations — UNIQUE (opportunity_id)
--   * sales_strategies         — UNIQUE (opportunity_id)
--   * build_prompts            — UNIQUE (opportunity_id)
--
-- CLAUDE.md §11 relationship map: solutions / sales / prompts hang off the
-- OPPORTUNITY, not the business, so their UNIQUE is on opportunity_id.
--
-- RLS strategy:
--   * Pipeline tables don't carry user_id — they reach it via business join.
--   * Every policy uses EXISTS (SELECT 1 FROM businesses b WHERE b.id = ...
--     AND b.user_id = auth.uid()).
--   * INSERT uses WITH CHECK on the same predicate (PITFALL §RLS-4).
--
-- All FKs ON DELETE CASCADE so deleting a business removes everything below.

-- ─── business_enrichments ──────────────────────────────────────────────────

create table if not exists public.business_enrichments (
  id                      uuid primary key default gen_random_uuid(),
  business_id             uuid not null unique
                          references public.businesses(id) on delete cascade,
  has_website             boolean,
  has_instagram           boolean,
  has_reservation_system  boolean,
  has_whatsapp_cta        boolean,
  mobile_experience       text,
  brand_quality           text,
  digital_maturity_score  integer
                          check (digital_maturity_score between 0 and 100),
  -- PITFALL §Web-1: keep the website-fetch outcome so re-runs don't refetch
  -- a known-blocked / known-timeout host.
  website_status          text
                          check (website_status in ('ok', 'blocked', 'timeout', 'fetch_failed', 'unknown')),
  enrichment_data         jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.business_enrichments is
  'Deterministic digital-profile snapshot per business. One row per business — idempotent upsert.';

drop trigger if exists set_updated_at on public.business_enrichments;
create trigger set_updated_at
  before update on public.business_enrichments
  for each row execute function public.tg_set_updated_at();

create index if not exists idx_business_enrichments_business
  on public.business_enrichments (business_id);

alter table public.business_enrichments enable row level security;

-- WHY: ownership via business join — pipeline tables never store user_id.
drop policy if exists "business_enrichments_select_own" on public.business_enrichments;
create policy "business_enrichments_select_own"
  on public.business_enrichments
  for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_enrichments.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "business_enrichments_insert_own" on public.business_enrichments;
create policy "business_enrichments_insert_own"
  on public.business_enrichments
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_enrichments.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "business_enrichments_update_own" on public.business_enrichments;
create policy "business_enrichments_update_own"
  on public.business_enrichments
  for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_enrichments.business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_enrichments.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "business_enrichments_delete_own" on public.business_enrichments;
create policy "business_enrichments_delete_own"
  on public.business_enrichments
  for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_enrichments.business_id and b.user_id = auth.uid()
    )
  );

-- ─── gap_analyses ──────────────────────────────────────────────────────────

create table if not exists public.gap_analyses (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null unique
                  references public.businesses(id) on delete cascade,
  gaps            jsonb not null,
  severity_score  integer
                  check (severity_score between 0 and 100),
  summary         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.gap_analyses is
  'Detected digital gaps + AI-generated summary. One row per business.';

drop trigger if exists set_updated_at on public.gap_analyses;
create trigger set_updated_at
  before update on public.gap_analyses
  for each row execute function public.tg_set_updated_at();

create index if not exists idx_gap_analyses_business
  on public.gap_analyses (business_id);

alter table public.gap_analyses enable row level security;

-- WHY: same business-join ownership pattern.
drop policy if exists "gap_analyses_select_own" on public.gap_analyses;
create policy "gap_analyses_select_own"
  on public.gap_analyses
  for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = gap_analyses.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "gap_analyses_insert_own" on public.gap_analyses;
create policy "gap_analyses_insert_own"
  on public.gap_analyses
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = gap_analyses.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "gap_analyses_update_own" on public.gap_analyses;
create policy "gap_analyses_update_own"
  on public.gap_analyses
  for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = gap_analyses.business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = gap_analyses.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "gap_analyses_delete_own" on public.gap_analyses;
create policy "gap_analyses_delete_own"
  on public.gap_analyses
  for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = gap_analyses.business_id and b.user_id = auth.uid()
    )
  );

-- ─── opportunities ─────────────────────────────────────────────────────────

create table if not exists public.opportunities (
  id                              uuid primary key default gen_random_uuid(),
  business_id                     uuid not null unique
                                  references public.businesses(id) on delete cascade,
  opportunity_score               integer
                                  check (opportunity_score between 0 and 100),
  priority                        text
                                  check (priority in ('low', 'medium', 'high', 'urgent')),
  close_probability               numeric(4, 3)
                                  check (close_probability is null or (close_probability >= 0 and close_probability <= 1)),
  estimated_deal_value_min        numeric,
  estimated_deal_value_max        numeric,
  estimated_deal_value_currency   text
                                  check (estimated_deal_value_currency in ('USD', 'EUR', 'TRY')),
  reasoning                       text,
  status                          text not null default 'new'
                                  check (status in ('new', 'analyzed', 'saved', 'contacted', 'proposal_sent', 'won', 'lost')),
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

comment on table public.opportunities is
  'Commercial opportunity per business. MVP: one opportunity per business (UNIQUE on business_id). Status drives the CRM-style funnel.';

drop trigger if exists set_updated_at on public.opportunities;
create trigger set_updated_at
  before update on public.opportunities
  for each row execute function public.tg_set_updated_at();

create index if not exists idx_opportunities_business
  on public.opportunities (business_id);
create index if not exists idx_opportunities_priority_status
  on public.opportunities (priority, status);

alter table public.opportunities enable row level security;

-- WHY: ownership via business join.
drop policy if exists "opportunities_select_own" on public.opportunities;
create policy "opportunities_select_own"
  on public.opportunities
  for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = opportunities.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "opportunities_insert_own" on public.opportunities;
create policy "opportunities_insert_own"
  on public.opportunities
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = opportunities.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "opportunities_update_own" on public.opportunities;
create policy "opportunities_update_own"
  on public.opportunities
  for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = opportunities.business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = opportunities.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "opportunities_delete_own" on public.opportunities;
create policy "opportunities_delete_own"
  on public.opportunities
  for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = opportunities.business_id and b.user_id = auth.uid()
    )
  );

-- ─── solution_recommendations ──────────────────────────────────────────────
-- CLAUDE.md §11: 1—1 with opportunity (NOT business). UNIQUE on opportunity_id.

create table if not exists public.solution_recommendations (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  opportunity_id    uuid not null unique
                    references public.opportunities(id) on delete cascade,
  primary_offer     jsonb,
  secondary_offers  jsonb,
  upsell_offers     jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.solution_recommendations is
  'Sellable solution offers per opportunity. UNIQUE on opportunity_id — idempotent upsert keyed on the parent opportunity, per CLAUDE.md §11.';
comment on column public.solution_recommendations.business_id is
  'Denormalized for query convenience and RLS join — must equal the business_id of the parent opportunity (enforced by application/AI layer).';

drop trigger if exists set_updated_at on public.solution_recommendations;
create trigger set_updated_at
  before update on public.solution_recommendations
  for each row execute function public.tg_set_updated_at();

create index if not exists idx_solution_recommendations_business
  on public.solution_recommendations (business_id);
create index if not exists idx_solution_recommendations_opportunity
  on public.solution_recommendations (opportunity_id);

alter table public.solution_recommendations enable row level security;

-- WHY: ownership via business join (business_id is denormalized on the row).
drop policy if exists "solution_recommendations_select_own" on public.solution_recommendations;
create policy "solution_recommendations_select_own"
  on public.solution_recommendations
  for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = solution_recommendations.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "solution_recommendations_insert_own" on public.solution_recommendations;
create policy "solution_recommendations_insert_own"
  on public.solution_recommendations
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = solution_recommendations.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "solution_recommendations_update_own" on public.solution_recommendations;
create policy "solution_recommendations_update_own"
  on public.solution_recommendations
  for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = solution_recommendations.business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = solution_recommendations.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "solution_recommendations_delete_own" on public.solution_recommendations;
create policy "solution_recommendations_delete_own"
  on public.solution_recommendations
  for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = solution_recommendations.business_id and b.user_id = auth.uid()
    )
  );

-- ─── sales_strategies ──────────────────────────────────────────────────────

create table if not exists public.sales_strategies (
  id                       uuid primary key default gen_random_uuid(),
  business_id              uuid not null references public.businesses(id) on delete cascade,
  opportunity_id           uuid not null unique
                           references public.opportunities(id) on delete cascade,
  short_pitch              text,
  cold_email               text,
  instagram_dm             text,
  whatsapp_message         text,
  discovery_call_opener    text,
  objection_handling       jsonb,
  proposal_summary         text,
  value_proposition        text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.sales_strategies is
  'AI-generated sales assets per opportunity. UNIQUE on opportunity_id.';

drop trigger if exists set_updated_at on public.sales_strategies;
create trigger set_updated_at
  before update on public.sales_strategies
  for each row execute function public.tg_set_updated_at();

create index if not exists idx_sales_strategies_business
  on public.sales_strategies (business_id);
create index if not exists idx_sales_strategies_opportunity
  on public.sales_strategies (opportunity_id);

alter table public.sales_strategies enable row level security;

-- WHY: ownership via business join.
drop policy if exists "sales_strategies_select_own" on public.sales_strategies;
create policy "sales_strategies_select_own"
  on public.sales_strategies
  for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = sales_strategies.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "sales_strategies_insert_own" on public.sales_strategies;
create policy "sales_strategies_insert_own"
  on public.sales_strategies
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = sales_strategies.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "sales_strategies_update_own" on public.sales_strategies;
create policy "sales_strategies_update_own"
  on public.sales_strategies
  for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = sales_strategies.business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = sales_strategies.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "sales_strategies_delete_own" on public.sales_strategies;
create policy "sales_strategies_delete_own"
  on public.sales_strategies
  for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = sales_strategies.business_id and b.user_id = auth.uid()
    )
  );

-- ─── build_prompts ─────────────────────────────────────────────────────────

create table if not exists public.build_prompts (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  opportunity_id  uuid not null unique
                  references public.opportunities(id) on delete cascade,
  prompt_body     text not null,
  target_tool     text
                  check (target_tool in ('claude', 'cursor')),
  tech_stack      jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.build_prompts is
  'Implementation-ready prompts for Claude/Cursor. UNIQUE on opportunity_id.';

drop trigger if exists set_updated_at on public.build_prompts;
create trigger set_updated_at
  before update on public.build_prompts
  for each row execute function public.tg_set_updated_at();

create index if not exists idx_build_prompts_business
  on public.build_prompts (business_id);
create index if not exists idx_build_prompts_opportunity
  on public.build_prompts (opportunity_id);

alter table public.build_prompts enable row level security;

-- WHY: ownership via business join.
drop policy if exists "build_prompts_select_own" on public.build_prompts;
create policy "build_prompts_select_own"
  on public.build_prompts
  for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = build_prompts.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "build_prompts_insert_own" on public.build_prompts;
create policy "build_prompts_insert_own"
  on public.build_prompts
  for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = build_prompts.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "build_prompts_update_own" on public.build_prompts;
create policy "build_prompts_update_own"
  on public.build_prompts
  for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = build_prompts.business_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = build_prompts.business_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "build_prompts_delete_own" on public.build_prompts;
create policy "build_prompts_delete_own"
  on public.build_prompts
  for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = build_prompts.business_id and b.user_id = auth.uid()
    )
  );
