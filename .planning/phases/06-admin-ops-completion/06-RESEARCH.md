# Phase 6: Admin Ops Completion - Research

**Researched:** 2026-05-26
**Domain:** Next.js 14 App Router server components, Supabase admin client, in-memory data aggregation, server-only module constraints
**Confidence:** HIGH

---

## Summary

Phase 6 completes the three remaining admin surfaces that were left as shells in earlier phases. All three deliverables are pure read-heavy UI tasks with zero new schema, no AI calls, and no new packages. All data comes from tables already fully migrated and indexed. The implementation pattern is identical to what already exists in the codebase: a Server Component imports `createAdminClient()`, queries Supabase with the service-role client, aggregates data in-process with TypeScript, and renders the result as a static table or card set.

The main constraint is that `src/lib/intelligence/templates.ts` and `src/lib/intelligence/scoring.ts` both declare `import "server-only"`. This means both files can only be imported from other server-only modules or from Server Components (which are server-only by definition in App Router). The `/admin/templates` upgrade is a Server Component, so it can import these files directly — no intermediate wrapper is needed.

The provider-failure monitoring deliverable introduces one genuinely new page (`/admin/failures`). It reads from `pipeline_stage_runs` (already exists, fully migrated). The query pattern is the same service-role bypass used everywhere else in the admin section. Navigation registration in `AdminSidebar.tsx` and `AdminOverviewPage` will need a new entry for this page.

**Primary recommendation:** Each deliverable is a self-contained file edit. Build them as three separate tasks in dependency order: (1) upgrade `/admin/usage`, (2) create `/admin/failures`, (3) upgrade `/admin/templates`. The admin overview and sidebar also need a single coordinated update to register the new `/admin/failures` link.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| AI usage aggregation (per-user totals, per-stage breakdown) | Frontend Server (SSR) | — | Data is fetched server-side, aggregated in TypeScript, rendered as static HTML — no client state needed |
| Provider failure list + counts | Frontend Server (SSR) | — | Same pattern — service-role query, in-process group-by, static render |
| Template & scoring rule display | Frontend Server (SSR) | — | Templates live in `server-only` TS modules; a Server Component imports them directly |
| Admin navigation (sidebar + overview tiles) | Browser / Client (AdminSidebar is `"use client"`) | Frontend Server (layout) | Sidebar is a Client Component for `usePathname()`; overview tiles are rendered by a Server Component |

---

## Standard Stack

### Core (already installed — no new packages)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@supabase/supabase-js` | ^2.45.4 | Admin-client DB queries | `createAdminClient()` already in `src/lib/supabase/admin.ts` [VERIFIED: package.json] |
| `next` | ^14.2.18 | App Router Server Components | All admin pages are async Server Components [VERIFIED: codebase] |
| `tailwindcss` | ^3.4.14 | Design-token CSS classes | All admin UI uses existing token classes [VERIFIED: codebase] |
| `lucide-react` | ^0.460.0 | Icons for sidebar nav entry | Already used throughout admin [VERIFIED: codebase] |

**No new npm installs needed for any deliverable.** [VERIFIED: codebase analysis]

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Admin user)
        |
        v
Admin Layout (Server Component) — requireRole("admin") guard
        |
        +──> /admin/usage      (Server Component, force-dynamic)
        |         |
        |         v
        |    createAdminClient() → ai_usage JOIN users
        |         |
        |         v
        |    In-process TypeScript aggregation:
        |      • per-user summary (group-by user_id)
        |      • per-stage cost breakdown (group-by stage)
        |      • period totals (Array.reduce)
        |         |
        |         v
        |    Static HTML table (3 sections)
        |
        +──> /admin/failures   (NEW — Server Component, force-dynamic)
        |         |
        |         v
        |    createAdminClient() → pipeline_stage_runs (status='failed', limit 100)
        |         |
        |         v
        |    In-process TypeScript aggregation:
        |      • failure count by stage (group-by stage)
        |      • failure count by provider/model
        |      • recent error messages
        |         |
        |         v
        |    Static HTML (stats cards + failure list table)
        |
        +──> /admin/templates  (upgraded Server Component)
                  |
                  v
         Import from lib/intelligence/templates.ts (server-only OK)
         Import from lib/intelligence/scoring.ts   (server-only OK)
                  |
                  v
         Derive display data at module init time:
           CATEGORY_SIGNAL_MAP, DEFAULT_SIGNALS, TEMPLATE_VERSION
           FORMULA_VERSION, scoring weight constants
                  |
                  v
         Static HTML cards (category → signals) + formula table
```

### Recommended Project Structure (additions only)

```
src/
  app/
    (admin)/
      admin/
        failures/
          page.tsx        # NEW: Provider failure monitoring page
        usage/
          page.tsx        # MODIFIED: Add aggregation sections
        templates/
          page.tsx        # MODIFIED: Import from lib/intelligence/*
  components/
    admin/
      AdminSidebar.tsx    # MODIFIED: Add /admin/failures nav entry
    admin/
      page.tsx            # MODIFIED: Add Failures tile to overview
```

### Pattern 1: In-Process Aggregation (existing, extend here)

**What:** Fetch raw rows server-side with the admin client, group/reduce in TypeScript before rendering.

**When to use:** When Supabase does not expose a direct aggregate RPC and the row count is bounded (e.g., 200 ai_usage rows, 100 stage runs). Avoids Supabase RPC complexity for simple group-by.

**Example (per-user cost aggregation from existing raw rows):**
```typescript
// Source: derived from existing /admin/usage/page.tsx pattern
type UserSummary = {
  userId: string;
  email: string;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  callCount: number;
};

const byUser = new Map<string, UserSummary>();
for (const row of rows) {
  const key = row.user_id;
  const existing = byUser.get(key) ?? {
    userId: key,
    email: row.users?.email ?? "—",
    totalCostUsd: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    callCount: 0,
  };
  existing.totalCostUsd += row.cost_usd ?? 0;
  existing.totalInputTokens += row.input_tokens ?? 0;
  existing.totalOutputTokens += row.output_tokens ?? 0;
  existing.callCount += 1;
  byUser.set(key, existing);
}
const userSummaries = [...byUser.values()].sort(
  (a, b) => b.totalCostUsd - a.totalCostUsd
);
```

### Pattern 2: server-only Module Import in Server Component

**What:** Files declaring `import "server-only"` can be imported directly in async Server Components. Next.js build enforcement means any accidental client-side import becomes a build error, not a runtime leak.

**When to use:** Any admin page that needs to display data from `lib/intelligence/`.

**Example:**
```typescript
// Source: verified from src/lib/intelligence/templates.ts and scoring.ts
// This import is VALID in a Server Component:
import { getIndustryExpectation } from "@/lib/intelligence/templates";
import { scoreOpportunity } from "@/lib/intelligence/scoring";
// NOT valid in a Client Component — build will fail with clear error
```

**Constraint for templates page:** The current `AdminTemplatesPage` has no `async` keyword and no `createAdminClient()`. To import from `templates.ts` it only needs to be an async Server Component (or even sync — server-only is checked at build time not runtime). No `"use server"` is needed. Simply convert to importing the real constants instead of the hardcoded array.

### Pattern 3: pipeline_stage_runs Failure Query

**What:** Query `pipeline_stage_runs` with `status = 'failed'` using the admin client, then group by stage and by `provider`/`model` in TypeScript.

**Example:**
```typescript
// Source: verified from migration 20260525014500_pipeline_audit_model.sql
const { data } = await admin
  .from("pipeline_stage_runs")
  .select(
    "id, stage, status, provider, model, error_code, error_message, business_id, attempt_number, created_at"
  )
  .eq("status", "failed")
  .order("created_at", { ascending: false })
  .limit(100);
```

**RLS note:** `pipeline_stage_runs` RLS uses `business.user_id = auth.uid()`. The service-role client bypasses RLS entirely — admin sees all failures across all users. [VERIFIED: migration file]

### Pattern 4: Force-Dynamic Export

All admin pages that read from DB must include: [VERIFIED: existing admin pages]
```typescript
export const dynamic = "force-dynamic";
```

### Pattern 5: StatusBadge reuse

The `StatusBadge` component defined inside `/admin/jobs/[id]/page.tsx` uses `Badge` from `@/components/ui/badge` with `variant` prop. The failures page can define its own inline `StatusBadge` following the exact same pattern, or extract it. Since existing admin pages each define it locally, follow the same convention (local definition per page).

### Anti-Patterns to Avoid

- **Supabase RPC for simple aggregation:** No need to write a Postgres function for group-by on small bounded sets. In-process TypeScript aggregation is simpler and more debuggable.
- **Client-side data fetching for admin views:** All admin pages are Server Components. Never add `"use client"` to an admin page that reads DB.
- **Importing templates.ts from a client component:** `import "server-only"` will cause a build error. If ever needed client-side, data must be passed as props from a Server Component parent.
- **Hardcoded data left in templates page:** The current `/admin/templates/page.tsx` uses a static TEMPLATES constant copied from CLAUDE.md. Phase 6 replaces this with real imports from `lib/intelligence/templates.ts` and `lib/intelligence/scoring.ts`.
- **Missing `export const dynamic = "force-dynamic"`:** Without this, Next.js may statically render the page at build time, caching stale data. All DB-reading admin pages need it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Group-by aggregation on small sets | Custom tree-reduction utilities | Plain `Map<string, T>` + `for...of` loop | Already the pattern in the codebase; no abstraction needed |
| Admin auth guard | Custom middleware logic in pages | `requireRole("admin")` from `@/lib/auth/require-role` | Already enforced by layout — pages don't need it again |
| Service-role Supabase client | Inline `createClient(url, serviceRoleKey)` | `createAdminClient()` from `@/lib/supabase/admin` | Enforces `import "server-only"` and correct auth options |
| Status pill / badge | Custom span with hardcoded colors | `Badge` component with `variant` prop | Already used in admin pages |

---

## Common Pitfalls

### Pitfall 1: Forgetting `force-dynamic` on the new failures page

**What goes wrong:** Next.js caches the page at build time, showing stale or empty failure data permanently.

**Why it happens:** New pages default to static rendering unless opted out.

**How to avoid:** First line of every admin page file after imports: `export const dynamic = "force-dynamic";`

**Warning signs:** Page renders with 0 rows in production even when failures exist.

---

### Pitfall 2: Importing templates.ts through a Client Component

**What goes wrong:** Build fails with a `server-only` error: "This module cannot be used in a Client Component."

**Why it happens:** `AdminSidebar.tsx` is `"use client"`. If a parent tries to pass template data as a prop by importing templates.ts in the same file, it breaks.

**How to avoid:** Import `templates.ts` and `scoring.ts` ONLY in the Server Component page (`page.tsx`), not in any component that is or could become a Client Component. Pass display data as plain serializable props if extraction to a component is ever needed.

**Warning signs:** Build output shows "You're importing a component that needs server-only" error on `AdminTemplatesPage`.

---

### Pitfall 3: Aggregating beyond the query limit

**What goes wrong:** The usage page currently fetches `limit(200)` rows. Per-user aggregation only reflects those 200 rows, not all-time totals. If a user has > 200 rows, their summary will be understated.

**Why it happens:** The current query caps at 200 for performance.

**How to avoid:** For the aggregated summary section, either (a) accept this as a known limitation and note it in the UI ("showing aggregates over the last 200 records"), or (b) use a higher limit or remove the limit for the summary query. Given Phase 6 is MVP admin tooling, option (a) is appropriate — document in the page description.

**Warning signs:** Admin sees costs that don't match sum of visible rows.

---

### Pitfall 4: Registering the new /admin/failures route only in one place

**What goes wrong:** Adding the nav entry to `AdminSidebar` but forgetting `AdminOverviewPage`'s `TILES` array (or vice versa), leaving the admin overview inconsistent with the sidebar.

**Why it happens:** Navigation is defined in two places — the sidebar (`AdminSidebar.tsx`) and the overview page (`/admin/page.tsx`).

**How to avoid:** When adding `/admin/failures`, update both files atomically. A code review checklist or a single task covering both edits prevents this.

**Warning signs:** Failures link appears in sidebar but not on the admin overview cards, or vice versa.

---

### Pitfall 5: TypeScript strict mode on aggregated types

**What goes wrong:** `rows[0].users?.email` is `string | undefined` from the Supabase join. If not handled, TypeScript strict mode will error on direct string concatenation.

**Why it happens:** The Supabase client types the joined relation as potentially null/undefined.

**How to avoid:** Follow the existing `r.users?.email ?? "—"` pattern throughout all new aggregation code. Every nullable field from Supabase needs `?? fallback`.

---

## Code Examples

Verified patterns from codebase:

### Per-Stage Breakdown from ai_usage rows
```typescript
// Source: derived from pattern established in /admin/usage/page.tsx
type StageSummary = {
  stage: string;
  totalCostUsd: number;
  callCount: number;
};

const byStage = new Map<string, StageSummary>();
for (const row of rows) {
  const s = row.stage;
  const existing = byStage.get(s) ?? { stage: s, totalCostUsd: 0, callCount: 0 };
  existing.totalCostUsd += row.cost_usd ?? 0;
  existing.callCount += 1;
  byStage.set(s, existing);
}
const stageSummaries = [...byStage.values()].sort(
  (a, b) => b.totalCostUsd - a.totalCostUsd
);
```

### pipeline_stage_runs Failure Count by Stage
```typescript
// Source: derived from pipeline_stage_runs schema (migration 20260525014500)
type FailureByStage = { stage: string; count: number };
const stageMap = new Map<string, number>();
for (const run of failedRuns) {
  stageMap.set(run.stage, (stageMap.get(run.stage) ?? 0) + 1);
}
const failuresByStage: FailureByStage[] = [...stageMap.entries()]
  .map(([stage, count]) => ({ stage, count }))
  .sort((a, b) => b.count - a.count);
```

### Extracting Scoring Weights from scoring.ts for Display
```typescript
// Source: verified from src/lib/intelligence/scoring.ts
// The formula constants are inline in scoreOpportunity(); they are not exported.
// The templates page must hard-code the display of the formula, OR scoring.ts
// can be updated to export named constants for documentation purposes.
// Current state: weights are inline — see scoring.ts lines 17-22.
// reviewSignal  = min(20, round(review_count / 10))
// ratingSignal  = max(0, round((5 - rating) * 6))  [max 30 for 0-star]
// gapSignal     = min(45, round(severityScore * 0.45))
// reachabilitySignal = 12 if probe.status !== 'ok', else 0
// contactSignal = 10 if no contact signal and no phone, else 0
// FORMULA_VERSION = "opportunity-score-v1"
```

**Important:** Scoring weight values are **not exported** from `scoring.ts`. The templates page can import `scoring.ts` to display the `FORMULA_VERSION` string conceptually — but the actual weight table must be read by inspecting the function body. To make these displayable cleanly, the planner should include a task to **export named weight constants** from `scoring.ts` (or define a `SCORE_WEIGHTS` export object). This is a small code change in `scoring.ts` that unlocks clean display in the templates page.

### Reading templates.ts Constants for Display
```typescript
// Source: verified from src/lib/intelligence/templates.ts
// CATEGORY_SIGNAL_MAP and DEFAULT_SIGNALS are module-private constants.
// getIndustryExpectation() is the only export.
// To display the full category map, the planner has two options:
// Option A: Export CATEGORY_SIGNAL_MAP directly from templates.ts
// Option B: Call getIndustryExpectation(category) for each known category
//
// Option A is cleaner for a viewer page. Add:
// export { CATEGORY_SIGNAL_MAP, DEFAULT_SIGNALS, TEMPLATE_VERSION };
// This is a small, safe change — these are read-only constants.
```

### Period Stats Card Pattern (existing)
```typescript
// Source: /admin/jobs/[id]/page.tsx StatCard pattern
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 text-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | Phase | Impact |
|--------------|------------------|-------|--------|
| Static hardcoded TEMPLATES array in admin page | Real import from `lib/intelligence/templates.ts` | Phase 6 | Single source of truth — template page always reflects deployed code |
| Raw row table only in /admin/usage | Raw table + aggregated summary sections | Phase 6 | Admin can see top spenders and stage breakdown at a glance |
| No failure monitoring surface | /admin/failures page | Phase 6 | Admin can identify which pipeline stages and providers are failing in production |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `scoring.ts` weight constants are not exported — they are inline in `scoreOpportunity()` | Code Examples | If they were exported, the templates page approach changes slightly — but this was verified by reading the file |
| A2 | `CATEGORY_SIGNAL_MAP` and `DEFAULT_SIGNALS` are not exported from `templates.ts` | Code Examples | Same as A1 — verified by reading the file; both are `const` without `export` |
| A3 | `/admin/failures` does not already exist | Standard Stack | Verified via Glob — no `failures/` directory exists under `src/app/(admin)/admin/` |

**Note:** A1 and A2 are tagged ASSUMED in label but are actually [VERIFIED: codebase read]. The risk column is retained as a reminder that changing these exports touches a `server-only` module and requires a typecheck pass.

---

## Open Questions

1. **Limit for usage aggregation queries**
   - What we know: Current usage page uses `limit(200)`. With aggregation, this may undercount users with many AI calls.
   - What's unclear: Whether MVP admin needs all-time totals or "recent 200" totals is acceptable.
   - Recommendation: Use `limit(500)` for the new aggregated query (covers reasonable MVP usage) and add a note in the page: "Aggregates over the last 500 records". This avoids unbounded queries without losing meaningful signal.

2. **Scope of scoring weight display**
   - What we know: `scoring.ts` has inline weight constants (not exported). Display requires either exporting them or hard-coding the display table.
   - What's unclear: Whether the product requires the template viewer to always stay in sync with the live formula, or a manually maintained display is acceptable.
   - Recommendation: Export named constants (`SCORE_WEIGHTS`) from `scoring.ts` in the same task that upgrades the templates page. This is a 5-line change that eliminates drift risk.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is purely code/configuration changes within the existing Next.js + Supabase stack. No new external services, CLIs, or runtimes are introduced.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — no test framework configured in project |
| Config file | None (no jest.config, vitest.config, or test scripts in package.json) |
| Quick run command | `npm run typecheck` (TypeScript compile check — the closest available automated check) |
| Full suite command | `npm run build` (full Next.js build — catches server-only import violations, type errors, missing exports) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADM-02 | Admin can view ai_usage per-user aggregates and per-stage breakdown | smoke (build) | `npm run build` | ❌ Wave 0 |
| ADM-03 | Admin can view industry templates backed by real code exports | smoke (build) | `npm run build` | ❌ Wave 0 |
| ADM-02 (ext) | Admin can view provider failure monitoring | smoke (build) | `npm run build` | ❌ Wave 0 |

**Note:** The project has no unit/integration test framework. The only automated verification available is TypeScript compilation (`npm run typecheck`) and a full Next.js production build (`npm run build`). The build catches: server-only import violations, TypeScript type errors, missing Supabase column references, and broken exports.

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run build`
- **Phase gate:** `npm run build` passes cleanly before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No test framework configured — existing project uses build + typecheck only. No framework install needed; sampling uses build artifacts.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireRole("admin")` in admin layout — already enforced |
| V3 Session Management | yes | Handled by Clerk + existing middleware — no changes needed |
| V4 Access Control | yes | `createAdminClient()` (service-role) only in server-only files — already enforced by `import "server-only"` |
| V5 Input Validation | yes (filter inputs) | Date/email filter params on usage page — existing pattern uses `.trim()` and `.gte()`/`.lte()` safely |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns for Admin Pages

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Admin page accessible to non-admin users | Elevation of privilege | `requireRole("admin")` in layout — double-enforced by Clerk middleware |
| Service-role key exposed to client | Information disclosure | `import "server-only"` on `admin.ts` — build error if imported client-side |
| Unvalidated date filter params causing injection | Tampering | Supabase client uses parameterized queries — `.gte(column, value)` is safe |
| IDOR via direct URL to /admin/failures without admin role | Spoofing | Admin layout guard covers all `/admin/*` routes |

---

## Project Constraints (from CLAUDE.md)

The following CLAUDE.md directives directly constrain Phase 6 implementation:

1. **No AI calls for deterministic reads** (Section 4 & 9): Admin analytics are read-only DB queries with TypeScript aggregation. Zero AI calls.
2. **API keys never in frontend** (Section 16): `createAdminClient()` uses `SUPABASE_SERVICE_ROLE_KEY` — `server-only` enforced.
3. **Supabase RLS required** (Section 16): Admin bypasses RLS via service-role (correct pattern) — user-facing paths still respect RLS.
4. **TypeScript strict** (Section 20): No `any`. All row types must be explicitly declared (follow existing `UsageRow`, `StageRunRow` etc. patterns).
5. **AI usage logged to `ai_usage`** (Section 9): Not applicable here — Phase 6 has no AI calls. But the usage page displays this log.
6. **UI must follow design tokens** (Section 14): Use `bg-surface-container-low`, `border-outline-variant`, `text-on-surface`, `text-on-surface-variant` etc. — no hardcoded colors.
7. **MVP scope only** (Section 18 & 21): No template editing, no scoring rule editor — those are Phase 5+. Phase 6 delivers read-only views backed by real code exports.

---

## Sources

### Primary (HIGH confidence)
- `src/app/(admin)/admin/usage/page.tsx` — existing query pattern, type declarations, UI structure
- `src/app/(admin)/admin/jobs/[id]/page.tsx` — StatCard, StatusBadge, TelemetryTable patterns; pipeline_stage_runs query
- `src/app/(admin)/admin/templates/page.tsx` — current static implementation to be replaced
- `src/lib/intelligence/templates.ts` — CATEGORY_SIGNAL_MAP, DEFAULT_SIGNALS, TEMPLATE_VERSION, getIndustryExpectation export
- `src/lib/intelligence/scoring.ts` — FORMULA_VERSION, scoreOpportunity weight constants (inline, not exported)
- `src/lib/intelligence/types.ts` — IndustryExpectation, ScoreResult, GapAnalysisResult types
- `src/lib/supabase/admin.ts` — createAdminClient() implementation
- `src/components/admin/AdminSidebar.tsx` — NAV array, navigation pattern
- `src/app/(admin)/admin/page.tsx` — TILES overview array
- `src/app/(admin)/layout.tsx` — requireRole guard pattern
- `supabase/migrations/20260525014500_pipeline_audit_model.sql` — pipeline_stage_runs full schema
- `supabase/migrations/20260522094203_ai_usage.sql` — ai_usage full schema, indexes
- `supabase/migrations/20260522094202_scan_jobs.sql` — scan_jobs schema
- `package.json` — installed packages, available scripts

### Secondary (MEDIUM confidence)
- `CLAUDE.md` — architectural constraints, design token names, tech stack
- `.planning/REQUIREMENTS.md` — ADM-01, ADM-02, ADM-03 requirement text
- `.planning/STATE.md` — current phase status, decisions log

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages already installed and in use
- Architecture: HIGH — all patterns directly verified from existing admin pages
- Pitfalls: HIGH — identified from direct code inspection and existing pattern analysis
- Template/scoring internals: HIGH — files read directly

**Research date:** 2026-05-26
**Valid until:** Stable indefinitely (no external dependencies; all based on local codebase)
