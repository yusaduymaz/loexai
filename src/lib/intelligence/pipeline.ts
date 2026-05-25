import "server-only";

import { analyzeGaps } from "@/lib/intelligence/gap-analysis";
import { scoreOpportunity } from "@/lib/intelligence/scoring";
import { getIndustryExpectation } from "@/lib/intelligence/templates";
import { probeWebsite } from "@/lib/intelligence/website-probe";
import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database";

type RunArgs = {
  userId: string;
  businessId: string;
  scanJobId?: string | null;
  scanJobItemId?: string | null;
};

export async function runDeterministicIntelligenceForBusiness({
  userId,
  businessId,
  scanJobId,
  scanJobItemId,
}: RunArgs) {
  const supabase = await createClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .eq("user_id", userId)
    .single();

  if (businessError || !business) {
    throw businessError ?? new Error("Business not found");
  }

  await recordStageStart({ businessId, scanJobId, scanJobItemId, stage: "enrichment" });
  const probe = await probeWebsite(business.website);
  const enrichment = buildEnrichment(business, probe);

  const { data: enrichmentRow, error: enrichmentError } = await supabase
    .from("business_enrichments")
    .upsert(enrichment, { onConflict: "business_id" })
    .select("id")
    .single();

  if (enrichmentError) throw enrichmentError;
  await recordStageSuccess({
    businessId,
    scanJobId,
    scanJobItemId,
    stage: "enrichment",
    outputRef: `business_enrichments:${enrichmentRow.id}`,
    outputSummary: enrichment.enrichment_data,
  });

  await recordStageStart({ businessId, scanJobId, scanJobItemId, stage: "gap_analysis" });
  const expectation = getIndustryExpectation(business.category);
  const gapAnalysis = analyzeGaps({ business, expectation, probe });

  const { data: gapRow, error: gapError } = await supabase
    .from("gap_analyses")
    .upsert(
      {
        business_id: business.id,
        gaps: gapAnalysis.gaps as unknown as Json,
        severity_score: gapAnalysis.severityScore,
        summary: gapAnalysis.summary,
        template_version: gapAnalysis.templateVersion,
        analysis_version: gapAnalysis.analysisVersion,
        evidence: gapAnalysis.evidence,
        expectation_snapshot: gapAnalysis.expectationSnapshot,
      },
      { onConflict: "business_id" },
    )
    .select("id")
    .single();

  if (gapError) throw gapError;
  await recordStageSuccess({
    businessId,
    scanJobId,
    scanJobItemId,
    stage: "gap_analysis",
    outputRef: `gap_analyses:${gapRow.id}`,
    outputSummary: { severityScore: gapAnalysis.severityScore, gaps: gapAnalysis.gaps.length },
  });

  await recordStageStart({ businessId, scanJobId, scanJobItemId, stage: "scoring" });
  const score = scoreOpportunity({ business, gapAnalysis, probe });

  const { data: opportunityRow, error: opportunityError } = await supabase
    .from("opportunities")
    .upsert(
      {
        business_id: business.id,
        opportunity_score: score.score,
        priority: score.priority,
        close_probability: score.closeProbability,
        estimated_deal_value_min: score.estimatedDealValueMin,
        estimated_deal_value_max: score.estimatedDealValueMax,
        estimated_deal_value_currency: score.currency,
        reasoning: score.reasoning,
        scoring_formula_version: score.formulaVersion,
        score_breakdown: score.breakdown,
        scored_at: new Date().toISOString(),
        status: "analyzed",
      },
      { onConflict: "business_id" },
    )
    .select("id")
    .single();

  if (opportunityError) throw opportunityError;
  await recordStageSuccess({
    businessId,
    scanJobId,
    scanJobItemId,
    stage: "scoring",
    outputRef: `opportunities:${opportunityRow.id}`,
    outputSummary: { score: score.score, priority: score.priority },
  });

  if (scanJobItemId) {
    await supabase
      .from("scan_job_items")
      .update({ status: "completed" })
      .eq("id", scanJobItemId);
  }

  return {
    opportunityId: opportunityRow.id,
    score: score.score,
    priority: score.priority,
    gaps: gapAnalysis.gaps.length,
  };
}

function buildEnrichment(business: Tables<"businesses">, probe: Awaited<ReturnType<typeof probeWebsite>>) {
  const hasWebsite = Boolean(business.website && probe.status === "ok");
  const digitalMaturityScore = Math.min(
    100,
    [
      hasWebsite ? 25 : 0,
      probe.hasSsl ? 15 : 0,
      probe.hasViewportMeta ? 15 : 0,
      probe.hasContactSignal || business.phone ? 20 : 0,
      probe.hasBookingSignal ? 15 : 0,
      probe.hasSocialSignal || business.social_links ? 10 : 0,
    ].reduce((sum, value) => sum + value, 0),
  );

  return {
    business_id: business.id,
    has_website: hasWebsite,
    has_instagram: probe.hasSocialSignal,
    has_reservation_system: probe.hasBookingSignal,
    has_whatsapp_cta: probe.hasWhatsappSignal,
    mobile_experience: probe.hasViewportMeta ? "responsive_signal" : "unknown_or_weak",
    brand_quality: probe.title || probe.description ? "basic_metadata_present" : "unknown",
    digital_maturity_score: digitalMaturityScore,
    website_status: probe.status,
    enrichment_data: {
      probe,
      version: "enrichment-v1",
    } as Json,
  };
}

async function recordStageStart(args: {
  businessId: string;
  scanJobId?: string | null;
  scanJobItemId?: string | null;
  stage: Tables<"pipeline_stage_runs">["stage"];
}) {
  const supabase = await createClient();
  const attempt = await nextAttempt(args.businessId, args.stage);

  const { error } = await supabase.from("pipeline_stage_runs").insert({
    business_id: args.businessId,
    scan_job_id: args.scanJobId ?? null,
    scan_job_item_id: args.scanJobItemId ?? null,
    stage: args.stage,
    status: "running",
    attempt_number: attempt,
    started_at: new Date().toISOString(),
    idempotency_key: `${args.businessId}:${args.stage}:${attempt}`,
  });

  if (error) {
    logger.warn("Failed to record pipeline stage start", {
      businessId: args.businessId,
      stage: args.stage,
      error,
    });
  }
}

async function recordStageSuccess(args: {
  businessId: string;
  scanJobId?: string | null;
  scanJobItemId?: string | null;
  stage: Tables<"pipeline_stage_runs">["stage"];
  outputRef: string;
  outputSummary: Json;
}) {
  const supabase = await createClient();

  const { data: latest } = await supabase
    .from("pipeline_stage_runs")
    .select("id")
    .eq("business_id", args.businessId)
    .eq("stage", args.stage)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return;

  await supabase
    .from("pipeline_stage_runs")
    .update({
      status: "succeeded",
      output_ref: args.outputRef,
      output_summary: args.outputSummary,
      completed_at: new Date().toISOString(),
    })
    .eq("id", latest.id);
}

async function nextAttempt(businessId: string, stage: Tables<"pipeline_stage_runs">["stage"]) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pipeline_stage_runs")
    .select("attempt_number")
    .eq("business_id", businessId)
    .eq("stage", stage)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.attempt_number ?? 0) + 1;
}
