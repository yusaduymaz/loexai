import { AlertCircle, CheckCircle2, Search } from "lucide-react";

import {
  analyzeScanJob,
  launchDiscoveryScan,
} from "@/app/(dashboard)/dashboard/discovery/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getDiscoveryRuntimeConfig } from "@/lib/discovery/config";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: {
    error?: string;
    found?: string;
    job?: string;
    analyzed?: string;
    failed?: string;
  };
};

type RecentJob = {
  id: string;
  location: string;
  category: string;
  radius_m: number;
  status: "queued" | "running" | "completed" | "partial" | "failed";
  found_count: number;
  analyzed_count: number;
  error_count: number;
  created_at: string;
};

async function loadRecentJobs(userId: string): Promise<RecentJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scan_jobs")
    .select("id, location, category, radius_m, status, found_count, analyzed_count, error_count, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return [];
  return data;
}

export default async function DiscoveryPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const [recentJobs, runtime] = await Promise.all([
    loadRecentJobs(user.id),
    Promise.resolve(getDiscoveryRuntimeConfig()),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-stack-lg">
      <div className="flex flex-col gap-stack-sm">
        <Badge variant="primary" className="w-fit">
          Phase 2 Active
        </Badge>
        <div className="flex flex-col gap-stack-xs">
          <h1 className="text-3xl font-semibold text-on-surface">Lead Discovery</h1>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            Launch a provider-backed scan, persist deduplicated businesses, and attach every
            result to a durable scan job for the pipeline.
          </p>
        </div>
      </div>

      {searchParams?.error ? (
        <StatusBanner tone="error" message={searchParams.error} />
      ) : null}
      {searchParams?.found ? (
        <StatusBanner
          tone="success"
          message={`Scan ${searchParams.job ?? ""} completed with ${searchParams.found} persisted leads.`}
        />
      ) : null}
      {searchParams?.analyzed ? (
        <StatusBanner
          tone="success"
          message={`Deterministic analysis completed for ${searchParams.analyzed} lead(s); ${searchParams.failed ?? 0} failed.`}
        />
      ) : null}

      <div className="grid gap-gutter lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Start a scan</CardTitle>
                <CardDescription>
                  Google Places is the default provider. Results are capped by provider response size.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action={launchDiscoveryScan} className="grid gap-stack-md">
              <div className="grid gap-stack-xs">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Kadıköy, İstanbul"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>

              <div className="grid gap-stack-xs">
                <Label htmlFor="category">Business category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="restaurants, dentists, gyms"
                  required
                  minLength={2}
                  maxLength={80}
                />
              </div>

              <div className="grid gap-stack-xs">
                <Label htmlFor="radiusM">Radius, meters</Label>
                <Input
                  id="radiusM"
                  name="radiusM"
                  type="number"
                  min={500}
                  max={50000}
                  step={500}
                  defaultValue={5000}
                  required
                />
              </div>

              <Button type="submit" className="w-fit">
                Launch discovery scan
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider readiness</CardTitle>
            <CardDescription>
              Discovery fails closed if required credentials are not configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-stack-sm text-body-sm">
            <div className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-low p-3">
              <span className="text-on-surface-variant">Provider</span>
              <Badge variant="neutral">{runtime.provider}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-low p-3">
              <span className="text-on-surface-variant">Credentials</span>
              <Badge variant={runtime.credentialsConfigured ? "success" : "warning"}>
                {runtime.credentialsConfigured ? "configured" : "missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-low p-3">
              <span className="text-on-surface-variant">Timeout</span>
              <span className="font-medium text-on-surface">{runtime.timeoutMs}ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent scans</CardTitle>
          <CardDescription>Last five scan jobs for this account.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              No scans yet. Launch one above to populate the pipeline.
            </p>
          ) : (
            <div className="divide-y divide-outline-variant/30 overflow-hidden rounded-lg border border-outline-variant/30">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="grid gap-2 bg-surface-container-low p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-medium text-on-surface">
                      {job.category} in {job.location}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {job.found_count} found · {job.analyzed_count} analyzed · {job.error_count} errors · {job.radius_m}m
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === "failed" ? "danger" : "neutral"}>
                      {job.status}
                    </Badge>
                    {job.found_count > job.analyzed_count ? (
                      <form action={analyzeScanJob}>
                        <input type="hidden" name="scanJobId" value={job.id} />
                        <Button type="submit" variant="secondary" size="sm">
                          Analyze
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBanner({ tone, message }: { tone: "success" | "error"; message: string }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={
        tone === "success"
          ? "flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200"
          : "flex items-center gap-2 rounded-xl border border-error/30 bg-error-container/20 p-4 text-error"
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <p className="text-body-sm">{message}</p>
    </div>
  );
}
