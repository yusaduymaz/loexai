import { Target } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { OpportunitiesView } from "@/components/opportunities/OpportunitiesView";
import type { OpportunityCardData } from "@/components/opportunities/OpportunityCard";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

type OpportunityRow = {
  id: string;
  business_id: string;
  opportunity_score: number | null;
  priority: "low" | "medium" | "high" | "urgent" | null;
  close_probability: number | null;
  estimated_deal_value_min: number | null;
  estimated_deal_value_max: number | null;
  estimated_deal_value_currency: "USD" | "EUR" | "TRY" | null;
  reasoning: string | null;
  notes: string | null;
  businesses: {
    name: string;
    category: string | null;
    city: string | null;
    website: string | null;
  } | null;
};

type ScanItemRow = {
  business_id: string | null;
  scan_jobs: {
    id: string;
    location: string | null;
    category: string | null;
    created_at: string;
  } | null;
};

async function loadOpportunities(userId: string): Promise<OpportunityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id, business_id, opportunity_score, priority, close_probability, estimated_deal_value_min, estimated_deal_value_max, estimated_deal_value_currency, reasoning, notes, businesses!inner(name, category, city, website, user_id)",
    )
    .eq("businesses.user_id", userId)
    .order("opportunity_score", { ascending: false });

  if (error || !data) return [];
  return data as unknown as OpportunityRow[];
}

/**
 * For each business_id, return the MOST RECENT scan that discovered it.
 * A business can appear in multiple scans (place_id is unique per user, but
 * the user can re-scan the same area). We surface the latest scan because it
 * reflects the freshest context the user was working in.
 */
async function loadLatestScanByBusiness(
  businessIds: string[],
): Promise<Map<string, NonNullable<ScanItemRow["scan_jobs"]>>> {
  if (businessIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scan_job_items")
    .select("business_id, scan_jobs(id, location, category, created_at)")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false, referencedTable: "scan_jobs" });

  if (error || !data) return new Map();

  const rows = data as unknown as ScanItemRow[];
  const map = new Map<string, NonNullable<ScanItemRow["scan_jobs"]>>();
  for (const row of rows) {
    if (!row.business_id || !row.scan_jobs) continue;
    // First hit wins because the query is ordered DESC on scan_jobs.created_at.
    if (!map.has(row.business_id)) {
      map.set(row.business_id, row.scan_jobs);
    }
  }
  return map;
}

export default async function OpportunitiesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const opportunities = await loadOpportunities(user.id);
  const scanByBusiness = await loadLatestScanByBusiness(
    opportunities.map((o) => o.business_id),
  );

  const cards: OpportunityCardData[] = opportunities.map((o) => {
    const scan = scanByBusiness.get(o.business_id) ?? null;
    return {
      id: o.id,
      business_id: o.business_id,
      opportunity_score: o.opportunity_score,
      priority: o.priority,
      close_probability: o.close_probability,
      estimated_deal_value_min: o.estimated_deal_value_min,
      estimated_deal_value_max: o.estimated_deal_value_max,
      estimated_deal_value_currency: o.estimated_deal_value_currency,
      reasoning: o.reasoning,
      notes: o.notes,
      business_name: o.businesses?.name ?? null,
      business_category: o.businesses?.category ?? null,
      business_city: o.businesses?.city ?? null,
      scan: scan ? { id: scan.id, location: scan.location, category: scan.category } : null,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-stack-lg">
      <div className="flex flex-col gap-stack-xs">
        <Badge variant="primary" className="w-fit">
          Phase 3 Active
        </Badge>
        <h1 className="text-3xl font-semibold text-on-surface">Opportunities</h1>
        <p className="max-w-2xl text-body-md text-on-surface-variant">
          Deterministically scored leads from enrichment, gap analysis, and rule-based scoring.
        </p>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No scored opportunities yet"
          body="Run a discovery scan, then analyze the scan to generate deterministic scores."
          ctaLabel="Go to Discovery"
          ctaHref="/dashboard/discovery"
        />
      ) : (
        <OpportunitiesView opportunities={cards} />
      )}
    </div>
  );
}
