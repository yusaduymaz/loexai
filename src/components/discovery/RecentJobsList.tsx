"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { analyzeScanJob } from "@/app/(dashboard)/dashboard/discovery/actions";
import { StatusBadge, type ScanJobStatus } from "@/components/discovery/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type RecentJob = {
  id: string;
  location: string;
  category: string;
  radius_m: number;
  status: ScanJobStatus;
  found_count: number;
  analyzed_count: number;
  error_count: number;
  created_at: string;
};

export function RecentJobsList({ jobs }: { jobs: RecentJob[] }) {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent scans</CardTitle>
          <CardDescription>Last five scan jobs for this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-on-surface-variant">
            No scans yet. Launch one above to populate the pipeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent scans</CardTitle>
        <CardDescription>
          Live — status, counts, and analysis progress update without a refresh.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-outline-variant/30 overflow-hidden rounded-lg border border-outline-variant/30">
          {jobs.map((job) => (
            <RecentJobRow key={job.id} job={job} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function RecentJobRow({ job }: { job: RecentJob }) {
  const [pending, startTransition] = useTransition();

  const analyzedPct =
    job.found_count > 0
      ? Math.min(100, Math.round((job.analyzed_count / job.found_count) * 100))
      : 0;

  const hasPendingItems = job.found_count > 0 && job.analyzed_count < job.found_count;

  const onAnalyze = () => {
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
    <li className="grid gap-3 bg-surface-container-low p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/discovery/${job.id}`}
            className="truncate font-medium text-on-surface transition-colors hover:text-primary"
          >
            {job.category} in {job.location}
          </Link>
          <span className="text-body-sm text-on-surface-variant">· {job.radius_m}m</span>
        </div>
        <p className="mt-0.5 text-body-sm text-on-surface-variant">
          {job.found_count} found · {job.analyzed_count} analyzed · {job.error_count} errors
        </p>
        {job.found_count > 0 ? (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500 ease-out",
                job.status === "failed"
                  ? "bg-error"
                  : job.status === "partial"
                    ? "bg-amber-400"
                    : "bg-gradient-to-r from-primary to-secondary",
              )}
              style={{ width: `${analyzedPct}%` }}
            />
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <StatusBadge status={job.status} />
        {hasPendingItems ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAnalyze}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Analyzing…
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        ) : null}
        <Link
          href={`/dashboard/discovery/${job.id}`}
          aria-label="Open scan details"
          className="grid h-9 w-9 place-items-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}
