# LoexAI Prioritized Backlog

## P0: Foundation Corrections

1. Exclude `gsd-build/**` from LoexAI typecheck/build readiness.
2. Add typed config loaders for AI, discovery, Upstash, and payments.
3. Add Sentry and structured logging.
4. Add health endpoint and startup diagnostics.
5. Standardize env names and required/optional phase gating.

## P1: Pipeline Data Model

1. [x] Add `scan_job_items`.
2. [x] Add `pipeline_stage_runs`.
3. [x] Add persisted `qa_results`.
4. [x] Add scoring formula version and score breakdown persistence.
5. [x] Add template version and evidence fields for gap analysis.

## P2: Discovery MVP

1. [x] Build discovery request form.
2. [x] Implement Google Places provider.
3. [x] Add provider factory and fallback contract.
4. [x] Create job launcher route/action.
5. [x] Persist deduplicated businesses and link them to scan jobs.

## P3: Deterministic Intelligence MVP

1. [x] Website fetcher and technical probes.
2. [x] Industry expectation templates.
3. [x] Deterministic gap analysis engine.
4. [x] Deterministic scoring engine.
5. [x] Cache/idempotency for stage reuse.

## P4: AI Layer MVP

1. [x] `AIProvider` abstraction.
2. [x] Anthropic adapter.
3. [x] OpenRouter adapter.
4. [x] Zod output schemas.
5. [x] ai_usage logging and retry/fallback logic.

## P5: Product Magic Moment

1. [x] Business report page
2. [x] Opportunity list
3. [x] Sales strategy panel
4. [x] Build prompt panel
5. [x] Export/share surface

## P6: Admin And Ops

1. [x] scan job drilldown
2. AI usage analytics
3. provider failure monitoring
4. template and rule management
5. [x] credit operations

## P7: Monetization

1. Stripe products/prices
2. webhook ingestion
3. plan/credit sync
4. upgrade UX
