import "server-only";

import type { GapAnalysisResult, ScoreResult, WebsiteProbe } from "@/lib/intelligence/types";
import type { Tables } from "@/types/database";

const FORMULA_VERSION = "opportunity-score-v1";

export function scoreOpportunity({
  business,
  gapAnalysis,
  probe,
}: {
  business: Tables<"businesses">;
  gapAnalysis: GapAnalysisResult;
  probe: WebsiteProbe;
}): ScoreResult {
  const reviewSignal = Math.min(20, Math.round((business.review_count ?? 0) / 10));
  const ratingSignal = business.rating ? Math.max(0, Math.round((5 - business.rating) * 6)) : 8;
  const gapSignal = Math.min(45, Math.round(gapAnalysis.severityScore * 0.45));
  const reachabilitySignal = probe.status === "ok" ? 0 : 12;
  const contactSignal = probe.hasContactSignal || business.phone ? 0 : 10;
  const score = clamp(reviewSignal + ratingSignal + gapSignal + reachabilitySignal + contactSignal);
  const priority = priorityForScore(score);
  const closeProbability = Number((0.12 + score / 200).toFixed(3));
  const baseDeal = dealBaseForCategory(business.category);

  return {
    formulaVersion: FORMULA_VERSION,
    score,
    priority,
    closeProbability,
    estimatedDealValueMin: Math.round(baseDeal * (0.7 + score / 250)),
    estimatedDealValueMax: Math.round(baseDeal * (1.2 + score / 160)),
    currency: "USD",
    reasoning:
      `Score ${score}/100 from deterministic signals: ` +
      `${gapAnalysis.gaps.length} gaps, ${business.review_count ?? 0} reviews, ` +
      `website status ${probe.status}.`,
    breakdown: {
      formulaVersion: FORMULA_VERSION,
      reviewSignal,
      ratingSignal,
      gapSignal,
      reachabilitySignal,
      contactSignal,
      inputs: {
        gapSeverityScore: gapAnalysis.severityScore,
        rating: business.rating,
        reviewCount: business.review_count,
        websiteStatus: probe.status,
      },
    },
  };
}

function priorityForScore(score: number): ScoreResult["priority"] {
  if (score >= 80) return "urgent";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function dealBaseForCategory(category: string | null) {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("dent") || normalized.includes("clinic")) return 3500;
  if (normalized.includes("restaurant") || normalized.includes("cafe")) return 2500;
  if (normalized.includes("gym") || normalized.includes("salon") || normalized.includes("spa")) return 2200;
  return 1800;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
