---
phase: 06-admin-ops-completion
plan: 6B
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/(admin)/admin/failures/page.tsx
  - src/components/admin/AdminSidebar.tsx
  - src/app/(admin)/admin/page.tsx
autonomous: true
requirements:
  - ADM-02
must_haves:
  truths:
    - "/admin/failures page exists and renders failed pipeline_stage_runs"
    - "Failures page shows summary stats: total failures, distinct stages affected, distinct providers affected"
    - "Failures page shows failure count by stage table (stage, count) sorted descending"
    - "Failures page shows failure count by provider/model table (provider, model, count) sorted descending"
    - "Failures page shows recent 50 failures list with columns: date, stage, business_id, provider, model, error_code, error_message"
    - "Admin sidebar shows a Failures nav link between Scan Jobs and Templates"
    - "Admin overview page /admin has a Failures tile linking to /admin/failures"
  artifacts:
    - path: "src/app/(admin)/admin/failures/page.tsx"
      provides: "Provider failure monitoring page"
      contains: "pipeline_stage_runs.*status.*failed|status.*failed.*pipeline_stage_runs"
    - path: "src/components/admin/AdminSidebar.tsx"
      provides: "Updated NAV array with Failures entry"
      contains: "/admin/failures"
    - path: "src/app/(admin)/admin/page.tsx"
      provides: "Updated TILES array with Failures tile"
      contains: "/admin/failures"
  key_links:
    - from: "src/app/(admin)/admin/failures/page.tsx"
      to: "pipeline_stage_runs table"
      via: "createAdminClient().from('pipeline_stage_runs').eq('status','failed').limit(200)"
      pattern: "status.*failed"
    - from: "AdminSidebar NAV"
      to: "/admin/failures"
      via: "href: '/admin/failures'"
      pattern: "/admin/failures"
---

<objective>
Create /admin/failures — a new provider failure monitoring page — and register it in the admin sidebar and overview.

Purpose: Admin needs to identify which pipeline stages and providers are failing in production without manually querying the database.

Output: New page file, two existing files updated (sidebar nav + overview tiles). No new packages.
</objective>

<execution_context>
@C:/Users/duyma/Desktop/loex/.planning/phases/06-admin-ops-completion/06-RESEARCH.md
</execution_context>

<context>
@C:/Users/duyma/Desktop/loex/.planning/ROADMAP.md
@C:/Users/duyma/Desktop/loex/.planning/STATE.md

<interfaces>
<!-- From supabase/migrations/20260525014500_pipeline_audit_model.sql -->
<!-- pipeline_stage_runs columns available for query: -->
<!--   id, scan_job_id, scan_job_item_id, business_id, stage, status, -->
<!--   attempt_number, provider, model, idempotency_key, input_hash, -->
<!--   output_ref, output_summary, error_code, error_message, metadata, -->
<!--   started_at, completed_at, created_at, updated_at -->
<!-- stage CHECK constraint values: -->
<!--   'discovery' | 'enrichment' | 'gap_analysis' | 'scoring' | -->
<!--   'solution_recommendation' | 'sales_strategy' | 'build_prompt' | 'qa' -->
<!-- status CHECK constraint values: -->
<!--   'queued' | 'running' | 'succeeded' | 'failed' | 'skipped' -->

<!-- From src/lib/supabase/admin.ts -->
import { createAdminClient } from "@/lib/supabase/admin";

<!-- From src/components/admin/AdminSidebar.tsx — NAV array pattern: -->
const NAV: Array<{ href: string; icon: LucideIcon; label: string }> = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/usage", icon: FileBarChart, label: "AI Usage" },
  { href: "/admin/jobs", icon: Briefcase, label: "Scan Jobs" },
  { href: "/admin/templates", icon: ScrollText, label: "Templates" },
];
<!-- Current imports from lucide-react: ArrowLeft, Briefcase, FileBarChart, LayoutDashboard, ScrollText, Users -->

<!-- From src/app/(admin)/admin/page.tsx — TILES array pattern: -->
const TILES: Array<{ href: string; icon: LucideIcon; title: string; body: string }> = [
  { href: "/admin/users", icon: Users, title: "Users", body: "..." },
  { href: "/admin/usage", icon: FileBarChart, title: "AI Usage", body: "..." },
  { href: "/admin/jobs", icon: Briefcase, title: "Scan Jobs", body: "..." },
  { href: "/admin/templates", icon: ScrollText, title: "Templates", body: "..." },
  { href: "/admin/health", icon: Activity, title: "Health", body: "..." },
];
<!-- Current imports from lucide-react: Activity, Briefcase, FileBarChart, ScrollText, Users -->

<!-- From src/app/(admin)/admin/jobs/[id]/page.tsx — StatCard pattern: -->
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 text-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
}
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create /admin/failures page</name>
  <files>src/app/(admin)/admin/failures/page.tsx</files>

  <read_first>
    - src/app/(admin)/admin/jobs/page.tsx — full file for table structure and design token pattern
    - src/app/(admin)/admin/jobs/[id]/page.tsx — lines 1-130 for StatCard component pattern
    - supabase/migrations/20260525014500_pipeline_audit_model.sql — lines 122-145 to confirm pipeline_stage_runs column names
  </read_first>

  <action>
    Create a new file at src/app/(admin)/admin/failures/page.tsx.

    1. File-level declarations:
    - `import "server-only"` is NOT needed here (page.tsx is a Server Component by default in App Router — it already runs server-only)
    - Import: `import { createAdminClient } from "@/lib/supabase/admin";`
    - Export: `export const dynamic = "force-dynamic";`

    2. Define a `StageRunRow` type:
    ```
    type StageRunRow = {
      id: string;
      created_at: string;
      business_id: string;
      stage: string;
      status: string;
      attempt_number: number;
      provider: string | null;
      model: string | null;
      error_code: string | null;
      error_message: string | null;
    };
    ```

    3. Define aggregate types:
    - `FailureByStage`: `{ stage: string; count: number }`
    - `FailureByProvider`: `{ provider: string; model: string; count: number }`

    4. In the async page function, fetch failed runs:
    ```
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pipeline_stage_runs")
      .select("id, created_at, business_id, stage, status, attempt_number, provider, model, error_code, error_message")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(200);
    const failedRuns: StageRunRow[] = error || !data ? [] : (data as unknown as StageRunRow[]);
    ```

    5. Compute aggregates:
    - `totalFailures = failedRuns.length`
    - `distinctStages = new Set(failedRuns.map(r => r.stage)).size`
    - `distinctProviders = new Set(failedRuns.map(r => r.provider ?? "unknown")).size`
    - `failuresByStage: FailureByStage[]` — group using `Map<string, number>` over `failedRuns`, sort descending by count
    - `failuresByProvider: FailureByProvider[]` — group by key `${r.provider ?? "unknown"}::${r.model ?? "unknown"}`, accumulate count, sort descending by count; split key back to `provider` and `model` fields

    6. JSX structure:
    - Page header: `<h1>Provider Failures</h1>` + subtitle "Failed pipeline_stage_runs. Phase 3+."
    - Stats cards section (3-col grid on md+): Total Failures, Distinct Stages Affected, Distinct Providers Affected
    - Local `StatCard` function (same pattern as jobs/[id]/page.tsx)
    - Failure count by stage table:
      - Columns: Stage, Failure Count — sorted descending by count
      - Empty state: "No failures recorded yet."
    - Failure count by provider/model table:
      - Columns: Provider, Model, Failure Count — sorted descending by count
      - Empty state: "No failures recorded yet."
    - Recent failures table (limit display to first 50 from `failedRuns.slice(0, 50)`):
      - Columns: Date, Stage, Business ID, Provider, Model, Error Code, Error Message
      - Date format: `new Date(r.created_at).toISOString().slice(0, 19).replace("T", " ")`
      - business_id: render as truncated UUID `r.business_id.slice(0, 8) + "..."` (no link needed in MVP)
      - All nullable fields use `?? "—"` fallback
      - Empty state: "No failures recorded yet."

    All design tokens: `bg-surface-container-low`, `border-outline-variant`, `text-on-surface`, `text-on-surface-variant`, `text-on-background`, `px-stack-md`, `py-3`, `gap-gutter`, `gap-stack-lg`.
    No hardcoded hex colors.
  </action>

  <verify>
    <automated>cd /c/Users/duyma/Desktop/loex && npm run typecheck 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - File exists at src/app/(admin)/admin/failures/page.tsx
    - File contains `export const dynamic = "force-dynamic"`
    - File contains `.eq("status", "failed")` in the Supabase query
    - File contains `.limit(200)` on the pipeline_stage_runs fetch
    - `StageRunRow` type is declared with all fields using explicit types (no `any`)
    - `FailureByStage` and `FailureByProvider` aggregate types are declared
    - `failuresByStage` and `failuresByProvider` are sorted descending by count
    - Three `StatCard` instances for Total Failures, Distinct Stages, Distinct Providers
    - Recent failures list uses `.slice(0, 50)` to display at most 50 rows
    - All nullable fields have `?? "—"` fallback
    - `npm run typecheck` exits 0
  </acceptance_criteria>

  <done>New /admin/failures page renders correctly with all three sections and passes typecheck.</done>
</task>

<task type="auto">
  <name>Task 2: Register Failures in sidebar nav and admin overview tiles</name>
  <files>src/components/admin/AdminSidebar.tsx, src/app/(admin)/admin/page.tsx</files>

  <read_first>
    - src/components/admin/AdminSidebar.tsx — full file (current NAV array and lucide-react imports)
    - src/app/(admin)/admin/page.tsx — full file (current TILES array and lucide-react imports)
  </read_first>

  <action>
    Edit src/components/admin/AdminSidebar.tsx:

    1. Add `AlertTriangle` to the lucide-react import (alongside existing imports ArrowLeft, Briefcase, FileBarChart, LayoutDashboard, ScrollText, Users). `AlertTriangle` is the icon for the Failures nav entry.

    2. Insert the Failures entry in the `NAV` array between Scan Jobs and Templates:
    ```
    { href: "/admin/failures", icon: AlertTriangle, label: "Failures" },
    ```
    Final NAV order: Overview, Users, AI Usage, Scan Jobs, **Failures**, Templates.

    ---

    Edit src/app/(admin)/admin/page.tsx:

    1. Add `AlertTriangle` to the lucide-react import (alongside existing Activity, Briefcase, FileBarChart, ScrollText, Users).

    2. Insert the Failures tile in the `TILES` array between Scan Jobs and Templates:
    ```
    {
      href: "/admin/failures",
      icon: AlertTriangle,
      title: "Failures",
      body: "Failed pipeline stage runs by stage and provider.",
    },
    ```
    Final TILES order: Users, AI Usage, Scan Jobs, **Failures**, Templates, Health.

    No other changes to either file.
  </action>

  <verify>
    <automated>cd /c/Users/duyma/Desktop/loex && npm run build 2>&1 | tail -30</automated>
  </verify>

  <acceptance_criteria>
    - src/components/admin/AdminSidebar.tsx imports `AlertTriangle` from lucide-react
    - AdminSidebar.tsx NAV array contains `{ href: "/admin/failures", icon: AlertTriangle, label: "Failures" }` between the Scan Jobs and Templates entries
    - src/app/(admin)/admin/page.tsx imports `AlertTriangle` from lucide-react
    - admin/page.tsx TILES array contains `{ href: "/admin/failures", ... }` entry
    - `npm run build` exits 0 with no TypeScript errors
  </acceptance_criteria>

  <done>
    /admin/failures is reachable via sidebar nav and admin overview tile. Both files updated atomically. Build passes.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → /admin/failures | New admin-only page — covered by requireRole("admin") in AdminLayout for all /admin/* routes |
| createAdminClient() → pipeline_stage_runs | Service-role bypasses RLS to read all users' failures — correct admin pattern |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-6B-01 | Elevation of privilege | /admin/failures | accept | requireRole("admin") in AdminLayout already covers all /admin/* — no extra guard needed in page |
| T-6B-02 | Information disclosure | pipeline_stage_runs error_message column | accept | Page only accessible to admin role; error messages may contain business names but no PII — acceptable for internal admin tooling |
| T-6B-03 | Information disclosure | createAdminClient() | accept | import "server-only" on admin.ts prevents client-side access; build error if violated |
| T-6B-04 | Spoofing | IDOR via direct URL /admin/failures | accept | AdminLayout requireRole("admin") gate prevents non-admin access; no user-specific data path here |
</threat_model>

<verification>
After completing both tasks:
1. `npm run typecheck` exits 0
2. `npm run build` exits 0
3. Visit /admin — Failures tile appears between Scan Jobs and Templates
4. Click Failures tile — navigates to /admin/failures
5. Admin sidebar shows Failures link between Scan Jobs and Templates
6. /admin/failures renders with 3 stat cards and 3 tables (by stage, by provider, recent list)
7. When pipeline_stage_runs has no failed rows: all tables show "No failures recorded yet."
</verification>

<success_criteria>
1. src/app/(admin)/admin/failures/page.tsx exists with force-dynamic, createAdminClient(), .eq("status","failed") query, .limit(200), StageRunRow type, three aggregate sections
2. AdminSidebar.tsx NAV includes /admin/failures with AlertTriangle icon between Scan Jobs and Templates
3. admin/page.tsx TILES includes /admin/failures entry
4. `npm run build` passes cleanly
</success_criteria>

<output>
After completion, create `.planning/phases/06-admin-ops-completion/06-6B-SUMMARY.md` summarizing the new page, sidebar entry, and overview tile.
</output>
