import { Code2, Flame, Gauge, Mail, Search } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

/**
 * Dashboard Overview (DASH-01..04, D-12, D-13).
 *
 * Phase 1 invariant: there is no business/opportunity/strategy data yet —
 * every aggregate returns 0 and the page falls back to an empty-state CTA
 * pointing at /dashboard/discovery (Phase 2 dim shell). The queries are
 * wired now so that Phase 2/3 only have to populate rows; no UI rewrite
 * needed when data starts flowing.
 *
 * All reads pass through the user-scoped (RLS-respecting) client. RLS
 * policies from PLAN-1B guarantee row isolation — no extra WHERE filter
 * needed against `user_id` (the policy enforces it), but adding it costs
 * nothing and keeps the SQL self-explanatory.
 */
type Metrics = {
  totalLeads: number;
  highOpportunityLeads: number;
  averageOpportunityScore: number | null;
  aiStrategiesGenerated: number;
  buildPromptsGenerated: number;
};

async function loadMetrics(userId: string): Promise<Metrics> {
  const supabase = await createClient();

  // Phase 1: tables exist (PLAN-1B) but are empty for any user. Queries should
  // succeed and return zeros. If a query errors (e.g. table missing), we fall
  // back to zeros so the dashboard never blocks on a downstream schema gap.
  const safeCount = async (
    query: PromiseLike<{ count: number | null; error: unknown }>,
  ): Promise<number> => {
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  };

  const [totalLeads, highOpportunityLeads, aiStrategies, buildPrompts] = await Promise.all([
    safeCount(
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ),
    safeCount(
      supabase
        .from("opportunities")
        .select("*, businesses!inner(user_id)", { count: "exact", head: true })
        .in("priority", ["high", "urgent"])
        .eq("businesses.user_id", userId),
    ),
    safeCount(
      supabase
        .from("sales_strategies")
        .select("*, businesses!inner(user_id)", { count: "exact", head: true })
        .eq("businesses.user_id", userId),
    ),
    safeCount(
      supabase
        .from("build_prompts")
        .select("*, businesses!inner(user_id)", { count: "exact", head: true })
        .eq("businesses.user_id", userId),
    ),
  ]);

  // Average score: separate query because Supabase JS doesn't expose AVG
  // directly. In Phase 1 there are no rows so the response is empty and we
  // return null (rendered as "—"). Phase 3 may switch to a Postgres RPC.
  const { data: scoreRows, error: scoreError } = await supabase
    .from("opportunities")
    .select("opportunity_score, businesses!inner(user_id)")
    .eq("businesses.user_id", userId);

  let averageOpportunityScore: number | null = null;
  if (!scoreError && scoreRows && scoreRows.length > 0) {
    const sum = scoreRows.reduce(
      (acc: number, row: { opportunity_score: number | null }) =>
        acc + (row.opportunity_score ?? 0),
      0,
    );
    averageOpportunityScore = Math.round(sum / scoreRows.length);
  }

  return {
    totalLeads,
    highOpportunityLeads,
    averageOpportunityScore,
    aiStrategiesGenerated: aiStrategies,
    buildPromptsGenerated: buildPrompts,
  };
}

export default async function OverviewPage() {
  const user = await getCurrentUser();
  // Layout's requireRole already redirects unauthenticated; this is defensive.
  if (!user) {
    return null;
  }

  const metrics = await loadMetrics(user.id);
  const hasAnyData = metrics.totalLeads > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-xl">
      {/* Greeting */}
      <div className="flex flex-col items-start justify-between gap-stack-md md:flex-row md:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-on-background md:text-3xl">
            Welcome back, {user.email}
          </h1>
        </div>
      </div>

      {/* Metric grid */}
      <section>
        <div className="mb-stack-md flex items-center justify-between">
          <h2 className="text-lg font-semibold text-on-background md:text-xl">Overview</h2>
          <span className="rounded-full border border-outline-variant bg-surface-container px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">
            ALL TIME
          </span>
        </div>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-5">
          <OverviewCard title="Total Leads" value={metrics.totalLeads.toString()} icon={Search} />
          <OverviewCard
            title="High Opportunity Leads"
            value={metrics.highOpportunityLeads.toString()}
            icon={Flame}
          />
          <OverviewCard
            title="Avg Opportunity Score"
            value={
              metrics.averageOpportunityScore === null
                ? "—"
                : `${metrics.averageOpportunityScore}`
            }
            icon={Gauge}
            hint="out of 100"
          />
          <OverviewCard
            title="AI Strategies Generated"
            value={metrics.aiStrategiesGenerated.toString()}
            icon={Mail}
          />
          <OverviewCard
            title="Build Prompts Generated"
            value={metrics.buildPromptsGenerated.toString()}
            icon={Code2}
          />
        </div>
      </section>

      {/* Empty state */}
      {!hasAnyData ? (
        <EmptyState
          icon={Search}
          title="No data yet"
          body="Start a scan to discover local businesses and uncover digital opportunities. Phase 2 will activate lead discovery."
          ctaLabel="Start a scan →"
          ctaHref="/dashboard/discovery"
        />
      ) : null}
    </div>
  );
}
