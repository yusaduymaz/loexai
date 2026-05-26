# LoexAI Master Delivery Plan

## Executive Summary

LoexAI already has a solid Phase 1 base: marketing site, auth, dashboard/admin shells, Supabase schema, and a placeholder workflow endpoint. What it does **not** have yet is the actual opportunity-intelligence engine promised in `CLAUDE.md`. The correct next move is not broad feature coding. It is to build the product in locked layers so deterministic data quality, cost control, and orchestration are solved before AI-heavy stages scale.

The governing product rule remains:

- Deterministic first
- AI second
- Queue-backed orchestration always
- Idempotent results per business
- Provider abstractions at every external dependency boundary

## Current State

### Confirmed in Repo

- Next.js 14 app structure exists for marketing, auth, dashboard, and admin.
- Supabase migrations already define the Phase 1 core entities.
- `src/lib/discovery/types.ts` establishes the discovery provider contract.
- Upstash Workflow and Redis wrappers exist but the pipeline is still a noop.
- `CLAUDE.md` is explicit about deterministic-first architecture, provider abstraction, AI validation, cost controls, and phased rollout.

### Key Gaps

- No real discovery provider implementation
- No enrichment engine
- No gap analysis engine
- No deterministic scoring engine
- No AI provider abstraction implementation
- No prompt/versioning system
- No queue-driven orchestration logic
- No business report page or pipeline execution UI
- No observability/error-budget layer
- No production operations playbook
- No per-stage pipeline execution audit model
- No clean typecheck boundary because `gsd-build/**` is currently inside repo-wide TS scope

### Immediate Architectural Defects To Resolve

These are the highest-value fixes before feature expansion:

1. Add `scan_job_items` so one scan can track many discovered businesses cleanly.
2. Add `pipeline_stage_runs` so each business/stage attempt is resumable and auditable.
3. Add persisted QA output instead of treating QA as transient.
4. Expand domain contracts beyond auth-only types in `src/types/domain.ts`.
5. Isolate LoexAI typecheck/test scope from the cloned `gsd-build/` tree.

## Delivery Principles

### Principle 1: Build the truth engine before the pitch engine

Do not ship sales strategy or build prompts before discovery, enrichment, gaps, and scoring are trustworthy.

### Principle 2: Every stage owns a stable contract

Each pipeline stage should read one typed input and write one typed output plus metadata:

- source version
- provider used
- timing
- cache key
- confidence / completeness
- recoverable error state

### Principle 3: Async-first pipeline

Discovery and analysis must run as queued jobs. Never block the user request on the full 8-stage pipeline.

### Principle 4: Partial progress is a feature

If one stage fails, preserve completed outputs and expose stage-level status in the UI and DB.

## Recommended Program Structure

## Track A: Platform Foundation Hardening

1. Normalize environment handling and secret contracts.
2. Add typed config loaders for AI, discovery, cache, workflow, and payments.
3. Add structured logging, error taxonomy, and trace IDs.
4. Add Sentry and product analytics before major pipeline buildout.

## Track B: Deterministic Intelligence Core

1. Implement `DiscoveryProvider` factory and Google Places provider.
2. Add fallback RapidAPI provider behind the same contract.
3. Build enrichment engine for website fetch and technical checks.
4. Build industry templates and deterministic gap detection.
5. Build deterministic scoring engine with versioned rule weights.

## Track C: AI Reasoning Layer

1. Implement `AIProvider` abstraction with Anthropic and OpenRouter adapters.
2. Add prompt files under `src/lib/prompts/`.
3. Add Zod-validated stage outputs for:
   - gap summary
   - score reasoning
   - solution recommendation
   - sales strategy
   - build prompt
   - QA validation
4. Add retries, model fallback, and usage logging.

## Track D: Workflow Orchestration

1. Replace noop Upstash workflow with stage-level steps.
2. Add scan job state machine and credit pre-check.
3. Add idempotency keys per business and pipeline version.
4. Add resume/retry/replay behavior.

## Track E: Product Experience

1. Build discovery form and scan launch UX.
2. Build jobs list and progress UI.
3. Build business report page as the product magic moment.
4. Add saved/opportunity workflow and status updates.
5. Add export and prompt studio surfaces.

## Track F: Operations and Monetization

1. Admin observability for jobs, AI usage, provider failures, and credits.
2. Stripe subscription model after pipeline value is proven.
3. Rate-limit and abuse controls.
4. Deployment hardening and runbooks.

## Phase Plan

## Phase 1A: Hardening the Existing Foundation

Goal: make the current repo safe to extend.

- Introduce typed env/config modules
- Add Sentry
- Add PostHog or equivalent product analytics
- Add shared domain error model
- Add audit-friendly logging
- Add test harness for provider/service wrappers

Exit criteria:

- Missing envs fail fast with clear errors
- Runtime errors are observable
- All external service boundaries are typed

## Phase 2: Lead Discovery

Goal: user can launch a scan and persist deduplicated businesses.

- Discovery request schema
- Google Places provider
- RapidAPI fallback provider
- dedupe + upsert behavior by `(user_id, place_id)`
- scan job creation, progress updates, and result persistence

Exit criteria:

- A scan reliably writes businesses
- The same scan does not duplicate rows
- Provider switch does not affect upper layers

## Phase 3: Deterministic Intelligence

Goal: every business gets non-LLM intelligence first.

- Website reachability
- SSL/status/meta checks
- CTA/contact/booking heuristics
- Industry template expectation engine
- gap generation
- opportunity scoring

Exit criteria:

- No AI required to compute the core signal set
- Gap and score outputs are reproducible

## Phase 4: AI Output Layer

Goal: AI converts facts into commercial assets.

- AI provider abstraction
- prompt files + Zod schemas
- reasoning, recommendations, sales assets, build prompts, QA
- ai_usage cost logging

Exit criteria:

- All AI outputs are schema-validated
- Every AI statement can be traced to observed facts

## Phase 5: Report UX and Workflow Surface

Goal: the product feels complete to a paying operator.

- business report page
- jobs monitoring UI
- prompt studio
- saved leads/opportunity statuses
- admin template management

Exit criteria:

- A user can go from scan to outreach-ready asset in one flow

## Phase 6: Monetization and Scale

Goal: move from product prototype to SaaS platform.

- Stripe
- usage-based credit controls
- observability dashboards
- background reliability
- deployment playbooks

## Definition of Done Per Phase

- Domain contracts defined
- Service abstractions implemented
- Queue behavior tested
- UI surface connected
- logs/metrics/traces visible
- rollback path clear
- docs updated

## High-Priority Risks

- Overusing AI where deterministic logic should exist
- Coupling providers directly into app routes
- Running long pipeline work in request/response cycle
- Shipping AI JSON without strict validation
- Allowing production data mutation through overly-permissive tooling
- Treating dashboard shells as product completion
- Leaving placeholder screens in the primary user path for too long
- Shipping stale copy that damages trust

## Product Reality Check

Today the strongest user-facing surfaces are:

- marketing pages
- auth flows
- dashboard overview
- read-only admin monitors

The actual product promise is not yet reachable because:

- discovery launch is still missing
- business report is still placeholder
- opportunities/campaigns/prompt studio/CRM are mostly shell routes
- pricing copy still contains stale time-bound language

This means the next product phase must prioritize the first complete end-to-end path:

`launch scan -> persist businesses -> enrich -> score -> open report -> generate outreach`

## Recommended Immediate Sequence

1. Finalize tooling and MCP setup.
2. Add typed config + observability.
3. Implement discovery provider and scan job lifecycle.
4. Implement deterministic enrichment + gap analysis + scoring.
5. Implement AI provider and validated generation layer.
6. Build business report UX and admin observability.
