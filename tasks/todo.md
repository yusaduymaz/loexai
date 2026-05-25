# Task Plan

## Checklist

- [x] Inspect existing Supabase schema and hand-authored DB types
- [x] Add P1 migration for `scan_job_items`
- [x] Add P1 migration for `pipeline_stage_runs`
- [x] Add P1 migration for persisted `qa_results`
- [x] Add gap analysis version/evidence persistence
- [x] Add scoring formula version and score breakdown persistence
- [x] Update hand-authored `Database` types
- [x] Verify with typecheck and lint
- [x] Build discovery request form
- [x] Implement Google Places Text Search provider
- [x] Add discovery provider factory and RapidAPI fallback stub
- [x] Add server action to create scan jobs
- [x] Persist deduplicated businesses and scan job items
- [x] Normalize empty optional env values before runtime parsing
- [x] Verify P2 with typecheck and lint
- [x] Add deterministic website fetcher and technical probes
- [x] Add industry expectation templates
- [x] Add deterministic gap analysis engine
- [x] Add deterministic scoring engine
- [x] Add scan-item analysis action with stage-run audit records
- [x] Replace opportunities and business report placeholders with read-only P3 surfaces
- [x] Verify P3 with typecheck and lint
- [x] Fix landing dashboard preview hydration mismatch in `ScoreCounter`
- [x] Add P4 AIProvider abstraction and factory
- [x] Add OpenRouter and Anthropic REST adapters
- [x] Add Zod schemas for sales strategy, build prompt, and QA outputs
- [x] Add AI usage logging and retry wrapper
- [x] Verify P4 with typecheck and lint
- [x] Install Clerk Next.js SDK compatible with Next 14
- [x] Replace Supabase Auth middleware with Clerk middleware
- [x] Replace custom login/signup forms with Clerk `SignIn` and `SignUp`
- [x] Add Clerk profile mapping via `public.users.clerk_user_id`
- [x] Switch server DB access to service-role with explicit user filters
- [x] Replace logout menus with Clerk `UserButton`

## Scope

Implement P1-P4 product layers, fix the landing preview hydration mismatch, and migrate all auth/login/signup flows from Supabase Auth to Clerk while preserving the existing UUID-based application data model.

## Review

- Added migration [20260525014500_pipeline_audit_model.sql](C:/Users/duyma/Desktop/loex/supabase/migrations/20260525014500_pipeline_audit_model.sql) with scan item tracking, per-stage run audit records, and persisted QA results.
- Extended `gap_analyses` with template/engine versions, evidence, and expectation snapshots.
- Extended `opportunities` with scoring formula version, score breakdown, and score timestamp.
- Updated [database.ts](C:/Users/duyma/Desktop/loex/src/types/database.ts) to match the new migration.
- Updated [db-schema.md](C:/Users/duyma/Desktop/loex/docs/db-schema.md) and [prioritized-backlog.md](C:/Users/duyma/Desktop/loex/docs/prioritized-backlog.md).
- Added Google Places Text Search provider and provider factory under [src/lib/discovery](C:/Users/duyma/Desktop/loex/src/lib/discovery/provider.ts).
- Replaced the discovery coming-soon shell with an active scan form at [page.tsx](C:/Users/duyma/Desktop/loex/src/app/(dashboard)/dashboard/discovery/page.tsx).
- Added [actions.ts](C:/Users/duyma/Desktop/loex/src/app/(dashboard)/dashboard/discovery/actions.ts) to create `scan_jobs`, call the configured provider, upsert businesses, and create `scan_job_items`.
- Fixed env parsing so blank optional `.env.local` values no longer crash runtime diagnostics.
- Added deterministic intelligence modules under [src/lib/intelligence](C:/Users/duyma/Desktop/loex/src/lib/intelligence/pipeline.ts): website probe, industry templates, gap analysis, scoring, and stage-run audit writes.
- Added scan analysis action to [actions.ts](C:/Users/duyma/Desktop/loex/src/app/(dashboard)/dashboard/discovery/actions.ts), surfaced via an Analyze button on recent scans.
- Replaced opportunities and business report placeholders with real read-only pages backed by deterministic analysis output.
- Fixed [DashboardPreview.tsx](C:/Users/duyma/Desktop/loex/src/components/landing/DashboardPreview.tsx) hydration by making the server render and first client render identical, then starting animation after mount.
- Added P4 AI layer under [src/lib/ai](C:/Users/duyma/Desktop/loex/src/lib/ai/provider.ts): provider factory, OpenRouter adapter, Anthropic adapter, Zod schemas, retry wrapper, and `ai_usage` logging.
- Installed `@clerk/nextjs@6.12.8` because latest Clerk 7 requires Next 15+, while this project is on Next 14.
- Added Clerk middleware and wrapped the root layout in `ClerkProvider`.
- Replaced `/login` and `/register` with Clerk prebuilt `SignIn`/`SignUp` components.
- Added [20260525023000_clerk_auth_profiles.sql](C:/Users/duyma/Desktop/loex/supabase/migrations/20260525023000_clerk_auth_profiles.sql) to map Clerk users to `public.users.clerk_user_id` without breaking UUID foreign keys.
- Updated `getCurrentUser()` to sync Clerk users into the app profile table on first authenticated request.
- Verification:
- `npm run typecheck` passed.
- `npm run lint` passed.
- Browser check on `http://localhost:3001/dashboard/discovery` compiled cleanly and redirected unauthenticated users to `/login`.
- Residual risk:
- RapidAPI exists only as a fail-closed fallback stub; Google Places is the implemented provider.
- Runtime scan success requires `GOOGLE_PLACES_API_KEY` and Places API (New) enabled.
