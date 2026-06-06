---
phase: 06-admin-ops-completion
plan: 6A
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/(admin)/admin/usage/page.tsx
autonomous: true
requirements:
  - ADM-02
must_haves:
  truths:
    - "/admin/usage shows three aggregate sections above the raw table: summary stats cards, per-user breakdown table, and per-stage breakdown table"
    - "Summary stats cards display all-time totals: Total Cost (USD), Total Tokens, Total Calls — computed over the 500-row fetch window"
    - "Per-user table shows email, call count, total tokens, total cost (USD) sorted descending by cost"
    - "Per-stage table shows stage name, call count, total tokens, total cost (USD) sorted descending by cost"
    - "Existing raw table with date/user filters is preserved below the aggregate sections"
    - "Page renders empty-state gracefully when ai_usage has zero rows"
  artifacts:
    - path: "src/app/(admin)/admin/usage/page.tsx"
      provides: "Upgraded AdminUsagePage with aggregation sections"
      contains: "byUser.*Map|userSummaries|bySta"
  key_links:
    - from: "src/app/(admin)/admin/usage/page.tsx"
      to: "ai_usage table"
      via: "createAdminClient().from('ai_usage').select(...).limit(500)"
      pattern: "limit\\(500\\)"
    - from: "AdminUsagePage"
      to: "byUser Map aggregation"
      via: "for...of loop over rows"
      pattern: "byUser\\.set"
---

<objective>
Upgrade /admin/usage to surface aggregated analytics alongside the existing raw row table.

Purpose: Admin needs at-a-glance visibility into top AI spenders and per-stage cost distribution, not just a raw chronological table.

Output: Single modified page file — AdminUsagePage — with three new sections (summary stats, per-user table, per-stage table) above the existing raw table. No new files. No new packages.
</objective>

<execution_context>
@C:/Users/duyma/Desktop/loex/.planning/phases/06-admin-ops-completion/06-RESEARCH.md
</execution_context>

<context>
@C:/Users/duyma/Desktop/loex/.planning/ROADMAP.md
@C:/Users/duyma/Desktop/loex/.planning/STATE.md

<interfaces>
<!-- From src/app/(admin)/admin/usage/page.tsx (current) -->
<!-- UsageRow type already in file: -->
type UsageRow = {
  id: string;
  created_at: string;
  user_id: string;
  stage: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  users: { email: string } | null;
};
<!-- Current fetch: .limit(200) — raise to 500 -->
<!-- Current raw table column headers: Date, User, Stage, Model, Input tokens, Output tokens, Cost (USD) -->

<!-- From src/app/(admin)/admin/jobs/[id]/page.tsx — StatCard pattern: -->
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 text-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
}

<!-- From src/lib/supabase/admin.ts — import pattern: -->
import { createAdminClient } from "@/lib/supabase/admin";
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Raise fetch limit and add in-process aggregation logic</name>
  <files>src/app/(admin)/admin/usage/page.tsx</files>

  <read_first>
    - src/app/(admin)/admin/usage/page.tsx — full file (current implementation to be extended)
    - src/app/(admin)/admin/jobs/[id]/page.tsx — lines 1-130 for StatCard component pattern and aggregation style
  </read_first>

  <action>
    Modify src/app/(admin)/admin/usage/page.tsx as follows.

    1. Change the unfilitered fetch limit from 200 to 500 on the `.limit(200)` call (line 63). The filtered query (when userIdFilter is set) uses the same query variable, so a single change propagates. Also add a second unfiltered query for aggregate computation that always fetches 500 rows regardless of the user/date filter (aggregates should reflect the full recent window, not the filtered slice). Name this second query result `allRows`.

    Pattern for the aggregate-only fetch (runs in parallel with the filtered fetch using Promise.all or sequential if simpler):
    ```
    const { data: allData } = await admin
      .from("ai_usage")
      .select("user_id, stage, model, input_tokens, output_tokens, cost_usd, users:user_id(email)")
      .order("created_at", { ascending: false })
      .limit(500);
    const allRows: UsageRow[] = allData ? (allData as unknown as UsageRow[]) : [];
    ```

    2. Add three TypeScript aggregate types before the component (after UsageRow):
    - `UserSummary`: `{ userId: string; email: string; totalCostUsd: number; totalTokens: number; callCount: number; }`
    - `StageSummary`: `{ stage: string; totalCostUsd: number; totalTokens: number; callCount: number; }`

    3. Add per-user aggregation over `allRows`:
    - Use a `Map<string, UserSummary>` named `byUser`.
    - Iterate `allRows` with `for...of`.
    - Per row: `email = row.users?.email ?? "—"`, accumulate `totalCostUsd += row.cost_usd ?? 0`, `totalTokens += (row.input_tokens ?? 0) + (row.output_tokens ?? 0)`, `callCount += 1`.
    - Derive `userSummaries` by sorting `[...byUser.values()]` descending by `totalCostUsd`.

    4. Add per-stage aggregation over `allRows`:
    - Use a `Map<string, StageSummary>` named `byStage`.
    - Iterate `allRows` with `for...of`.
    - Per row: accumulate `totalCostUsd`, `totalTokens = input + output`, `callCount`.
    - Derive `stageSummaries` by sorting `[...byStage.values()]` descending by `totalCostUsd`.

    5. Add all-time totals over `allRows`:
    - `allTimeCost: number = allRows.reduce((s, r) => s + (r.cost_usd ?? 0), 0)`
    - `allTimeTokens: number = allRows.reduce((s, r) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0)`
    - `allTimeCalls: number = allRows.length`
  </action>

  <verify>
    <automated>cd /c/Users/duyma/Desktop/loex && npm run typecheck 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - `UserSummary` and `StageSummary` types are defined (not using `any`)
    - `byUser` and `byStage` maps are populated via `for...of` over `allRows`
    - `allTimeCost`, `allTimeTokens`, `allTimeCalls` computed from `allRows`
    - `.limit(200)` no longer appears in the file; `.limit(500)` appears at least once for the unfiltered aggregate fetch
    - `npm run typecheck` exits 0
  </acceptance_criteria>

  <done>Aggregation data is computed server-side and ready to be rendered.</done>
</task>

<task type="auto">
  <name>Task 2: Render three aggregate sections above the existing raw table</name>
  <files>src/app/(admin)/admin/usage/page.tsx</files>

  <read_first>
    - src/app/(admin)/admin/usage/page.tsx — after Task 1 edits are applied (read the current state)
  </read_first>

  <action>
    Add a local `StatCard` function component at the top of the file (before the page component, after type declarations). Pattern exactly from `/admin/jobs/[id]/page.tsx`:

    ```
    function StatCard({ label, value }: { label: string; value: string }) {
      return (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
          <p className="mt-2 text-lg font-semibold text-on-surface">{value}</p>
        </div>
      );
    }
    ```

    In the JSX returned by `AdminUsagePage`, insert the following three sections BETWEEN the page header `<div>` and the filter bar `<form>`:

    Section 1 — Summary stats cards (4-column grid on md+):
    ```
    <section className="grid grid-cols-1 gap-gutter md:grid-cols-3">
      <StatCard label="Total Cost (all-time)" value={`$${allTimeCost.toFixed(4)}`} />
      <StatCard label="Total Tokens" value={allTimeTokens.toLocaleString()} />
      <StatCard label="Total Calls" value={String(allTimeCalls)} />
    </section>
    ```

    Section 2 — Per-user summary table (below stats cards):
    ```
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
      <div className="border-b border-outline-variant px-stack-md py-3">
        <h2 className="text-sm font-semibold text-on-surface">Per-user summary</h2>
        <p className="text-xs text-on-surface-variant">Aggregated over last 500 records</p>
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-surface-container">
          <tr className="border-b border-outline-variant">
            {["User", "Calls", "Total Tokens", "Total Cost (USD)"].map((h) => (
              <th key={h} className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {userSummaries.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-stack-md py-stack-xl text-center text-on-surface-variant">No data yet.</td>
            </tr>
          ) : (
            userSummaries.map((u) => (
              <tr key={u.userId} className="hover:bg-surface-container/50">
                <td className="px-stack-md py-3 text-on-surface">{u.email}</td>
                <td className="px-stack-md py-3 text-right font-mono text-on-surface">{u.callCount}</td>
                <td className="px-stack-md py-3 text-right font-mono text-on-surface">{u.totalTokens.toLocaleString()}</td>
                <td className="px-stack-md py-3 text-right font-mono text-on-surface">${u.totalCostUsd.toFixed(4)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    ```

    Section 3 — Per-stage breakdown table (same structure):
    Columns: Stage, Calls, Total Tokens, Total Cost (USD). Rows from `stageSummaries`. Empty-state text: "No stage data yet."

    Then the existing filter form and raw table follow below as-is, with only the limit change from Task 1.
  </action>

  <verify>
    <automated>cd /c/Users/duyma/Desktop/loex && npm run build 2>&1 | tail -30</automated>
  </verify>

  <acceptance_criteria>
    - File contains a `StatCard` function component defined locally
    - File contains three `<section>` or aggregate `<div>` blocks between the page header and the filter `<form>`
    - `userSummaries.map` renders per-user rows with 4 columns: email, callCount, totalTokens, totalCostUsd
    - `stageSummaries.map` renders per-stage rows with 4 columns: stage, callCount, totalTokens, totalCostUsd
    - Each aggregate table has an empty-state `<td colSpan={4}>` row
    - "Aggregated over last 500 records" annotation appears in the per-user section header
    - `npm run build` exits 0 with no TypeScript errors
    - Existing filter form and raw table are still present in the file
  </acceptance_criteria>

  <done>
    /admin/usage renders three aggregate sections (summary stats, per-user table, per-stage table) above the existing filter bar and raw table. Build passes cleanly.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → /admin/usage | Admin-only page. requireRole("admin") in layout.tsx enforces this for all /admin/* routes |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-6A-01 | Elevation of privilege | /admin/usage page | accept | requireRole("admin") in AdminLayout already enforced; no additional guard needed in page |
| T-6A-02 | Information disclosure | createAdminClient() service-role key | accept | admin.ts has `import "server-only"` — build error if imported client-side; key never in NEXT_PUBLIC_ vars |
| T-6A-03 | Tampering | Date/user filter inputs | accept | Supabase client uses parameterized queries via .gte()/.lte()/.eq() — no raw SQL interpolation |
</threat_model>

<verification>
After completing both tasks:
1. `npm run typecheck` exits 0
2. `npm run build` exits 0
3. Visit /admin/usage in browser and confirm three aggregate sections appear above the filter bar
4. If ai_usage has rows: verify per-user table and per-stage table are populated and sorted by cost descending
5. If ai_usage is empty: verify "No data yet." empty-state renders without errors
</verification>

<success_criteria>
1. /admin/usage page shows three sections above the raw table: summary cards (Total Cost, Total Tokens, Total Calls), per-user breakdown table, per-stage breakdown table
2. Per-user table sorted descending by total cost — email column shows actual email or "—" fallback
3. Per-stage table sorted descending by total cost — stage column shows stage name from ai_usage rows
4. "Aggregated over last 500 records" annotation is visible
5. Existing raw table with date/user/email filters is preserved
6. `npm run build` passes
</success_criteria>

<output>
After completion, create `.planning/phases/06-admin-ops-completion/06-6A-SUMMARY.md` summarizing what was changed in usage/page.tsx and confirming build passes.
</output>
