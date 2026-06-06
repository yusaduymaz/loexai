import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type PageProps = {
  params: {
    id: string;
  };
};

type JobRow = {
  id: string;
  created_at: string;
  user_id: string;
  location: string | null;
  category: string | null;
  radius_m: number | null;
  status: string | null;
  found_count: number | null;
  analyzed_count: number | null;
  error_count: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  users: { email: string } | null;
};

type ItemRow = {
  id: string;
  business_id: string | null;
  provider: string | null;
  provider_place_id: string | null;
  discovery_rank: number | null;
  status: string | null;
  error_message: string | null;
  businesses: { name: string; city: string | null; website: string | null } | null;
};

type StageRunRow = {
  id: string;
  scan_job_item_id: string | null;
  business_id: string | null;
  stage: string;
  status: string;
  attempt_number: number;
  provider: string | null;
  model: string | null;
  error_code: string | null;
  error_message: string | null;
  output_summary: Json | null;
  created_at: string;
};

type UsageRow = {
  id: string;
  created_at: string;
  stage: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
};

export const dynamic = "force-dynamic";

export default async function AdminJobDetailPage({ params }: PageProps) {
  const admin = createAdminClient();

  const { data: job, error: jobError } = await admin
    .from("scan_jobs")
    .select(
      "id, created_at, user_id, location, category, radius_m, status, found_count, analyzed_count, error_count, error_message, started_at, completed_at, users:user_id(email)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (jobError || !job) notFound();

  const [{ data: items }, { data: stages }, { data: usage }] = await Promise.all([
    admin
      .from("scan_job_items")
      .select(
        "id, business_id, provider, provider_place_id, discovery_rank, status, error_message, businesses:business_id(name, city, website)",
      )
      .eq("scan_job_id", params.id)
      .order("discovery_rank", { ascending: true }),
    admin
      .from("pipeline_stage_runs")
      .select(
        "id, scan_job_item_id, business_id, stage, status, attempt_number, provider, model, error_code, error_message, output_summary, created_at",
      )
      .eq("scan_job_id", params.id)
      .order("created_at", { ascending: false }),
    admin
      .from("ai_usage")
      .select("id, created_at, stage, model, input_tokens, output_tokens, cost_usd")
      .eq("scan_job_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  const typedJob = job as unknown as JobRow;
  const itemRows = (items ?? []) as unknown as ItemRow[];
  const stageRows = (stages ?? []) as unknown as StageRunRow[];
  const usageRows = (usage ?? []) as unknown as UsageRow[];
  const totalCost = usageRows.reduce((sum, row) => sum + (row.cost_usd ?? 0), 0);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-lg">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/admin/jobs" className="text-sm font-medium text-primary hover:underline">
            Back to scan jobs
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-on-background">Scan Job Detail</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {typedJob.category ?? "Unknown category"} in {typedJob.location ?? "unknown location"}
          </p>
        </div>
        <StatusBadge status={typedJob.status} />
      </div>

      <section className="grid grid-cols-1 gap-gutter md:grid-cols-4">
        <StatCard label="Found" value={String(typedJob.found_count ?? 0)} />
        <StatCard label="Analyzed" value={String(typedJob.analyzed_count ?? 0)} />
        <StatCard label="Errors" value={String(typedJob.error_count ?? 0)} />
        <StatCard label="AI Cost" value={`$${totalCost.toFixed(4)}`} />
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
        <h2 className="text-base font-semibold text-on-surface">Job metadata</h2>
        <dl className="mt-stack-md grid grid-cols-1 gap-gutter text-sm md:grid-cols-3">
          <Meta label="User" value={typedJob.users?.email ?? typedJob.user_id} />
          <Meta label="Radius" value={`${typedJob.radius_m ?? 0}m`} />
          <Meta label="Created" value={formatDate(typedJob.created_at)} />
          <Meta label="Started" value={formatDate(typedJob.started_at)} />
          <Meta label="Completed" value={formatDate(typedJob.completed_at)} />
          <Meta label="Error" value={typedJob.error_message ?? "none"} />
        </dl>
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container-low">
        <div className="border-b border-outline-variant p-stack-lg">
          <h2 className="text-base font-semibold text-on-surface">Discovered businesses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-container">
              <tr className="border-b border-outline-variant">
                {["Rank", "Business", "Provider", "Status", "Error"].map((h) => (
                  <th key={h} className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {itemRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-stack-md py-stack-xl text-center text-on-surface-variant">
                    No scan items recorded.
                  </td>
                </tr>
              ) : (
                itemRows.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container/50">
                    <td className="px-stack-md py-3 font-mono text-on-surface-variant" data-mono>
                      {item.discovery_rank ?? "-"}
                    </td>
                    <td className="px-stack-md py-3">
                      <div className="font-medium text-on-surface">
                        {item.businesses?.name ?? item.business_id ?? "Unlinked"}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        {[item.businesses?.city, item.businesses?.website].filter(Boolean).join(" · ") || item.provider_place_id || "No source detail"}
                      </div>
                    </td>
                    <td className="px-stack-md py-3 text-on-surface-variant">{item.provider ?? "-"}</td>
                    <td className="px-stack-md py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-stack-md py-3 text-on-surface-variant">{item.error_message ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-gutter xl:grid-cols-2">
        <TelemetryTable title="Pipeline stage runs" empty="No stage runs recorded.">
          {stageRows.map((run) => (
            <tr key={run.id} className="border-b border-outline-variant/50 last:border-b-0">
              <td className="px-stack-md py-3 text-on-surface">{run.stage}</td>
              <td className="px-stack-md py-3"><StatusBadge status={run.status} /></td>
              <td className="px-stack-md py-3 font-mono text-on-surface-variant" data-mono>{run.attempt_number}</td>
              <td className="px-stack-md py-3 text-on-surface-variant">{run.provider ?? run.model ?? "-"}</td>
              <td className="px-stack-md py-3 text-on-surface-variant">{run.error_code ?? run.error_message ?? summarizeJson(run.output_summary)}</td>
            </tr>
          ))}
        </TelemetryTable>

        <TelemetryTable title="AI usage" empty="No AI usage for this job.">
          {usageRows.map((row) => (
            <tr key={row.id} className="border-b border-outline-variant/50 last:border-b-0">
              <td className="px-stack-md py-3 text-on-surface">{row.stage}</td>
              <td className="px-stack-md py-3 text-on-surface-variant">{row.model ?? "-"}</td>
              <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>{row.input_tokens ?? 0}</td>
              <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>{row.output_tokens ?? 0}</td>
              <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>${(row.cost_usd ?? 0).toFixed(4)}</td>
            </tr>
          ))}
        </TelemetryTable>
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-words text-on-surface">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const normalized = status ?? "unknown";
  const variant =
    normalized === "completed" || normalized === "succeeded"
      ? "success"
      : normalized === "failed"
        ? "danger"
        : normalized === "partial" || normalized === "running" || normalized === "queued"
          ? "warning"
          : "neutral";

  return <Badge variant={variant}>{normalized}</Badge>;
}

function TelemetryTable({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const rows = Array.isArray(children) ? children : [children];
  const hasRows = rows.some(Boolean);

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-low">
      <div className="border-b border-outline-variant p-stack-lg">
        <h2 className="text-base font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            {hasRows ? (
              children
            ) : (
              <tr>
                <td className="px-stack-md py-stack-xl text-center text-on-surface-variant">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 19).replace("T", " ") : "none";
}

function summarizeJson(value: Json | null) {
  if (!value) return "-";
  const text = JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}
