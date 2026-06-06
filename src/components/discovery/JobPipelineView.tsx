"use client";

import { ArrowLeft, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { analyzeScanJob } from "@/app/(dashboard)/dashboard/discovery/actions";
import {
  BusinessItemRow,
  type ScanItem,
  type StageRun,
} from "@/components/discovery/BusinessItemRow";
import {
  PipelineTimeline,
  type StageAggregate,
  type StageAggregateMap,
} from "@/components/discovery/PipelineTimeline";
import { PIPELINE_STAGES, isPipelineStageKey } from "@/components/discovery/pipeline-stages";
import { StatusBadge, type ScanItemStatus, type ScanJobStatus, type StageStatus } from "@/components/discovery/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export type JobSummary = {
  id: string;
  location: string;
  category: string;
  radius_m: number;
  status: ScanJobStatus;
  found_count: number;
  analyzed_count: number;
  error_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
};

export function JobPipelineView({
  initialJob,
  initialItems,
  initialStageRuns,
}: {
  initialJob: JobSummary;
  initialItems: ScanItem[];
  initialStageRuns: StageRun[];
}) {
  const [job, setJob] = useState(initialJob);
  const [items, setItems] = useState(initialItems);
  const [stageRuns, setStageRuns] = useState<StageRun[]>(initialStageRuns);

  useEffect(() => {
    const supabase = createClient();

    const jobChannel = supabase
      .channel(`scan_job:${job.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scan_jobs",
          filter: `id=eq.${job.id}`,
        },
        (payload) => {
          const next = payload.new as Record<string, unknown> | null;
          if (!next) return;
          setJob((prev) => ({
            ...prev,
            status: ((next.status as ScanJobStatus) ?? prev.status) as ScanJobStatus,
            found_count: Number(next.found_count ?? prev.found_count),
            analyzed_count: Number(next.analyzed_count ?? prev.analyzed_count),
            error_count: Number(next.error_count ?? prev.error_count),
            started_at: (next.started_at as string | null) ?? prev.started_at,
            completed_at: (next.completed_at as string | null) ?? prev.completed_at,
            error_message: (next.error_message as string | null) ?? prev.error_message,
          }));
        },
      )
      .subscribe();

    const itemsChannel = supabase
      .channel(`scan_job_items:${job.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scan_job_items",
          filter: `scan_job_id=eq.${job.id}`,
        },
        (payload) => {
          setItems((current) => applyItemChange(current, payload as RealtimePayload));
        },
      )
      .subscribe();

    const stageChannel = supabase
      .channel(`pipeline_stage_runs:${job.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pipeline_stage_runs",
          filter: `scan_job_id=eq.${job.id}`,
        },
        (payload) => {
          setStageRuns((current) => applyStageRunChange(current, payload as RealtimePayload));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(jobChannel);
      void supabase.removeChannel(itemsChannel);
      void supabase.removeChannel(stageChannel);
    };
  }, [job.id]);

  const aggregates = useMemo<StageAggregateMap>(
    () => computeAggregates(items, stageRuns),
    [items, stageRuns],
  );

  const stageRunsByBusiness = useMemo(() => {
    const map = new Map<string, StageRun[]>();
    for (const run of stageRuns) {
      const list = map.get(run.business_id) ?? [];
      list.push(run);
      map.set(run.business_id, list);
    }
    return map;
  }, [stageRuns]);

  const [analyzing, startTransition] = useTransition();
  const hasPendingItems = items.some(
    (i) => i.status === "discovered" || i.status === "queued" || i.status === "failed",
  );

  const runAnalysis = () => {
    startTransition(async () => {
      const result = await analyzeScanJob(job.id);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(
        `Analyzed ${result.analyzed} lead${result.analyzed === 1 ? "" : "s"}` +
          (result.failed > 0 ? ` · ${result.failed} failed` : ""),
      );
    });
  };

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-stack-xs">
          <Link
            href="/dashboard/discovery"
            className="inline-flex w-fit items-center gap-1 text-body-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to discovery
          </Link>
          <h1 className="text-3xl font-semibold text-on-surface">
            {job.category}{" "}
            <span className="text-on-surface-variant">in {job.location}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
            <StatusBadge status={job.status} />
            <span>· {job.radius_m}m radius</span>
            <span>· {job.found_count} found</span>
            <span>· {job.analyzed_count} analyzed</span>
            {job.error_count > 0 ? (
              <span className="text-error">· {job.error_count} errors</span>
            ) : null}
          </div>
        </div>
        {hasPendingItems ? (
          <Button onClick={runAnalysis} disabled={analyzing} className="h-10">
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Running pipeline…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden="true" />
                Run pipeline (next 10)
              </>
            )}
          </Button>
        ) : null}
      </div>

      {job.error_message ? (
        <div className="rounded-xl border border-error/30 bg-error-container/15 p-4 text-body-sm text-error">
          {job.error_message}
        </div>
      ) : null}

      <PipelineTimeline aggregates={aggregates} />

      <Card>
        <CardHeader>
          <CardTitle>Discovered businesses ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              No businesses persisted for this scan yet. If the scan just launched, results will
              appear here as soon as the provider responds.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <BusinessItemRow
                  key={item.id}
                  item={item}
                  stageRuns={
                    item.business_id ? stageRunsByBusiness.get(item.business_id) ?? [] : []
                  }
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

function applyItemChange(items: ScanItem[], payload: RealtimePayload): ScanItem[] {
  if (payload.eventType === "DELETE") {
    const oldId = (payload.old as { id?: string } | null)?.id;
    return oldId ? items.filter((i) => i.id !== oldId) : items;
  }
  const next = payload.new ? toScanItem(payload.new, items) : null;
  if (!next) return items;

  const idx = items.findIndex((i) => i.id === next.id);
  if (idx >= 0) {
    const current = items[idx]!;
    const merged = [...items];
    merged[idx] = { ...current, ...next, business: next.business ?? current.business };
    return merged;
  }
  return [...items, next];
}

function toScanItem(row: Record<string, unknown>, existing: ScanItem[]): ScanItem | null {
  if (typeof row.id !== "string") return null;
  const businessId = (row.business_id as string | null) ?? null;
  // Realtime payload only delivers the row of the changed table — business join is
  // not present. Preserve the previously hydrated business object if we already
  // have it; otherwise the next page navigation will rehydrate from the server.
  const prev = existing.find((i) => i.id === row.id);
  return {
    id: row.id,
    business_id: businessId,
    status: ((row.status as ScanItemStatus) ?? "discovered") as ScanItemStatus,
    discovery_rank: typeof row.discovery_rank === "number" ? row.discovery_rank : null,
    error_message: (row.error_message as string | null) ?? null,
    business: prev?.business ?? null,
  };
}

function applyStageRunChange(runs: StageRun[], payload: RealtimePayload): StageRun[] {
  if (payload.eventType === "DELETE") {
    const oldId = (payload.old as { id?: string } | null)?.id;
    return oldId ? runs.filter((r) => r.id !== oldId) : runs;
  }
  const next = payload.new ? toStageRun(payload.new) : null;
  if (!next) return runs;

  const idx = runs.findIndex((r) => r.id === next.id);
  if (idx >= 0) {
    const merged = [...runs];
    merged[idx] = next;
    return merged;
  }
  return [...runs, next];
}

function toStageRun(row: Record<string, unknown>): StageRun | null {
  if (typeof row.id !== "string") return null;
  const stage = typeof row.stage === "string" && isPipelineStageKey(row.stage) ? row.stage : null;
  if (!stage) return null;
  if (typeof row.business_id !== "string") return null;
  return {
    id: row.id,
    business_id: row.business_id,
    stage,
    status: ((row.status as StageStatus) ?? "queued") as StageStatus,
    attempt_number: Number(row.attempt_number ?? 1),
    error_message: (row.error_message as string | null) ?? null,
    started_at: (row.started_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    output_summary:
      row.output_summary && typeof row.output_summary === "object"
        ? (row.output_summary as Record<string, unknown>)
        : null,
  };
}

function computeAggregates(items: ScanItem[], stageRuns: StageRun[]): StageAggregateMap {
  const total = items.length;
  const map: Partial<StageAggregateMap> = {};

  // Discovery: every persisted item is a successful discovery.
  map.discovery = {
    succeeded: items.filter((i) => i.business_id !== null).length,
    running: 0,
    failed: items.filter((i) => i.status === "failed" && i.business_id === null).length,
    total,
  };

  // Other stages: derive from latest attempt per business per stage.
  const latestByKey = new Map<string, StageRun>();
  for (const run of stageRuns) {
    const key = `${run.business_id}:${run.stage}`;
    const prev = latestByKey.get(key);
    if (!prev || run.attempt_number > prev.attempt_number) {
      latestByKey.set(key, run);
    }
  }

  for (const stage of PIPELINE_STAGES) {
    if (stage.key === "discovery") continue;
    let succeeded = 0;
    let running = 0;
    let failed = 0;
    for (const item of items) {
      if (!item.business_id) continue;
      const run = latestByKey.get(`${item.business_id}:${stage.key}`);
      if (!run) continue;
      if (run.status === "succeeded") succeeded += 1;
      else if (run.status === "running") running += 1;
      else if (run.status === "failed") failed += 1;
    }
    map[stage.key] = { succeeded, running, failed, total } satisfies StageAggregate;
  }

  return map as StageAggregateMap;
}
