"use client";

import { useEffect, useMemo, useState } from "react";

import { DiscoveryForm } from "@/components/discovery/DiscoveryForm";
import { LiveScanBanner } from "@/components/discovery/LiveScanBanner";
import { ProviderReadinessCard, type ProviderReadiness } from "@/components/discovery/ProviderReadinessCard";
import { RecentJobsList, type RecentJob } from "@/components/discovery/RecentJobsList";
import type { ScanQuota } from "@/lib/billing/plan";
import { createClient } from "@/lib/supabase/client";

const MAX_JOBS = 5;

export function DiscoveryWorkbench({
  userId,
  initialJobs,
  scanQuota,
  maxLeadsPerScan,
  isAdmin,
  provider,
}: {
  userId: string;
  initialJobs: RecentJob[];
  scanQuota: ScanQuota;
  maxLeadsPerScan: number;
  isAdmin: boolean;
  provider: ProviderReadiness;
}) {
  const [jobs, setJobs] = useState<RecentJob[]>(initialJobs);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`scan_jobs:user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scan_jobs",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setJobs((current) => applyJobChange(current, payload as RealtimePayload));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const activeJob = useMemo(
    () =>
      jobs.find(
        (job) =>
          job.status === "running" ||
          (job.status !== "failed" && job.found_count > 0 && job.analyzed_count < job.found_count),
      ) ?? null,
    [jobs],
  );

  const defaultLocation = jobs[0]?.location;

  return (
    <div className="flex flex-col gap-stack-lg">
      {activeJob ? <LiveScanBanner job={activeJob} /> : null}

      <div className="grid gap-gutter lg:grid-cols-[1.1fr_0.9fr]">
        <DiscoveryForm
          defaultLocation={defaultLocation}
          scanQuota={scanQuota}
          maxLeadsPerScan={maxLeadsPerScan}
          isAdmin={isAdmin}
        />
        <ProviderReadinessCard provider={provider} />
      </div>

      <RecentJobsList jobs={jobs} />
    </div>
  );
}

type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

function applyJobChange(jobs: RecentJob[], payload: RealtimePayload): RecentJob[] {
  if (payload.eventType === "DELETE") {
    const oldId = (payload.old as { id?: string } | null)?.id;
    return oldId ? jobs.filter((j) => j.id !== oldId) : jobs;
  }

  const next = payload.new ? toRecentJob(payload.new) : null;
  if (!next) return jobs;

  const exists = jobs.some((j) => j.id === next.id);
  if (exists) {
    return jobs.map((j) => (j.id === next.id ? next : j));
  }
  return [next, ...jobs].slice(0, MAX_JOBS);
}

function toRecentJob(row: Record<string, unknown>): RecentJob | null {
  if (typeof row.id !== "string") return null;
  return {
    id: row.id,
    location: String(row.location ?? ""),
    category: String(row.category ?? ""),
    radius_m: Number(row.radius_m ?? 0),
    status: ((row.status as RecentJob["status"]) ?? "queued") as RecentJob["status"],
    found_count: Number(row.found_count ?? 0),
    analyzed_count: Number(row.analyzed_count ?? 0),
    error_count: Number(row.error_count ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}
