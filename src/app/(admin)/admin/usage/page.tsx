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

export const dynamic = "force-dynamic";

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

  let query = admin
    .from("ai_usage")
    .select("id, created_at, user_id, stage, model, input_tokens, output_tokens, cost_usd, users:user_id(email)")
    .order("created_at", { ascending: false })
    .limit(200);

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

      {/* Table */}
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
              <td colSpan={6} className="px-stack-md py-3 text-right text-xs uppercase tracking-wider text-on-surface-variant">
                Total cost
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
