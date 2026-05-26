---
phase: 06-admin-ops-completion
reviewed: 2026-05-26T12:47:23Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/app/(admin)/admin/usage/page.tsx
  - src/app/(admin)/admin/failures/page.tsx
  - src/components/admin/AdminSidebar.tsx
  - src/app/(admin)/admin/page.tsx
  - src/lib/intelligence/templates.ts
  - src/lib/intelligence/scoring.ts
  - src/app/(admin)/admin/templates/page.tsx
findings:
  critical: 0
  warning: 6
  info: 3
  total: 9
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-05-26T12:47:23Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Seven files across the admin ops completion phase were reviewed. The intelligence layer (`scoring.ts`, `templates.ts`) and admin UI pages (`usage`, `failures`, `templates`, `page`, `AdminSidebar`) were examined at full depth.

No critical security vulnerabilities or data loss risks were found. The admin layout correctly gates all admin pages behind `requireRole('admin')` defense-in-depth, and the service-role Supabase client is properly `server-only` guarded throughout.

Six warnings were identified: a logic bug in the scoring formula's rating fallback, misleading stat labels on both the usage and failures pages, silent error swallowing in the usage page user-lookup, date-filter inconsistency affecting only the raw table (not the summary tables), and an out-of-range `grid-cols` value on the admin overview. Three informational items complete the findings.

---

## Warnings

### WR-01: Falsy check on `rating` causes wrong score for `rating === 0`

**File:** `src/lib/intelligence/scoring.ts:26`
**Issue:** The `ratingSignal` computation uses a truthy check on `business.rating` to decide whether to apply the formula or return the hardcoded fallback value `8`. When `business.rating` is exactly `0`, the condition evaluates to falsy and returns `8` instead of running the formula, which would correctly return `30` (best possible signal: `Math.max(0, Math.round((5 - 0) * 6))`). Although Google Maps ratings are 1–5 in practice, data corruption or future provider differences could supply `0`, producing a silently incorrect score.

The `SCORE_WEIGHTS` documentation string also does not mention the `8` fallback — it only documents the formula — creating a discrepancy between the documented and actual behavior.

**Fix:**
```ts
// Before
const ratingSignal = business.rating ? Math.max(0, Math.round((5 - business.rating) * 6)) : 8;

// After — null/undefined guard, not a truthiness check
const ratingSignal =
  business.rating !== null && business.rating !== undefined
    ? Math.max(0, Math.round((5 - business.rating) * 6))
    : 8;
```

---

### WR-02: "Total Cost (all-time)" and "Total Tokens" stat cards are bounded by the 500-row fetch window

**File:** `src/app/(admin)/admin/usage/page.tsx:93-98, 177-179`
**Issue:** `allTimeCost`, `allTimeTokens`, and `allTimeCalls` are computed from `allRows`, which is capped at `limit(500)` (line 89). The three stat cards are labelled "Total Cost (all-time)", "Total Tokens", and "Total Calls" — all misleadingly implying full-database aggregates. An active system with more than 500 AI calls will silently underreport every one of these figures. Admins using this page for cost control decisions (as prescribed in CLAUDE.md §9) will receive wrong data.

**Fix:** Either label the cards truthfully ("Last 500 Calls" / "Last 500 Calls — Cost"), or replace the application-side aggregation with a Supabase aggregate query so the numbers reflect the real database totals:
```ts
// Replace the allData fetch + in-process sum with:
const { data: totals } = await admin
  .from("ai_usage")
  .select("cost_usd.sum(), input_tokens.sum(), output_tokens.sum(), count()")
  .single();
```
If the query-level aggregation is not feasible yet, at minimum change the labels to "Cost (last 500 calls)", etc.

---

### WR-03: Summary tables (per-user, per-stage) are not affected by the filter bar; no indication to the admin

**File:** `src/app/(admin)/admin/usage/page.tsx:85-142, 144-162`
**Issue:** The page performs two separate DB queries: one unfiltered 500-row fetch (`allData`, lines 85–89) used for the summary tables, and one filtered fetch (`data`, lines 145–161) used only for the raw table at the bottom. The filter bar (From / To / User email) therefore silently has no effect on the per-user summary and per-stage breakdown sections. An admin who applies a "From: 2026-01-01" date filter will see the raw table respond to the filter while the summary tables remain unchanged — a confusing and potentially misleading experience for cost auditing.

**Fix:** Apply the same filters to the `allData` query, or add a visible disclaimer beneath the summary tables:
```tsx
<p className="text-xs text-on-surface-variant">
  Note: summaries reflect the last 500 records regardless of the filter above.
</p>
```

---

### WR-04: "Total Failures" stat card reflects only the last 200 DB rows, not total failures

**File:** `src/app/(admin)/admin/failures/page.tsx:42, 79`
**Issue:** The failures query is capped at `limit(200)` (line 37). `totalFailures` is computed as `failedRuns.length` (line 42), which is at most 200. The stat card labels this "Total Failures" (line 79). A system with 500 historical failures will show "200" here, indistinguishable from a system that genuinely only ever had 200. The `distinctStages` and `distinctProviders` figures are subject to the same truncation.

**Fix:** Same options as WR-02: aggregate at DB level or relabel:
```tsx
<StatCard label="Failures (last 200)" value={String(totalFailures)} />
```

---

### WR-05: Silent error swallowing on user-email lookup masks DB connectivity failures

**File:** `src/app/(admin)/admin/usage/page.tsx:70-81`
**Issue:** The user-email-to-id resolution destructures only `{ data: u }` and discards the `error` return from the Supabase call. If the DB is unreachable or the `users` table returns an error, `u` is `null`, `userIdFilter` is set to `"__no_match__"`, and the page renders empty data with no indication of failure. An admin debugging an issue who happens to be filtering by email would see empty results and wrongly conclude that the user has no AI usage.

**Fix:**
```ts
const { data: u, error: userLookupError } = await admin
  .from("users")
  .select("id")
  .eq("email", params.user.trim())
  .maybeSingle();

if (userLookupError) {
  // Surface the error — throw triggers Next.js error boundary
  throw new Error(`User lookup failed: ${userLookupError.message}`);
}
```

---

### WR-06: Admin overview grid declares `xl:grid-cols-5` but renders 6 tiles

**File:** `src/app/(admin)/admin/page.tsx:69`
**Issue:** `TILES` contains 6 entries (Users, AI Usage, Scan Jobs, Failures, Templates, Health) but the grid specifies `xl:grid-cols-5`. On extra-large screens, the sixth tile (Health) wraps to a second row and displays alone at full-width, breaking the intended card-grid layout.

**Fix:** Change the grid class to match the tile count:
```tsx
// Before
<div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-5">

// After
<div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
// or xl:grid-cols-6 if a single-row layout is desired
```

---

## Info

### IN-01: Dead code — `restaurants`, `dentists`, `gyms` entries in `CATEGORY_SIGNAL_MAP` are unreachable

**File:** `src/lib/intelligence/templates.ts:16-25`
**Issue:** `getIndustryExpectation` looks up a category key using `normalized.includes(candidate)`. Because `Object.keys()` preserves insertion order and `"restaurant"` precedes `"restaurants"`, any input containing `"restaurants"` will match `"restaurant"` first. The same applies to `"dentist"`/`"dentists"` and `"gym"`/`"gyms"`. Since all three plural entries carry identical signal arrays to their singular counterparts, they are both unreachable and redundant.

**Fix:** Remove the three duplicate plural entries:
```ts
export const CATEGORY_SIGNAL_MAP: Record<string, IndustryExpectation["expectedSignals"]> = {
  restaurant: ["website", "mobile", "contact", "booking", "whatsapp", "social"],
  // restaurants: removed — "restaurant" substring matches first
  cafe: ["website", "mobile", "contact", "social"],
  dentist: ["website", "mobile", "contact", "booking"],
  // dentists: removed
  gym: ["website", "mobile", "contact", "booking", "social"],
  // gyms: removed
  salon: ["website", "mobile", "contact", "booking", "social"],
  spa: ["website", "mobile", "contact", "booking", "social"],
  clinic: ["website", "mobile", "contact", "booking"],
};
```

---

### IN-02: `/admin/health` tile in overview page has no corresponding sidebar entry

**File:** `src/app/(admin)/admin/page.tsx:44-51` / `src/components/admin/AdminSidebar.tsx:23-30`
**Issue:** The admin overview page includes a "Health" tile linking to `/admin/health`, but `AdminSidebar`'s `NAV` array has no entry for that route. The health page is accessible only by clicking the overview card or navigating directly by URL; once inside the health page, there is no active-state indicator in the sidebar and no breadcrumb context that the user is in `/admin/health`. This is an inconsistency between the two navigation surfaces.

**Fix:** Add an entry to `NAV` in `AdminSidebar.tsx`:
```ts
import { Activity, ... } from "lucide-react";

const NAV = [
  ...existing entries...,
  { href: "/admin/health", icon: Activity, label: "Health" },
];
```

---

### IN-03: `StatCard` defined after first use in `failures/page.tsx`

**File:** `src/app/(admin)/admin/failures/page.tsx:224`
**Issue:** `StatCard` is invoked at lines 79–81 but its declaration appears at line 224. JavaScript function declarations are hoisted so this will not cause a runtime error. However, it is inconsistent with `usage/page.tsx` where `StatCard` is declared before `AdminUsagePage` (line 49), and it reduces readability. For consistency and to match the project's other files, the declaration should precede its use.

**Fix:** Move the `StatCard` function declaration to before `AdminFailuresPage`, matching the structure of `usage/page.tsx`.

---

_Reviewed: 2026-05-26T12:47:23Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
