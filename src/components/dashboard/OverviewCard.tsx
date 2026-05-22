import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Single metric card used in the Overview grid (DASH-02, D-13).
 *
 * Visual reference: `tasarimornegi/Dashboard-Overview.html` metric cards —
 * surface-container-low background, outline-variant border, soft accent glow.
 */
type Props = {
  title: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
};

export function OverviewCard({ title, value, icon: Icon, hint }: Props) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg",
        "transition-colors duration-300 hover:border-secondary-fixed-dim",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-secondary-fixed-dim/5 blur-2xl transition-all group-hover:bg-secondary-fixed-dim/10"
      />
      <div className="relative">
        <div className="mb-stack-md flex items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-outline-variant bg-surface-container text-secondary-fixed-dim transition-colors group-hover:border-secondary-fixed-dim/50">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <h3 className="mb-1 text-sm text-on-surface-variant">{title}</h3>
        <p className="font-mono text-4xl font-bold tracking-tight text-on-background" data-mono>
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
