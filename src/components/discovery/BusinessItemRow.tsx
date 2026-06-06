"use client";

import { Building2, ChevronDown, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

import { PIPELINE_STAGES, type PipelineStageKey } from "@/components/discovery/pipeline-stages";
import { StatusBadge, type ScanItemStatus, type StageStatus } from "@/components/discovery/status";
import { getStatusMeta } from "@/components/discovery/status";
import { cn } from "@/lib/utils";

export type ItemBusiness = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  website: string | null;
};

export type ScanItem = {
  id: string;
  business_id: string | null;
  status: ScanItemStatus;
  discovery_rank: number | null;
  error_message: string | null;
  business: ItemBusiness | null;
};

export type StageRun = {
  id: string;
  business_id: string;
  stage: PipelineStageKey;
  status: StageStatus;
  attempt_number: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  output_summary: Record<string, unknown> | null;
};

export function BusinessItemRow({
  item,
  stageRuns,
}: {
  item: ScanItem;
  stageRuns: StageRun[];
}) {
  const [open, setOpen] = useState(false);

  const latestByStage = useMemo(() => {
    const map = new Map<PipelineStageKey, StageRun>();
    for (const run of stageRuns) {
      const prev = map.get(run.stage);
      if (!prev || run.attempt_number > prev.attempt_number) {
        map.set(run.stage, run);
      }
    }
    return map;
  }, [stageRuns]);

  const scoringRun = latestByStage.get("scoring");
  const score =
    scoringRun && scoringRun.output_summary && typeof scoringRun.output_summary === "object"
      ? Number((scoringRun.output_summary as { score?: unknown }).score ?? NaN)
      : NaN;
  const priority =
    scoringRun && scoringRun.output_summary && typeof scoringRun.output_summary === "object"
      ? String((scoringRun.output_summary as { priority?: unknown }).priority ?? "")
      : "";

  return (
    <li className="overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-low">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-container"
        aria-expanded={open}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-container text-on-surface-variant">
          <Building2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-on-surface">
              {item.business?.name ?? "Unknown business"}
            </p>
            {item.discovery_rank ? (
              <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">
                #{item.discovery_rank}
              </span>
            ) : null}
          </div>
          <p className="truncate text-body-sm text-on-surface-variant">
            {[item.business?.category, item.business?.city].filter(Boolean).join(" · ") ||
              "No category"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {Number.isFinite(score) ? (
            <div className="flex flex-col items-end text-right">
              <span className="font-mono text-body-sm font-semibold text-primary">
                {Math.round(score)}
              </span>
              {priority ? (
                <span className="text-[10px] uppercase text-on-surface-variant">{priority}</span>
              ) : null}
            </div>
          ) : null}
          <StatusBadge status={item.status} />
          <ChevronDown
            className={cn(
              "h-4 w-4 text-on-surface-variant transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {open ? (
        <div className="border-t border-outline-variant/30 bg-surface-container/40 p-4">
          {item.error_message ? (
            <div className="mb-3 rounded-lg border border-error/30 bg-error-container/15 p-3 text-body-sm text-error">
              {item.error_message}
            </div>
          ) : null}

          <ol className="grid grid-cols-4 gap-2 md:grid-cols-8">
            {PIPELINE_STAGES.map((stage, index) => {
              const run = latestByStage.get(stage.key);
              return (
                <StageCell
                  key={stage.key}
                  index={index + 1}
                  label={stage.label}
                  status={run?.status ?? null}
                  errorMessage={run?.error_message ?? null}
                  deterministic={stage.deterministic}
                />
              );
            })}
          </ol>

          {item.business?.website ? (
            <a
              href={item.business.website}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-body-sm text-primary hover:underline"
            >
              {item.business.website}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : (
            <p className="mt-4 text-body-sm text-on-surface-variant">
              No website discovered for this business.
            </p>
          )}
        </div>
      ) : null}
    </li>
  );
}

function StageCell({
  index,
  label,
  status,
  errorMessage,
  deterministic,
}: {
  index: number;
  label: string;
  status: StageStatus | null;
  errorMessage: string | null;
  deterministic: boolean;
}) {
  const effective: StageStatus = status ?? (deterministic ? "queued" : "skipped");
  const meta = getStatusMeta(effective);
  const Icon = meta.icon;
  return (
    <div
      title={errorMessage ?? `${label} · ${meta.label}`}
      className={cn(
        "flex flex-col items-center gap-1 rounded-md border p-2 text-center",
        status === "failed"
          ? "border-error/40 bg-error/10"
          : status === "running"
            ? "border-primary/50 bg-primary/10"
            : status === "succeeded"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-outline-variant/40 bg-surface-container-low",
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          status === "failed"
            ? "text-error"
            : status === "running"
              ? "animate-spin text-primary"
              : status === "succeeded"
                ? "text-emerald-300"
                : "text-on-surface-variant",
        )}
        aria-hidden="true"
      />
      <span className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
        {String(index).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-on-surface-variant/80">{label}</span>
    </div>
  );
}
