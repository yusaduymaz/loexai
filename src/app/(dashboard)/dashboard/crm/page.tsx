import Link from "next/link";
import { Users } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

type CrmStatus = "contacted" | "proposal_sent" | "won" | "lost";

type CrmRow = {
  id: string;
  business_id: string;
  opportunity_score: number | null;
  status: CrmStatus;
  updated_at: string;
  businesses: {
    name: string;
    category: string | null;
    city: string | null;
  } | null;
};

const COLUMN_ORDER: CrmStatus[] = ["contacted", "proposal_sent", "won", "lost"];

const COLUMN_LABEL: Record<CrmStatus, string> = {
  contacted: "Contacted",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

async function loadCrm(): Promise<CrmRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id, business_id, opportunity_score, status, updated_at, businesses!inner(name, category, city, user_id)",
    )
    .in("status", COLUMN_ORDER)
    .eq("businesses.user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as CrmRow[];
}

export default async function CrmPage() {
  const rows = await loadCrm();

  if (rows.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-stack-lg">
        <div className="flex flex-col gap-stack-xs">
          <Badge variant="primary" className="w-fit">
            Outreach
          </Badge>
          <h1 className="text-3xl font-semibold text-on-surface">CRM</h1>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            Track every opportunity from first contact to closed deal. Change a status from a
            business report to populate this board.
          </p>
        </div>
        <EmptyState
          icon={Users}
          title="No outreach in flight"
          body="Move an opportunity to Contacted, Proposal Sent, Won, or Lost to see it here."
          ctaLabel="Browse opportunities"
          ctaHref="/dashboard/opportunities"
        />
      </div>
    );
  }

  const byStatus = groupByStatus(rows);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-stack-lg">
      <div className="flex flex-col gap-stack-xs">
        <Badge variant="primary" className="w-fit">
          Outreach
        </Badge>
        <h1 className="text-3xl font-semibold text-on-surface">CRM</h1>
        <p className="max-w-2xl text-body-md text-on-surface-variant">
          Track every opportunity from first contact to closed deal.
        </p>
      </div>

      <div className="grid gap-gutter md:grid-cols-2 xl:grid-cols-4">
        {COLUMN_ORDER.map((status) => {
          const items = byStatus[status] ?? [];
          return (
            <div key={status} className="flex flex-col gap-stack-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  {COLUMN_LABEL[status]}
                </h2>
                <Badge variant={statusVariant(status)}>{items.length}</Badge>
              </div>

              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-outline-variant/60 px-stack-md py-stack-md text-body-sm text-on-surface-variant">
                  No items.
                </p>
              ) : (
                <div className="flex flex-col gap-stack-sm">
                  {items.map((row) => (
                    <Card key={row.id}>
                      <CardHeader className="gap-1">
                        <CardTitle className="text-base">
                          {row.businesses?.name ?? "Unknown business"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {[row.businesses?.category, row.businesses?.city]
                            .filter(Boolean)
                            .join(" · ") || "Local business"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between text-body-sm">
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {row.opportunity_score ?? 0}/100
                        </span>
                        <Link
                          href={`/dashboard/business/${row.business_id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Open →
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function groupByStatus(rows: CrmRow[]): Record<CrmStatus, CrmRow[]> {
  const initial: Record<CrmStatus, CrmRow[]> = {
    contacted: [],
    proposal_sent: [],
    won: [],
    lost: [],
  };
  for (const row of rows) {
    initial[row.status].push(row);
  }
  return initial;
}

function statusVariant(status: CrmStatus) {
  if (status === "won") return "success";
  if (status === "lost") return "danger";
  if (status === "proposal_sent") return "warning";
  return "secondary";
}
