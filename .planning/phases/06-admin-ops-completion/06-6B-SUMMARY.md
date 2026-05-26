---
phase: 06-admin-ops-completion
plan: 6B
subsystem: admin
tags: [admin, monitoring, pipeline, failures, supabase]
dependency_graph:
  requires: []
  provides: [admin-failures-page, admin-sidebar-failures-link, admin-overview-failures-tile]
  affects: [src/app/(admin)/admin/failures/page.tsx, src/components/admin/AdminSidebar.tsx, src/app/(admin)/admin/page.tsx]
tech_stack:
  added: []
  patterns: [server-component-data-fetch, admin-client-service-role, map-based-aggregation, design-token-tables]
key_files:
  created:
    - src/app/(admin)/admin/failures/page.tsx
  modified:
    - src/components/admin/AdminSidebar.tsx
    - src/app/(admin)/admin/page.tsx
decisions:
  - Used Map<string, number> for in-memory aggregation instead of SQL GROUP BY (data volume capped at 200 rows)
  - Used index `i` as React key for failuresByProvider rows since provider+model combination is not guaranteed unique per row
metrics:
  duration: ~8 minutes
  completed: 2026-05-26
  tasks_completed: 2
  tasks_total: 2
---

# Phase 06 Plan 6B: Admin Failures Page Summary

**One-liner:** Provider failure monitoring page at /admin/failures reading pipeline_stage_runs with status=failed, with in-memory aggregation by stage and provider/model.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create /admin/failures page | 5474dfb | src/app/(admin)/admin/failures/page.tsx (created) |
| 2 | Register in sidebar and overview | c3b2ff5 | src/components/admin/AdminSidebar.tsx, src/app/(admin)/admin/page.tsx |

## What Was Built

### Task 1: /admin/failures page

New server component at `src/app/(admin)/admin/failures/page.tsx` that:

- Fetches up to 200 failed `pipeline_stage_runs` rows using `createAdminClient()` with `.eq("status", "failed")`
- Computes three summary stats: total failures, distinct stages affected, distinct providers affected
- Renders three sections:
  1. **Summary stat cards** (3-col grid): Total Failures, Distinct Stages Affected, Distinct Providers Affected
  2. **Failure count by stage** table (sorted descending by count)
  3. **Failure count by provider/model** table (sorted descending by count)
  4. **Recent 50 failures** table with columns: Date, Stage, Business ID (truncated UUID), Provider, Model, Error Code, Error Message
- Uses `force-dynamic` export, design tokens (`bg-surface-container-low`, `border-outline-variant`, etc.), and local `StatCard` component matching the jobs detail page pattern
- All nullable fields use `?? "—"` fallback; empty state shows "No failures recorded yet." for all tables

### Task 2: Sidebar nav and overview tiles

**AdminSidebar.tsx:**
- Added `AlertTriangle` to lucide-react imports
- Inserted `{ href: "/admin/failures", icon: AlertTriangle, label: "Failures" }` between Scan Jobs and Templates in the NAV array

**admin/page.tsx:**
- Added `AlertTriangle` to lucide-react imports
- Inserted Failures tile `{ href: "/admin/failures", icon: AlertTriangle, title: "Failures", body: "Failed pipeline stage runs by stage and provider." }` between Scan Jobs and Templates in the TILES array

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. The page correctly shows empty-state messaging when `pipeline_stage_runs` has no failed rows (Phase 3+ activates the pipeline). This is intentional behavior, not a stub.

## Threat Flags

No new threat surface beyond what the plan's threat model documents. `/admin/failures` is protected by the existing `requireRole("admin")` gate in AdminLayout.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/app/(admin)/admin/failures/page.tsx | FOUND |
| src/components/admin/AdminSidebar.tsx | FOUND |
| src/app/(admin)/admin/page.tsx | FOUND |
| commit 5474dfb (Task 1) | FOUND |
| commit c3b2ff5 (Task 2) | FOUND |
| npm run typecheck | EXIT 0 |
| npm run build | EXIT 0 |
