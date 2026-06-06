---
phase: 06-admin-ops-completion
plan: 6C
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/intelligence/templates.ts
  - src/lib/intelligence/scoring.ts
  - src/app/(admin)/admin/templates/page.tsx
autonomous: true
requirements:
  - ADM-03
must_haves:
  truths:
    - "/admin/templates header shows TEMPLATE_VERSION string sourced from templates.ts"
    - "/admin/templates shows all 10 categories from CATEGORY_SIGNAL_MAP with their expected signals"
    - "/admin/templates shows DEFAULT_SIGNALS entry for unmatched categories"
    - "/admin/templates shows a scoring formula section with FORMULA_VERSION and all five score components and their weight formulas"
    - "CATEGORY_SIGNAL_MAP, DEFAULT_SIGNALS, and TEMPLATE_VERSION are exported from templates.ts"
    - "FORMULA_VERSION and SCORE_WEIGHTS are exported from scoring.ts"
    - "The old static TEMPLATES constant is removed from the admin page"
  artifacts:
    - path: "src/lib/intelligence/templates.ts"
      provides: "Exported CATEGORY_SIGNAL_MAP, DEFAULT_SIGNALS, TEMPLATE_VERSION"
      contains: "export.*CATEGORY_SIGNAL_MAP|export.*DEFAULT_SIGNALS|export.*TEMPLATE_VERSION"
    - path: "src/lib/intelligence/scoring.ts"
      provides: "Exported FORMULA_VERSION and SCORE_WEIGHTS"
      contains: "export.*FORMULA_VERSION|export.*SCORE_WEIGHTS"
    - path: "src/app/(admin)/admin/templates/page.tsx"
      provides: "Live admin template viewer backed by real code exports"
      contains: "CATEGORY_SIGNAL_MAP|SCORE_WEIGHTS"
  key_links:
    - from: "src/app/(admin)/admin/templates/page.tsx"
      to: "src/lib/intelligence/templates.ts"
      via: "import { CATEGORY_SIGNAL_MAP, DEFAULT_SIGNALS, TEMPLATE_VERSION } from '@/lib/intelligence/templates'"
      pattern: "from.*lib/intelligence/templates"
    - from: "src/app/(admin)/admin/templates/page.tsx"
      to: "src/lib/intelligence/scoring.ts"
      via: "import { FORMULA_VERSION, SCORE_WEIGHTS } from '@/lib/intelligence/scoring'"
      pattern: "from.*lib/intelligence/scoring"
---

<objective>
Upgrade /admin/templates from a static hardcoded list to a live viewer backed by real exports from lib/intelligence/templates.ts and lib/intelligence/scoring.ts.

Purpose: When gap templates or scoring weights change in code, the admin view automatically reflects the deployed state — no manual sync needed.

Output: Two lib files get new named exports, one admin page is rewritten to import and render them. No new packages.
</objective>

<execution_context>
@C:/Users/duyma/Desktop/loex/.planning/phases/06-admin-ops-completion/06-RESEARCH.md
</execution_context>

<context>
@C:/Users/duyma/Desktop/loex/.planning/ROADMAP.md
@C:/Users/duyma\Desktop\loex\.planning\STATE.md

<interfaces>
<!-- From src/lib/intelligence/templates.ts (current full content) -->
import "server-only";
import type { IndustryExpectation } from "@/lib/intelligence/types";

const TEMPLATE_VERSION = "industry-template-v1";   // NOT currently exported

const DEFAULT_SIGNALS: IndustryExpectation["expectedSignals"] = [
  "website", "mobile", "contact", "social",
];                                                   // NOT currently exported

const CATEGORY_SIGNAL_MAP: Record<string, IndustryExpectation["expectedSignals"]> = {
  restaurant: ["website", "mobile", "contact", "booking", "whatsapp", "social"],
  restaurants: ["website", "mobile", "contact", "booking", "whatsapp", "social"],
  cafe: ["website", "mobile", "contact", "social"],
  dentist: ["website", "mobile", "contact", "booking"],
  dentists: ["website", "mobile", "contact", "booking"],
  gym: ["website", "mobile", "contact", "booking", "social"],
  gyms: ["website", "mobile", "contact", "booking", "social"],
  salon: ["website", "mobile", "contact", "booking", "social"],
  spa: ["website", "mobile", "contact", "booking", "social"],
  clinic: ["website", "mobile", "contact", "booking"],
};                                                   // NOT currently exported

export function getIndustryExpectation(category: string | null): IndustryExpectation { ... }

<!-- From src/lib/intelligence/scoring.ts (current relevant section) -->
import "server-only";
const FORMULA_VERSION = "opportunity-score-v1";     // NOT currently exported

// Inline weight formulas in scoreOpportunity():
// reviewSignal  = Math.min(20, Math.round(review_count / 10))          → max 20
// ratingSignal  = Math.max(0, Math.round((5 - rating) * 6))            → max 30
// gapSignal     = Math.min(45, Math.round(severityScore * 0.45))       → max 45
// reachabilitySignal = probe.status !== 'ok' ? 12 : 0                  → max 12
// contactSignal = (!hasContact && !phone) ? 10 : 0                     → max 10
// Total max = 20 + 30 + 45 + 12 + 10 = 117 (clamped to 0-100 by clamp())

<!-- From src/lib/intelligence/types.ts -->
export type IndustryExpectation = {
  templateVersion: string;
  category: string;
  expectedSignals: Array<"website" | "mobile" | "contact" | "booking" | "whatsapp" | "social">;
};

<!-- From src/app/(admin)/admin/templates/page.tsx (current — static list to be replaced) -->
// Contains local TEMPLATES constant with 3 static entries (Klinik, Kafe/Restoran, Güzellik Salonu)
// export default function AdminTemplatesPage() — sync, non-async

<!-- Server-only import constraint (RESEARCH.md §Pitfall 2):
     Import templates.ts and scoring.ts ONLY in the page.tsx Server Component.
     AdminSidebar is "use client" — NEVER pass these imports through it. -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Export constants from templates.ts and scoring.ts</name>
  <files>src/lib/intelligence/templates.ts, src/lib/intelligence/scoring.ts</files>

  <read_first>
    - src/lib/intelligence/templates.ts — full file (40 lines — read once and extract everything needed)
    - src/lib/intelligence/scoring.ts — full file (74 lines — read once and extract everything needed)
  </read_first>

  <action>
    Edit src/lib/intelligence/templates.ts:

    Change the three `const` declarations to `export const`:
    - `const TEMPLATE_VERSION` → `export const TEMPLATE_VERSION`
    - `const DEFAULT_SIGNALS` → `export const DEFAULT_SIGNALS`
    - `const CATEGORY_SIGNAL_MAP` → `export const CATEGORY_SIGNAL_MAP`

    The `getIndustryExpectation` function already uses these constants by name — no other changes needed. The `import "server-only"` on line 1 stays exactly as-is.

    ---

    Edit src/lib/intelligence/scoring.ts:

    1. Change `const FORMULA_VERSION` → `export const FORMULA_VERSION` (line 6).

    2. Add a new exported constant `SCORE_WEIGHTS` AFTER the `FORMULA_VERSION` line and BEFORE the `scoreOpportunity` function. This object documents the weight formula for admin display — it must match the inline arithmetic exactly:

    ```typescript
    export const SCORE_WEIGHTS = {
      reviewSignal: { formula: "min(20, round(review_count / 10))", max: 20 },
      ratingSignal: { formula: "max(0, round((5 - rating) * 6))", max: 30 },
      gapSignal: { formula: "min(45, round(severityScore * 0.45))", max: 45 },
      reachabilitySignal: { formula: "probe.status !== 'ok' ? 12 : 0", max: 12 },
      contactSignal: { formula: "!hasContact && !phone ? 10 : 0", max: 10 },
    } as const;
    ```

    The type of `SCORE_WEIGHTS` is inferred from `as const` — no explicit type annotation needed. No other lines in scoring.ts change.

    Verify after each file edit: `npm run typecheck` must exit 0. The `scoreOpportunity` function itself is unchanged — these are additive-only changes.
  </action>

  <verify>
    <automated>cd /c/Users/duyma/Desktop/loex && npm run typecheck 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - src/lib/intelligence/templates.ts contains `export const TEMPLATE_VERSION`
    - src/lib/intelligence/templates.ts contains `export const DEFAULT_SIGNALS`
    - src/lib/intelligence/templates.ts contains `export const CATEGORY_SIGNAL_MAP`
    - src/lib/intelligence/scoring.ts contains `export const FORMULA_VERSION`
    - src/lib/intelligence/scoring.ts contains `export const SCORE_WEIGHTS`
    - SCORE_WEIGHTS has exactly five keys: reviewSignal, ratingSignal, gapSignal, reachabilitySignal, contactSignal
    - Each SCORE_WEIGHTS entry has `formula` (string) and `max` (number) fields
    - `import "server-only"` remains the first line in both files
    - `getIndustryExpectation` and `scoreOpportunity` function bodies are unchanged
    - `npm run typecheck` exits 0
  </acceptance_criteria>

  <done>templates.ts exports TEMPLATE_VERSION, DEFAULT_SIGNALS, CATEGORY_SIGNAL_MAP. scoring.ts exports FORMULA_VERSION and SCORE_WEIGHTS. Typecheck passes.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite /admin/templates page to render live exports</name>
  <files>src/app/(admin)/admin/templates/page.tsx</files>

  <read_first>
    - src/app/(admin)/admin/templates/page.tsx — full file (current static implementation — 92 lines)
    - src/lib/intelligence/templates.ts — after Task 1 edits, confirm exported names
    - src/lib/intelligence/scoring.ts — after Task 1 edits, confirm SCORE_WEIGHTS structure
  </read_first>

  <action>
    Completely replace the contents of src/app/(admin)/admin/templates/page.tsx.

    The new file must NOT contain the old static `TEMPLATES` constant.

    New file structure:

    1. Imports:
    ```typescript
    import {
      CATEGORY_SIGNAL_MAP,
      DEFAULT_SIGNALS,
      TEMPLATE_VERSION,
    } from "@/lib/intelligence/templates";
    import { FORMULA_VERSION, SCORE_WEIGHTS } from "@/lib/intelligence/scoring";
    ```
    No `export const dynamic = "force-dynamic"` needed — this page has no DB reads, so static rendering is fine. Do NOT add it.

    2. Page function signature: `export default function AdminTemplatesPage()` — sync function (no async, no DB queries).

    3. JSX structure:

    Section A — Page header:
    - h1: "Industry Templates"
    - paragraph: "Live view from lib/intelligence/templates.ts · version: {TEMPLATE_VERSION}"
    - sub-paragraph: "Gap detection signals expected per category. Read-only. Edit lib/intelligence/templates.ts to update."

    Section B — Category signal cards (grid, 1 col / 2 col md / 3 col xl):
    - Iterate `Object.entries(CATEGORY_SIGNAL_MAP)` — each entry is `[category, signals]`
    - For each category, render an `<article>` card (same styling as the old static cards: `rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg`)
    - Card header: `<h2>` with category name (capitalize first letter: `category.charAt(0).toUpperCase() + category.slice(1)`)
    - Signal list: `<ul>` rendering each signal as `<li>` with a bullet dot (same pattern as old static page: `<span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />`)

    Section C — Default signals card (below the grid):
    - Single card: title "Default (unmatched categories)", signals list from `DEFAULT_SIGNALS`

    Section D — Scoring formula section:
    - Section heading: "Scoring Formula" + sub-text "Formula version: {FORMULA_VERSION}"
    - Scoring formula table showing all five components from `SCORE_WEIGHTS`:
      - Columns: Component, Formula, Max Points
      - Rows: one per key in SCORE_WEIGHTS (reviewSignal, ratingSignal, gapSignal, reachabilitySignal, contactSignal)
      - Display component name formatted: replace camelCase with spaces (e.g., "reviewSignal" → "Review Signal") using `.replace(/([A-Z])/g, ' $1').trim()` and `.charAt(0).toUpperCase() + ...slice(1)`
      - Formula column: monospace text (`font-mono text-sm`)
      - Max column: right-aligned, monospace

    All design tokens as per rest of admin: `bg-surface-container-low`, `border-outline-variant`, `text-on-surface`, `text-on-surface-variant`, `text-on-background`, standard padding/gap classes.
    No hardcoded hex colors.

    IMPORTANT — avoid server-only pitfall: these imports go directly in the page file. Do NOT pass the imported objects to any component that is `"use client"`. All rendering is done inline in this Server Component page.
  </action>

  <verify>
    <automated>cd /c/Users/duyma/Desktop/loex && npm run build 2>&1 | tail -30</automated>
  </verify>

  <acceptance_criteria>
    - Old `const TEMPLATES` static array is gone from the file
    - File imports `CATEGORY_SIGNAL_MAP`, `DEFAULT_SIGNALS`, `TEMPLATE_VERSION` from "@/lib/intelligence/templates"
    - File imports `FORMULA_VERSION`, `SCORE_WEIGHTS` from "@/lib/intelligence/scoring"
    - `Object.entries(CATEGORY_SIGNAL_MAP)` is used to render category cards (10 categories total from templates.ts)
    - `DEFAULT_SIGNALS` is rendered in a separate "Default" card
    - TEMPLATE_VERSION string appears in the page header JSX
    - `SCORE_WEIGHTS` is iterated to render the scoring formula table with Component, Formula, Max columns
    - FORMULA_VERSION string appears in the scoring section
    - No `"use client"` directive in the file
    - `npm run build` exits 0 with no TypeScript errors or server-only violations
    - `npm run build` output does NOT contain "server-only" error for this file
  </acceptance_criteria>

  <done>
    /admin/templates shows all 10 CATEGORY_SIGNAL_MAP entries, DEFAULT_SIGNALS, TEMPLATE_VERSION in header, and full SCORE_WEIGHTS formula table with FORMULA_VERSION. Build passes.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Server Component → templates.ts / scoring.ts | server-only modules; import valid only in Server Components — enforced by Next.js build |
| Browser → /admin/templates | Admin-only — requireRole("admin") in AdminLayout covers all /admin/* |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-6C-01 | Information disclosure | templates.ts / scoring.ts imports | accept | Both files declare `import "server-only"` — build fails if imported client-side; export additions do not weaken this guarantee |
| T-6C-02 | Elevation of privilege | /admin/templates | accept | requireRole("admin") in AdminLayout; no change to auth posture |
| T-6C-03 | Tampering | Read-only display page | accept | Page is purely read-only — no mutations, no form submissions, no DB writes |
</threat_model>

<verification>
After completing both tasks:
1. `npm run typecheck` exits 0
2. `npm run build` exits 0 (includes server-only import validation)
3. Visit /admin/templates — page header shows "version: industry-template-v1"
4. Confirm 10 category cards rendered (restaurant, restaurants, cafe, dentist, dentists, gym, gyms, salon, spa, clinic)
5. Confirm Default card shows 4 signals: website, mobile, contact, social
6. Confirm Scoring Formula section shows 5 rows with formula strings and max values summing to 117
</verification>

<success_criteria>
1. templates.ts exports TEMPLATE_VERSION, DEFAULT_SIGNALS, CATEGORY_SIGNAL_MAP — typecheck clean
2. scoring.ts exports FORMULA_VERSION and SCORE_WEIGHTS with 5 entries — typecheck clean
3. /admin/templates page imports both modules and renders: 10 category cards, default signals card, scoring formula table
4. Old static TEMPLATES constant is gone from the page file
5. `npm run build` passes without server-only violations
</success_criteria>

<output>
After completion, create `.planning/phases/06-admin-ops-completion/06-6C-SUMMARY.md` summarizing the exports added and what the upgraded templates page now displays.
</output>
