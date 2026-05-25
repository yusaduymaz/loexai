import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

type PageProps = {
  params: {
    id: string;
  };
};

type GapPayload = Array<{
  key: string;
  label: string;
  severity: "low" | "medium" | "high";
  observed: string;
  recommendation: string;
}>;

export default async function BusinessReportPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!business) notFound();

  const [{ data: enrichment }, { data: gapAnalysis }, { data: opportunity }] =
    await Promise.all([
      supabase.from("business_enrichments").select("*").eq("business_id", business.id).maybeSingle(),
      supabase.from("gap_analyses").select("*").eq("business_id", business.id).maybeSingle(),
      supabase.from("opportunities").select("*").eq("business_id", business.id).maybeSingle(),
    ]);

  const gaps = parseGaps(gapAnalysis?.gaps);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-stack-lg">
      <div className="flex flex-col gap-stack-sm md:flex-row md:items-start md:justify-between">
        <div>
          <Badge variant="primary" className="mb-3 w-fit">
            Deterministic Report
          </Badge>
          <h1 className="text-3xl font-semibold text-on-surface">{business.name}</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {[business.category, business.city, business.country].filter(Boolean).join(" · ")}
          </p>
        </div>
        {business.website ? (
          <a
            href={business.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-body-sm text-on-surface hover:border-primary hover:text-primary"
          >
            Website <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <div className="grid gap-gutter md:grid-cols-3">
        <MetricCard title="Opportunity Score" value={`${opportunity?.opportunity_score ?? 0}/100`} />
        <MetricCard title="Priority" value={opportunity?.priority ?? "unscored"} />
        <MetricCard
          title="Digital Maturity"
          value={`${enrichment?.digital_maturity_score ?? 0}/100`}
        />
      </div>

      <div className="grid gap-gutter lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Observed Signals</CardTitle>
            <CardDescription>Facts gathered without AI inference.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-body-sm">
            <Signal label="Website status" value={enrichment?.website_status ?? "unknown"} />
            <Signal label="Has website" value={yesNo(enrichment?.has_website)} />
            <Signal label="Booking signal" value={yesNo(enrichment?.has_reservation_system)} />
            <Signal label="WhatsApp CTA" value={yesNo(enrichment?.has_whatsapp_cta)} />
            <Signal label="Social signal" value={yesNo(enrichment?.has_instagram)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opportunity Reasoning</CardTitle>
            <CardDescription>
              Formula: {opportunity?.scoring_formula_version ?? "not scored"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-on-surface-variant">
              {opportunity?.reasoning ?? "Run deterministic analysis from Discovery to score this lead."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detected Gaps</CardTitle>
          <CardDescription>
            Template: {gapAnalysis?.template_version ?? "not analyzed"} · Severity{" "}
            {gapAnalysis?.severity_score ?? 0}/100
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gaps.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              No deterministic gaps recorded yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {gaps.map((gap) => (
                <div
                  key={gap.key}
                  className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-medium text-on-surface">{gap.label}</h3>
                    <Badge variant={gap.severity === "high" ? "danger" : "warning"}>
                      {gap.severity}
                    </Badge>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">{gap.observed}</p>
                  <p className="mt-2 text-body-sm text-primary">{gap.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}

function yesNo(value: boolean | null | undefined) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
}

function parseGaps(value: Json | undefined): GapPayload {
  return Array.isArray(value) ? (value as unknown as GapPayload) : [];
}
