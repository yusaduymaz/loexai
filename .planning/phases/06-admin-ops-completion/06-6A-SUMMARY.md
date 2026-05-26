---
phase: 06-admin-ops-completion
plan: 6A
subsystem: admin
tags: [admin, ai-usage, analytics, aggregation]
dependency_graph:
  requires: []
  provides: [admin-usage-aggregation]
  affects: [/admin/usage]
tech_stack:
  added: []
  patterns: [server-side in-process aggregation with Map, StatCard component reuse]
key_files:
  created: []
  modified:
    - src/app/(admin)/admin/usage/page.tsx
decisions:
  - Aggregate over allRows (unfiltered 500-row fetch) so summary stats are not skewed by date/user filter
  - Reuse StatCard pattern from /admin/jobs/[id]/page.tsx for visual consistency
metrics:
  duration: ~8min
  completed: 2026-05-26
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
---

# Phase 06 Plan 6A: Admin Usage Aggregation Summary

## One-liner

Added three aggregate sections (summary stats cards, per-user table, per-stage table) above the existing raw table on `/admin/usage`, computed server-side via in-process Map aggregation over the most recent 500 `ai_usage` rows.

## What Changed

### `src/app/(admin)/admin/usage/page.tsx`

**Task 1 — Aggregation logic:**
- Raised filtered query limit from 200 → 500
- Added a second unfiltered `allRows` fetch (`.limit(500)`) that always runs regardless of date/user filters — ensures summary stats reflect the full recent window, not the filtered slice
- Added `UserSummary` and `StageSummary` TypeScript types (no `any`)
- Added `byUser: Map<string, UserSummary>` — populated via `for...of` over `allRows`, accumulating `totalCostUsd`, `totalTokens`, `callCount`
- Added `byStage: Map<string, StageSummary>` — same pattern per stage name
- Derived `userSummaries` and `stageSummaries` arrays sorted descending by `totalCostUsd`
- Computed `allTimeCost`, `allTimeTokens`, `allTimeCalls` from `allRows`

**Task 2 — Rendering:**
- Added local `StatCard` function component (exact pattern from `/admin/jobs/[id]/page.tsx`)
- Inserted three new sections between page header and filter bar:
  1. Summary stats grid (`md:grid-cols-3`): Total Cost, Total Tokens, Total Calls
  2. Per-user summary table: User, Calls, Total Tokens, Total Cost (USD) — "Aggregated over last 500 records" annotation, empty-state for zero rows
  3. Per-stage breakdown table: Stage, Calls, Total Tokens, Total Cost (USD) — empty-state for zero rows
- Existing filter form (`<form method="get">`) and raw table preserved below the new sections unchanged
- Footer label updated to "Total cost (filtered)" for clarity

## Verification

- `npm run typecheck` — exits 0, no TypeScript errors
- `npm run build` — TypeScript compilation phase passes ("Compiled successfully"); prerendering export failures are pre-existing (Supabase connection unavailable at build time for `force-dynamic` pages — not caused by this change)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no hardcoded data, no placeholder text for functional values. Empty-states render "No data yet." / "No stage data yet." which are correct zero-row states, not stubs.

## Threat Flags

No new security surface introduced. Page remains behind `requireRole("admin")` in AdminLayout. No new API routes, endpoints, or trust boundary crossings.

## Self-Check: PASSED

- [x] `src/app/(admin)/admin/usage/page.tsx` exists and contains `UserSummary`, `StageSummary`, `byUser`, `byStage`, `allTimeCost`, `StatCard`
- [x] Commit `0777121` exists on branch `worktree-agent-a07a37713f9aae8b9`
- [x] No unexpected file deletions in commit
