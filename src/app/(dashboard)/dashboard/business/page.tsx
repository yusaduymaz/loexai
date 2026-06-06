import Link from "next/link";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

type BusinessRow = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
};

async function loadBusinesses(): Promise<BusinessRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, category, city, website, rating, review_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export default async function BusinessReportsPage() {
  const businesses = await loadBusinesses();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-stack-lg">
      <div className="flex flex-col gap-stack-xs">
        <Badge variant="primary" className="w-fit">
          Reports
        </Badge>
        <h1 className="text-3xl font-semibold text-on-surface">Business Reports</h1>
        <p className="max-w-2xl text-body-md text-on-surface-variant">
          Every business discovered by your scans. Open one to see its full enrichment, gap,
          opportunity, and AI-generated sales assets.
        </p>
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No business reports yet"
          body="Run a discovery scan to populate your first batch of business reports."
          ctaLabel="Go to Discovery"
          ctaHref="/dashboard/discovery"
        />
      ) : (
        <div className="grid gap-gutter">
          {businesses.map((row) => (
            <Card key={row.id}>
              <CardHeader className="flex flex-col gap-stack-sm md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{row.name}</CardTitle>
                  <CardDescription>
                    {[row.category, row.city].filter(Boolean).join(" · ") || "Local business"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                  {row.rating != null ? (
                    <span>
                      ★ <strong className="text-on-surface">{row.rating.toFixed(1)}</strong>
                      {row.review_count != null ? ` (${row.review_count})` : null}
                    </span>
                  ) : null}
                  {row.website ? <Badge variant="success">website</Badge> : <Badge>no site</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/dashboard/business/${row.id}`}
                  className="w-fit text-body-sm font-medium text-primary hover:underline"
                >
                  Open report →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
