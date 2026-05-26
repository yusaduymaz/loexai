import { createAdminClient } from "@/lib/supabase/admin";

/**
 * /admin/failures — provider failure monitoring page.
 *
 * Reads failed pipeline_stage_runs and aggregates by stage and provider/model.
 * Active in Phase 3+ when the pipeline begins writing stage run rows.
 */

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

type FailureByStage = { stage: string; count: number };
type FailureByProvider = { provider: string; model: string; count: number };

export const dynamic = "force-dynamic";

export default async function AdminFailuresPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pipeline_stage_runs")
    .select(
      "id, created_at, business_id, stage, status, attempt_number, provider, model, error_code, error_message",
    )
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(200);

  const failedRuns: StageRunRow[] = error || !data ? [] : (data as unknown as StageRunRow[]);

  // Summary stats
  const totalFailures = failedRuns.length;
  const distinctStages = new Set(failedRuns.map((r) => r.stage)).size;
  const distinctProviders = new Set(failedRuns.map((r) => r.provider ?? "unknown")).size;

  // Failures by stage
  const stageMap = new Map<string, number>();
  for (const r of failedRuns) {
    stageMap.set(r.stage, (stageMap.get(r.stage) ?? 0) + 1);
  }
  const failuresByStage: FailureByStage[] = Array.from(stageMap.entries())
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  // Failures by provider/model
  const providerMap = new Map<string, number>();
  for (const r of failedRuns) {
    const key = `${r.provider ?? "unknown"}::${r.model ?? "unknown"}`;
    providerMap.set(key, (providerMap.get(key) ?? 0) + 1);
  }
  const failuresByProvider: FailureByProvider[] = Array.from(providerMap.entries())
    .map(([key, count]) => {
      const [provider, model] = key.split("::");
      return { provider: provider ?? "unknown", model: model ?? "unknown", count };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-lg">
      <div>
        <h1 className="text-2xl font-semibold text-on-background">Provider Failures</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Failed pipeline_stage_runs. Phase 3+.
        </p>
      </div>

      {/* Summary stats */}
      <section className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <StatCard label="Total Failures" value={String(totalFailures)} />
        <StatCard label="Distinct Stages Affected" value={String(distinctStages)} />
        <StatCard label="Distinct Providers Affected" value={String(distinctProviders)} />
      </section>

      {/* Failures by stage */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="text-base font-semibold text-on-surface">Failure Count by Stage</h2>
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-container">
              <tr className="border-b border-outline-variant">
                {["Stage", "Failure Count"].map((h) => (
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
              {failuresByStage.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-stack-md py-stack-xl text-center text-on-surface-variant"
                  >
                    No failures recorded yet.
                  </td>
                </tr>
              ) : (
                failuresByStage.map((row) => (
                  <tr key={row.stage} className="hover:bg-surface-container/50">
                    <td className="px-stack-md py-3 text-on-surface">{row.stage}</td>
                    <td className="px-stack-md py-3 font-mono text-on-surface">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Failures by provider/model */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="text-base font-semibold text-on-surface">Failure Count by Provider/Model</h2>
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-container">
              <tr className="border-b border-outline-variant">
                {["Provider", "Model", "Failure Count"].map((h) => (
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
              {failuresByProvider.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-stack-md py-stack-xl text-center text-on-surface-variant"
                  >
                    No failures recorded yet.
                  </td>
                </tr>
              ) : (
                failuresByProvider.map((row, i) => (
                  <tr key={i} className="hover:bg-surface-container/50">
                    <td className="px-stack-md py-3 text-on-surface">{row.provider}</td>
                    <td className="px-stack-md py-3 text-on-surface-variant">{row.model}</td>
                    <td className="px-stack-md py-3 font-mono text-on-surface">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent failures list */}
      <section className="flex flex-col gap-stack-sm">
        <h2 className="text-base font-semibold text-on-surface">
          Recent Failures{" "}
          <span className="text-xs font-normal text-on-surface-variant">(last 50)</span>
        </h2>
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-container">
              <tr className="border-b border-outline-variant">
                {["Date", "Stage", "Business ID", "Provider", "Model", "Error Code", "Error Message"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {failedRuns.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-stack-md py-stack-xl text-center text-on-surface-variant"
                  >
                    No failures recorded yet.
                  </td>
                </tr>
              ) : (
                failedRuns.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container/50">
                    <td className="px-stack-md py-3 font-mono text-xs text-on-surface-variant">
                      {new Date(r.created_at).toISOString().slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="px-stack-md py-3 text-on-surface">{r.stage}</td>
                    <td className="px-stack-md py-3 font-mono text-xs text-on-surface-variant">
                      {r.business_id.slice(0, 8) + "..."}
                    </td>
                    <td className="px-stack-md py-3 text-on-surface">{r.provider ?? "—"}</td>
                    <td className="px-stack-md py-3 text-on-surface-variant">{r.model ?? "—"}</td>
                    <td className="px-stack-md py-3 text-on-surface">{r.error_code ?? "—"}</td>
                    <td className="px-stack-md py-3 max-w-xs truncate text-on-surface-variant">
                      {r.error_message ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 text-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
}
