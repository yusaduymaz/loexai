import { notFound } from "next/navigation";

import {
  JobPipelineView,
  type JobSummary,
} from "@/components/discovery/JobPipelineView";
import type { ScanItem, StageRun } from "@/components/discovery/BusinessItemRow";
import { isPipelineStageKey } from "@/components/discovery/pipeline-stages";
import type {
  ScanItemStatus,
  ScanJobStatus,
  StageStatus,
} from "@/components/discovery/status";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

type Props = { params: { jobId: string } };

export default async function DiscoveryJobPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  const { data: job, error: jobError } = await supabase
    .from("scan_jobs")
    .select(
      "id, location, category, radius_m, status, found_count, analyzed_count, error_count, created_at, started_at, completed_at, error_message",
    )
    .eq("id", params.jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (jobError || !job) notFound();

  const { data: itemsRaw } = await supabase
    .from("scan_job_items")
    .select(
      "id, business_id, status, discovery_rank, error_message, business:businesses(id, name, category, city, website)",
    )
    .eq("scan_job_id", params.jobId)
    .order("discovery_rank", { ascending: true, nullsFirst: false });

  const items: ScanItem[] = (itemsRaw ?? []).map((row) => {
    const businessRel = (row as { business?: unknown }).business;
    const business = normalizeBusiness(businessRel);
    return {
      id: row.id,
      business_id: row.business_id,
      status: row.status as ScanItemStatus,
      discovery_rank: row.discovery_rank,
      error_message: row.error_message,
      business,
    };
  });

  const businessIds = items
    .map((i) => i.business_id)
    .filter((id): id is string => id !== null);

  let stageRuns: StageRun[] = [];
  if (businessIds.length > 0) {
    const { data: runs } = await supabase
      .from("pipeline_stage_runs")
      .select(
        "id, business_id, stage, status, attempt_number, error_message, started_at, completed_at, output_summary",
      )
      .in("business_id", businessIds)
      .order("attempt_number", { ascending: true });

    stageRuns = (runs ?? [])
      .filter((r) => isPipelineStageKey(r.stage))
      .map((r) => ({
        id: r.id,
        business_id: r.business_id,
        stage: r.stage as StageRun["stage"],
        status: r.status as StageStatus,
        attempt_number: r.attempt_number,
        error_message: r.error_message,
        started_at: r.started_at,
        completed_at: r.completed_at,
        output_summary:
          r.output_summary && typeof r.output_summary === "object"
            ? (r.output_summary as Record<string, unknown>)
            : null,
      }));
  }

  const summary: JobSummary = {
    id: job.id,
    location: job.location,
    category: job.category,
    radius_m: job.radius_m,
    status: job.status as ScanJobStatus,
    found_count: job.found_count,
    analyzed_count: job.analyzed_count,
    error_count: job.error_count,
    created_at: job.created_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
    error_message: job.error_message,
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-stack-lg">
      <JobPipelineView
        initialJob={summary}
        initialItems={items}
        initialStageRuns={stageRuns}
      />
    </div>
  );
}

function normalizeBusiness(rel: unknown): ScanItem["business"] {
  if (!rel) return null;
  const row = Array.isArray(rel) ? rel[0] : rel;
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  if (typeof r.id !== "string") return null;
  return {
    id: r.id,
    name: String(r.name ?? "Unknown business"),
    category: (r.category as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    website: (r.website as string | null) ?? null,
  };
}
