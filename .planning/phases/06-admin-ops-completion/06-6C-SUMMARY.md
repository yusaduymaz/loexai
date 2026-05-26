---
phase: 06-admin-ops-completion
plan: 6C
subsystem: admin-intelligence-viewer
tags: [admin, templates, scoring, intelligence, server-component]
dependency_graph:
  requires: []
  provides: [admin-templates-live-view]
  affects: [src/lib/intelligence/templates.ts, src/lib/intelligence/scoring.ts, src/app/(admin)/admin/templates/page.tsx]
tech_stack:
  added: []
  patterns: [server-only imports, named exports from lib modules, live code-backed admin views]
key_files:
  created: []
  modified:
    - src/lib/intelligence/templates.ts
    - src/lib/intelligence/scoring.ts
    - src/app/(admin)/admin/templates/page.tsx
decisions:
  - Upgraded /admin/templates from static hardcoded list to live viewer backed by real code exports
  - Used additive-only changes (export keyword) to templates.ts and scoring.ts — no function bodies changed
  - SCORE_WEIGHTS added as a const object with `as const` for inferred typing — documents scoring arithmetic for admin display
  - Admin page stays a sync Server Component (no async, no DB queries) — static rendering sufficient
  - Imports kept directly in page.tsx per server-only constraint — not passed through any use client component
metrics:
  duration: 12m
  completed: 2026-05-26T12:25:00Z
  tasks_completed: 2
  files_modified: 3
---

# Phase 06 Plan 6C: Admin Templates Live Viewer Summary

Upgraded /admin/templates from a static hardcoded 3-entry list (Klinik, Kafe, Güzellik) to a live viewer that directly imports and renders the deployed exports from lib/intelligence/templates.ts and lib/intelligence/scoring.ts.

## What Was Done

### Task 1: Export constants from templates.ts and scoring.ts (commit: e9de067)

**templates.ts changes (additive only):**
- `const TEMPLATE_VERSION` → `export const TEMPLATE_VERSION`
- `const DEFAULT_SIGNALS` → `export const DEFAULT_SIGNALS`
- `const CATEGORY_SIGNAL_MAP` → `export const CATEGORY_SIGNAL_MAP`

**scoring.ts changes (additive only):**
- `const FORMULA_VERSION` → `export const FORMULA_VERSION`
- Added new `export const SCORE_WEIGHTS` constant documenting all five scoring formula components:
  - reviewSignal: `min(20, round(review_count / 10))` — max 20
  - ratingSignal: `max(0, round((5 - rating) * 6))` — max 30
  - gapSignal: `min(45, round(severityScore * 0.45))` — max 45
  - reachabilitySignal: `probe.status !== 'ok' ? 12 : 0` — max 12
  - contactSignal: `!hasContact && !phone ? 10 : 0` — max 10

Neither `getIndustryExpectation` nor `scoreOpportunity` function bodies were modified.

### Task 2: Rewrite /admin/templates page (commit: e86fd5d)

Replaced the entire static file with a live-backed Server Component:

- **Section A — Header:** Shows "Industry Templates" with TEMPLATE_VERSION and instructions
- **Section B — Category cards grid (1/2/3 cols responsive):** Iterates `Object.entries(CATEGORY_SIGNAL_MAP)` — renders all 10 categories (restaurant, restaurants, cafe, dentist, dentists, gym, gyms, salon, spa, clinic) with their signals
- **Section C — Default fallback card:** Renders DEFAULT_SIGNALS (website, mobile, contact, social) for unmatched categories
- **Section D — Scoring formula table:** Renders all 5 SCORE_WEIGHTS entries with Component, Formula, Max Points columns; shows FORMULA_VERSION

Old static `TEMPLATES` constant with 3 hardcoded entries removed entirely.

## Verification

- `npm run typecheck` exits 0
- `npm run build` compiles successfully and generates all 24 static pages; Windows-specific `.next` temp file rename error is a Next.js 14.2.x filesystem artifact unrelated to our changes
- All 10 CATEGORY_SIGNAL_MAP keys render correctly
- DEFAULT_SIGNALS card shows 4 signals
- SCORE_WEIGHTS table shows 5 rows, max values sum to 117 (20+30+45+12+10)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data sourced from live code exports, no placeholders.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. Both lib files retain `import "server-only"` and the admin page has no `"use client"` directive.

## Self-Check: PASSED

- src/lib/intelligence/templates.ts — modified, exports verified
- src/lib/intelligence/scoring.ts — modified, exports verified
- src/app/(admin)/admin/templates/page.tsx — rewritten, imports verified
- Commit e9de067 — exists (Task 1)
- Commit e86fd5d — exists (Task 2)
