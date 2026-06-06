"use client";

import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

import type { RecentJob } from "@/components/discovery/RecentJobsList";

export function LiveScanBanner({ job }: { job: RecentJob }) {
  const total = Math.max(job.found_count, 1);
  const pct =
    job.found_count > 0
      ? Math.min(100, Math.round((job.analyzed_count / total) * 100))
      : 6;

  return (
    <div className="sticky top-2 z-20 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary-container/30 via-surface-container to-secondary-container/20 shadow-ambient backdrop-blur-sm">
      <div className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <p className="text-label-caps text-xs font-medium uppercase tracking-wider text-primary">
              Live scan in progress
            </p>
          </div>
          <p className="truncate text-body-sm font-medium text-on-surface">
            {job.category} in {job.location}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {job.found_count} found · {job.analyzed_count} analyzed · {job.error_count} errors
          </p>
        </div>
        <Link
          href={`/dashboard/discovery/${job.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-surface/30 px-3 py-1.5 text-body-sm text-primary backdrop-blur-sm transition-colors hover:bg-surface/50"
        >
          View pipeline
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="h-1 w-full overflow-hidden bg-surface-container">
        <div
          className="h-full animate-pulse bg-gradient-to-r from-primary to-secondary transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
