import { Badge } from "@/components/ui/badge";
import { DiscoveryWorkbench } from "@/components/discovery/DiscoveryWorkbench";
import type { RecentJob } from "@/components/discovery/RecentJobsList";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getPlanLimits, getScanQuota } from "@/lib/billing/plan";
import { getDiscoveryRuntimeConfig } from "@/lib/discovery/config";
import { createClient } from "@/lib/supabase/server";

async function loadRecentJobs(userId: string): Promise<RecentJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scan_jobs")
    .select(
      "id, location, category, radius_m, status, found_count, analyzed_count, error_count, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return [];
  return (data ?? []) as RecentJob[];
}

export default async function DiscoveryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Plans beyond `free` aren't enforced yet (Phase 5). Treat every user as
  // free for the cap; admins bypass the cap inside the RPC.
  const [recentJobs, runtime, scanQuota] = await Promise.all([
    loadRecentJobs(user.id),
    Promise.resolve(getDiscoveryRuntimeConfig()),
    getScanQuota(user.id),
  ]);
  const planLimits = getPlanLimits();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-stack-lg">
      <header className="flex flex-col gap-stack-sm">
        <Badge variant="primary" className="w-fit">
          Phase 2 Active
        </Badge>
        <div className="flex flex-col gap-stack-xs">
          <h1 className="text-3xl font-semibold text-on-surface">Lead Discovery</h1>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            Launch a provider-backed scan, watch each lead move through the 8-stage pipeline
            live, and drill into any business to see exactly which stage stalled.
          </p>
        </div>
      </header>

      <DiscoveryWorkbench
        userId={user.id}
        initialJobs={recentJobs}
        scanQuota={scanQuota}
        maxLeadsPerScan={planLimits.maxLeadsPerScan}
        isAdmin={user.role === "admin"}
        provider={{
          provider: runtime.provider,
          credentialsConfigured: runtime.credentialsConfigured,
          timeoutMs: runtime.timeoutMs,
        }}
      />
    </div>
  );
}
