import Link from "next/link";
import { Bookmark } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

type SavedRow = {
  id: string;
  business_id: string;
  opportunity_score: number | null;
  priority: "low" | "medium" | "high" | "urgent" | null;
  updated_at: string;
  businesses: {
    name: string;
    category: string | null;
    city: string | null;
  } | null;
};

async function loadSavedLeads(): Promise<SavedRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id, business_id, opportunity_score, priority, updated_at, businesses!inner(name, category, city, user_id)",
    )
    .eq("status", "saved")
    .eq("businesses.user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as SavedRow[];
}

export default async function SavedLeadsPage() {
  const saved = await loadSavedLeads();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-stack-lg">
      <div className="flex flex-col gap-stack-xs">
        <Badge variant="primary" className="w-fit">
          Pipeline
        </Badge>
        <h1 className="text-3xl font-semibold text-on-surface">Saved Leads</h1>
        <p className="max-w-2xl text-body-md text-on-surface-variant">
          Businesses you have pinned for follow-up. Mark an opportunity as &ldquo;saved&rdquo;
          from its report to add it here.
        </p>
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved leads yet"
          body="Open an opportunity and set its status to saved to bookmark it for later."
          ctaLabel="Browse opportunities"
          ctaHref="/dashboard/opportunities"
        />
      ) : (
        <div className="grid gap-gutter">
          {saved.map((row) => (
            <Card key={row.id}>
              <CardHeader className="flex flex-col gap-stack-sm md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{row.businesses?.name ?? "Unknown business"}</CardTitle>
                  <CardDescription>
                    {[row.businesses?.category, row.businesses?.city]
                      .filter(Boolean)
                      .join(" · ") || "Local business"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={priorityVariant(row.priority)}>{row.priority ?? "unscored"}</Badge>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                    {row.opportunity_score ?? 0}/100
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/dashboard/business/${row.business_id}`}
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

function priorityVariant(priority: SavedRow["priority"]) {
  if (priority === "urgent" || priority === "high") return "danger";
  if (priority === "medium") return "warning";
  if (priority === "low") return "neutral";
  return "neutral";
}
