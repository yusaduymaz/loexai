"use client";

import { CheckCircle2, CircleDashed, Loader2, Sparkles, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PIPELINE_STAGES, type PipelineStageKey } from "@/components/discovery/pipeline-stages";
import { cn } from "@/lib/utils";

export type StageAggregate = {
  succeeded: number;
  running: number;
  failed: number;
  total: number;
};

export type StageAggregateMap = Record<PipelineStageKey, StageAggregate>;

export function PipelineTimeline({ aggregates }: { aggregates: StageAggregateMap }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-body-lg font-semibold text-on-surface">Pipeline progress</h3>
          <p className="text-body-sm text-on-surface-variant">
            Each lead flows left-to-right. Stages with the dashed ring are not wired yet —
            they show where the pipeline is headed.
          </p>
        </div>
      </div>

      <ol className="grid gap-3 md:grid-cols-4 lg:grid-cols-8">
        {PIPELINE_STAGES.map((stage, index) => {
          const agg = aggregates[stage.key];
          const visual = resolveVisual(agg, !stage.deterministic);
          return (
            <li key={stage.key} className="relative flex flex-col items-stretch">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -left-1.5 top-5 hidden h-px w-3 bg-outline-variant/40 lg:block"
                />
              ) : null}
              <StageNode
                index={index + 1}
                label={stage.label}
                description={stage.description}
                visual={visual}
                aggregate={agg}
                deterministic={stage.deterministic}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type Visual = {
  Icon: LucideIcon;
  ringClass: string;
  iconClass: string;
  labelClass: string;
  countClass: string;
  pulse: boolean;
};

function resolveVisual(agg: StageAggregate | undefined, notWired: boolean): Visual {
  const safe = agg ?? { succeeded: 0, running: 0, failed: 0, total: 0 };

  if (notWired && safe.succeeded === 0 && safe.running === 0 && safe.failed === 0) {
    return {
      Icon: Sparkles,
      ringClass: "border-dashed border-outline-variant/40 bg-surface-container/50",
      iconClass: "text-on-surface-variant/60",
      labelClass: "text-on-surface-variant/70",
      countClass: "text-on-surface-variant/60",
      pulse: false,
    };
  }
  if (safe.failed > 0 && safe.succeeded < safe.total) {
    return {
      Icon: XCircle,
      ringClass: "border-error/50 bg-error/10",
      iconClass: "text-error",
      labelClass: "text-on-surface",
      countClass: "text-error",
      pulse: false,
    };
  }
  if (safe.running > 0) {
    return {
      Icon: Loader2,
      ringClass: "border-primary/60 bg-primary/15",
      iconClass: "text-primary animate-spin",
      labelClass: "text-on-surface",
      countClass: "text-primary",
      pulse: true,
    };
  }
  if (safe.total > 0 && safe.succeeded >= safe.total) {
    return {
      Icon: CheckCircle2,
      ringClass: "border-emerald-500/50 bg-emerald-500/10",
      iconClass: "text-emerald-300",
      labelClass: "text-on-surface",
      countClass: "text-emerald-300",
      pulse: false,
    };
  }
  if (safe.succeeded > 0) {
    return {
      Icon: CheckCircle2,
      ringClass: "border-primary/40 bg-primary/10",
      iconClass: "text-primary",
      labelClass: "text-on-surface",
      countClass: "text-primary",
      pulse: false,
    };
  }
  return {
    Icon: CircleDashed,
    ringClass: "border-outline-variant/40 bg-surface-container/40",
    iconClass: "text-on-surface-variant",
    labelClass: "text-on-surface-variant",
    countClass: "text-on-surface-variant",
    pulse: false,
  };
}

function StageNode({
  index,
  label,
  description,
  visual,
  aggregate,
  deterministic,
}: {
  index: number;
  label: string;
  description: string;
  visual: Visual;
  aggregate: StageAggregate | undefined;
  deterministic: boolean;
}) {
  const { Icon } = visual;
  const total = aggregate?.total ?? 0;
  const succeeded = aggregate?.succeeded ?? 0;
  const running = aggregate?.running ?? 0;
  const failed = aggregate?.failed ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((succeeded / total) * 100)) : 0;

  return (
    <div className="flex h-full flex-col items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container/40 p-3 text-center">
      <div className={cn("grid h-10 w-10 place-items-center rounded-full border-2", visual.ringClass)}>
        <Icon className={cn("h-4 w-4", visual.iconClass)} aria-hidden="true" />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">
          {String(index).padStart(2, "0")}
        </p>
        <p className={cn("text-body-sm font-medium", visual.labelClass)}>{label}</p>
        <p className="text-[10px] text-on-surface-variant/70">{description}</p>
      </div>
      <div className="mt-auto w-full">
        {deterministic || succeeded > 0 || running > 0 || failed > 0 ? (
          <>
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  visual.pulse
                    ? "animate-pulse bg-gradient-to-r from-primary to-secondary"
                    : failed > 0
                      ? "bg-error"
                      : succeeded > 0
                        ? "bg-gradient-to-r from-primary to-secondary"
                        : "bg-outline-variant/40",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className={cn("mt-1 font-mono text-[10px]", visual.countClass)}>
              {succeeded}/{total}
              {running > 0 ? <span className="ml-1">· {running} running</span> : null}
              {failed > 0 ? <span className="ml-1">· {failed} failed</span> : null}
            </p>
          </>
        ) : (
          <p className="font-mono text-[10px] text-on-surface-variant/60">soon</p>
        )}
      </div>
    </div>
  );
}
