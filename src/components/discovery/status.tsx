import { CheckCircle2, CircleDashed, CircleSlash, Loader2, OctagonAlert, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ScanJobStatus = "queued" | "running" | "completed" | "partial" | "failed";
export type ScanItemStatus =
  | "discovered"
  | "queued"
  | "analyzing"
  | "completed"
  | "failed"
  | "skipped";
export type StageStatus = "queued" | "running" | "succeeded" | "failed" | "skipped";
export type AnyStatus = ScanJobStatus | ScanItemStatus | StageStatus;

type StatusMeta = {
  label: string;
  variant: NonNullable<BadgeProps["variant"]>;
  icon: LucideIcon;
  pulse: boolean;
};

const REGISTRY: Record<AnyStatus, StatusMeta> = {
  queued: { label: "Queued", variant: "neutral", icon: CircleDashed, pulse: false },
  discovered: { label: "Discovered", variant: "neutral", icon: CircleDashed, pulse: false },
  skipped: { label: "Skipped", variant: "neutral", icon: CircleSlash, pulse: false },
  running: { label: "Running", variant: "primary", icon: Loader2, pulse: true },
  analyzing: { label: "Analyzing", variant: "primary", icon: Loader2, pulse: true },
  completed: { label: "Completed", variant: "success", icon: CheckCircle2, pulse: false },
  succeeded: { label: "Succeeded", variant: "success", icon: CheckCircle2, pulse: false },
  partial: { label: "Partial", variant: "warning", icon: OctagonAlert, pulse: false },
  failed: { label: "Failed", variant: "danger", icon: XCircle, pulse: false },
};

export function getStatusMeta(status: AnyStatus): StatusMeta {
  return REGISTRY[status] ?? { label: status, variant: "neutral", icon: CircleDashed, pulse: false };
}

type StatusBadgeProps = {
  status: AnyStatus;
  className?: string;
  showIcon?: boolean;
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  const Icon = meta.icon;

  return (
    <Badge
      variant={meta.variant}
      className={cn(
        "inline-flex items-center gap-1.5",
        meta.pulse && "animate-pulse-soft",
        className,
      )}
    >
      {showIcon ? (
        <Icon
          aria-hidden="true"
          className={cn("h-3 w-3", meta.pulse && "animate-spin")}
        />
      ) : null}
      {meta.label}
    </Badge>
  );
}
