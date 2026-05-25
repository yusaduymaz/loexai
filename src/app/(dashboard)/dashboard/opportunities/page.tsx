import Link from "next/link";
import { Target } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  businesses: {
    name: string;
    category: string | null;
    city: string | null;
    website: string | null;
  } | null;
};

async function loadOpportunities(): Promise<OpportunityRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id, business_id, opportunity_score, priority, close_probability, estimated_deal_value_min, estimated_deal_value_max, estimated_deal_value_currency, reasoning, businesses(name, category, city, website)",
    )
    .eq("businesses.user_id", user.id)
    .order("opportunity_score", { ascending: false });

  if (error || !data) return [];
  return data as unknown as OpportunityRow[];
}

export default async function OpportunitiesPage() {
  const opportunities = await loadOpportunities();

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

      {opportunities.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No scored opportunities yet"
          body="Run a discovery scan, then analyze the scan to generate deterministic scores."
          ctaLabel="Go to Discovery"
          ctaHref="/dashboard/discovery"
        />
      ) : (
        <div className="grid gap-gutter">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id}>
              <CardHeader className="flex flex-col gap-stack-sm md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{opportunity.businesses?.name ?? "Unknown business"}</CardTitle>
                  <CardDescription>
                    {[opportunity.businesses?.category, opportunity.businesses?.city]
                      .filter(Boolean)
                      .join(" · ") || "Local business"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={priorityVariant(opportunity.priority)}>
                    {opportunity.priority ?? "unscored"}
                  </Badge>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                    {opportunity.opportunity_score ?? 0}/100
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid gap-stack-sm">
                <p className="text-body-sm text-on-surface-variant">
                  {opportunity.reasoning ?? "No reasoning recorded."}
                </p>
                <div className="flex flex-wrap gap-3 text-body-sm text-on-surface-variant">
                  <span>
                    Close probability:{" "}
                    <strong className="text-on-surface">
                      {Math.round((opportunity.close_probability ?? 0) * 100)}%
                    </strong>
                  </span>
                  <span>
                    Est. value:{" "}
                    <strong className="text-on-surface">
                      {opportunity.estimated_deal_value_currency ?? "USD"}{" "}
                      {opportunity.estimated_deal_value_min ?? 0}-
                      {opportunity.estimated_deal_value_max ?? 0}
                    </strong>
                  </span>
                </div>
                <Link
                  href={`/dashboard/business/${opportunity.business_id}`}
                  className="w-fit text-body-sm font-medium text-primary hover:underline"
                >
                  Open business report →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function priorityVariant(priority: OpportunityRow["priority"]) {
  if (priority === "urgent" || priority === "high") return "danger";
  if (priority === "medium") return "warning";
  if (priority === "low") return "neutral";
  return "neutral";
}
