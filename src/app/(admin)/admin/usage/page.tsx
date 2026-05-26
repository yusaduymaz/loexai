import { createAdminClient } from "@/lib/supabase/admin";

/**
 * /admin/usage — ADM-02 + FOUND-07 reader.
 *
 * Reads `ai_usage` joined with `users` to surface per-user, per-stage token
 * spend. Phase 1 ships with zero rows (no AI calls yet) — the page must
 * therefore render an empty state without erroring. Phase 3 will start
 * inserting rows from every AI call.
 *
 * Filters: optional `?from=YYYY-MM-DD&to=YYYY-MM-DD&user=<email>` query
 * params, posted via a plain GET form. No JS dependency on the client.
 */
type SearchParams = {
  from?: string;
  to?: string;
  user?: string;
};

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

type UserSummary = {
  userId: string;
  email: string;
  totalCostUsd: number;
  totalTokens: number;
  callCount: number;
};

type StageSummary = {
  stage: string;
  totalCostUsd: number;
  totalTokens: number;
  callCount: number;
};

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 text-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
}

export default async function AdminUsagePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const admin = createAdminClient();
  const params = searchParams ?? {};

  // Resolve user filter — if an email was supplied, translate it to a user_id
  // first (cheaper than a join with email filter when ai_usage gets large).
  let userIdFilter: string | null = null;
  if (params.user && params.user.trim().length > 0) {
    const { data: u } = await admin
      .from("users")
      .select("id")
      .eq("email", params.user.trim())
      .maybeSingle();
    if (u?.id) {
      userIdFilter = u.id;
    } else {
      // No match — return empty result without round-tripping ai_usage.
      userIdFilter = "__no_match__";
    }
  }

  // Aggregate fetch — always fetches 500 rows regardless of filters so that
  // summary stats reflect the full recent window, not the filtered slice.
  const { data: allData } = await admin
    .from("ai_usage")
    .select("id, created_at, user_id, stage, model, input_tokens, output_tokens, cost_usd, users:user_id(email)")
    .order("created_at", { ascending: false })
    .limit(500);
  const allRows: UsageRow[] = allData ? (allData as unknown as UsageRow[]) : [];

  // All-time totals (over the 500-row window)
  const allTimeCost: number = allRows.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
  const allTimeTokens: number = allRows.reduce(
    (s, r) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0),
    0,
  );
  const allTimeCalls: number = allRows.length;

  // Per-user aggregation
  const byUser = new Map<string, UserSummary>();
  for (const row of allRows) {
    const existing = byUser.get(row.user_id);
    const email = row.users?.email ?? "—";
    if (existing) {
      existing.totalCostUsd += row.cost_usd ?? 0;
      existing.totalTokens += (row.input_tokens ?? 0) + (row.output_tokens ?? 0);
      existing.callCount += 1;
    } else {
      byUser.set(row.user_id, {
        userId: row.user_id,
        email,
        totalCostUsd: row.cost_usd ?? 0,
        totalTokens: (row.input_tokens ?? 0) + (row.output_tokens ?? 0),
        callCount: 1,
      });
    }
  }
  const userSummaries: UserSummary[] = [...byUser.values()].sort(
    (a, b) => b.totalCostUsd - a.totalCostUsd,
  );

  // Per-stage aggregation
  const byStage = new Map<string, StageSummary>();
  for (const row of allRows) {
    const existing = byStage.get(row.stage);
    if (existing) {
      existing.totalCostUsd += row.cost_usd ?? 0;
      existing.totalTokens += (row.input_tokens ?? 0) + (row.output_tokens ?? 0);
      existing.callCount += 1;
    } else {
      byStage.set(row.stage, {
        stage: row.stage,
        totalCostUsd: row.cost_usd ?? 0,
        totalTokens: (row.input_tokens ?? 0) + (row.output_tokens ?? 0),
        callCount: 1,
      });
    }
  }
  const stageSummaries: StageSummary[] = [...byStage.values()].sort(
    (a, b) => b.totalCostUsd - a.totalCostUsd,
  );

  // Filtered query for the raw table below
  let query = admin
    .from("ai_usage")
    .select("id, created_at, user_id, stage, model, input_tokens, output_tokens, cost_usd, users:user_id(email)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (params.from) query = query.gte("created_at", params.from);
  if (params.to) query = query.lte("created_at", `${params.to}T23:59:59Z`);
  if (userIdFilter && userIdFilter !== "__no_match__") {
    query = query.eq("user_id", userIdFilter);
  }
  if (userIdFilter === "__no_match__") {
    // force-empty
    query = query.eq("user_id", "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await query;
  const rows: UsageRow[] = error || !data ? [] : (data as unknown as UsageRow[]);

  const totalCostUsd = rows.reduce((acc, r) => acc + (r.cost_usd ?? 0), 0);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-lg">
      <div>
        <h1 className="text-2xl font-semibold text-on-background">AI Usage</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Per-call token spend and cost. Populated by every AI generation in Phase 3+.
        </p>
      </div>

      {/* Section 1 — Summary stats cards */}
      <section className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <StatCard label="Total Cost (all-time)" value={`$${allTimeCost.toFixed(4)}`} />
        <StatCard label="Total Tokens" value={allTimeTokens.toLocaleString()} />
        <StatCard label="Total Calls" value={String(allTimeCalls)} />
      </section>

      {/* Section 2 — Per-user summary table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
        <div className="border-b border-outline-variant px-stack-md py-3">
          <h2 className="text-sm font-semibold text-on-surface">Per-user summary</h2>
          <p className="text-xs text-on-surface-variant">Aggregated over last 500 records</p>
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-container">
            <tr className="border-b border-outline-variant">
              {["User", "Calls", "Total Tokens", "Total Cost (USD)"].map((h) => (
                <th
                  key={h}
                  className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {userSummaries.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-stack-md py-stack-xl text-center text-on-surface-variant"
                >
                  No data yet.
                </td>
              </tr>
            ) : (
              userSummaries.map((u) => (
                <tr key={u.userId} className="hover:bg-surface-container/50">
                  <td className="px-stack-md py-3 text-on-surface">{u.email}</td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface">
                    {u.callCount}
                  </td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface">
                    {u.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface">
                    ${u.totalCostUsd.toFixed(4)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Section 3 — Per-stage breakdown table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
        <div className="border-b border-outline-variant px-stack-md py-3">
          <h2 className="text-sm font-semibold text-on-surface">Per-stage breakdown</h2>
          <p className="text-xs text-on-surface-variant">Aggregated over last 500 records</p>
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-container">
            <tr className="border-b border-outline-variant">
              {["Stage", "Calls", "Total Tokens", "Total Cost (USD)"].map((h) => (
                <th
                  key={h}
                  className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {stageSummaries.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-stack-md py-stack-xl text-center text-on-surface-variant"
                >
                  No stage data yet.
                </td>
              </tr>
            ) : (
              stageSummaries.map((s) => (
                <tr key={s.stage} className="hover:bg-surface-container/50">
                  <td className="px-stack-md py-3 text-on-surface">{s.stage}</td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface">
                    {s.callCount}
                  </td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface">
                    {s.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface">
                    ${s.totalCostUsd.toFixed(4)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Filter bar */}
      <form
        method="get"
        className="grid grid-cols-1 gap-stack-md rounded-xl border border-outline-variant bg-surface-container-low p-stack-md md:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <label className="flex flex-col gap-1 text-xs text-on-surface-variant">
          From
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className="rounded-md border border-outline-variant bg-surface-container px-2 py-1.5 text-sm text-on-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-on-surface-variant">
          To
          <input
            type="date"
            name="to"
            defaultValue={params.to ?? ""}
            className="rounded-md border border-outline-variant bg-surface-container px-2 py-1.5 text-sm text-on-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-on-surface-variant">
          User email
          <input
            type="email"
            name="user"
            defaultValue={params.user ?? ""}
            placeholder="user@example.com"
            className="rounded-md border border-outline-variant bg-surface-container px-2 py-1.5 text-sm text-on-surface"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-md bg-primary-container px-3 py-2 text-sm font-medium text-on-primary-container transition-opacity hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Raw table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-container">
            <tr className="border-b border-outline-variant">
              {[
                "Date",
                "User",
                "Stage",
                "Model",
                "Input tokens",
                "Output tokens",
                "Cost (USD)",
              ].map((h) => (
                <th
                  key={h}
                  className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-stack-md py-stack-xl text-center text-on-surface-variant"
                >
                  No AI usage recorded yet. Logs start flowing in Phase 3 once AI calls are wired.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container/50">
                  <td className="px-stack-md py-3 text-on-surface-variant">
                    {new Date(r.created_at).toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="px-stack-md py-3 text-on-surface">{r.users?.email ?? "—"}</td>
                  <td className="px-stack-md py-3 text-on-surface">{r.stage}</td>
                  <td className="px-stack-md py-3 text-on-surface-variant">{r.model ?? "—"}</td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>
                    {r.input_tokens ?? 0}
                  </td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>
                    {r.output_tokens ?? 0}
                  </td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>
                    ${(r.cost_usd ?? 0).toFixed(4)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-surface-container/50">
            <tr>
              <td
                colSpan={6}
                className="px-stack-md py-3 text-right text-xs uppercase tracking-wider text-on-surface-variant"
              >
                Total cost (filtered)
              </td>
              <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>
                ${totalCostUsd.toFixed(4)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
