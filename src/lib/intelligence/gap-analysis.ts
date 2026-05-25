import "server-only";

import type { Gap, GapAnalysisResult, IndustryExpectation, WebsiteProbe } from "@/lib/intelligence/types";
import type { Json, Tables } from "@/types/database";

const ANALYSIS_VERSION = "gap-v1";

export function analyzeGaps({
  business,
  expectation,
  probe,
}: {
  business: Tables<"businesses">;
  expectation: IndustryExpectation;
  probe: WebsiteProbe;
}): GapAnalysisResult {
  const gaps: Gap[] = [];

  if (expectation.expectedSignals.includes("website") && !business.website) {
    gaps.push({
      key: "missing_website",
      label: "No website found",
      severity: "high",
      observed: "Provider data did not include a website.",
      recommendation: "Offer a conversion-focused landing page with contact tracking.",
    });
  }

  if (business.website && probe.status !== "ok") {
    gaps.push({
      key: "website_unreachable",
      label: "Website not reliably reachable",
      severity: probe.status === "timeout" ? "medium" : "high",
      observed: `Website probe status was ${probe.status}.`,
      recommendation: "Audit hosting, DNS, SSL, and page availability.",
    });
  }

  if (expectation.expectedSignals.includes("mobile") && probe.status === "ok" && !probe.hasViewportMeta) {
    gaps.push({
      key: "mobile_viewport_missing",
      label: "Weak mobile readiness signal",
      severity: "medium",
      observed: "The homepage did not expose a viewport meta tag.",
      recommendation: "Modernize the site layout for mobile-first visitors.",
    });
  }

  if (expectation.expectedSignals.includes("contact") && !probe.hasContactSignal && !business.phone) {
    gaps.push({
      key: "contact_path_weak",
      label: "Weak contact path",
      severity: "high",
      observed: "No phone number or contact signal was detected.",
      recommendation: "Add prominent click-to-call and contact form CTAs.",
    });
  }

  if (expectation.expectedSignals.includes("booking") && !probe.hasBookingSignal) {
    gaps.push({
      key: "booking_missing",
      label: "No booking flow detected",
      severity: "medium",
      observed: "No booking, reservation, appointment, or randevu signal was detected.",
      recommendation: "Add an appointment or reservation flow tied to the primary CTA.",
    });
  }

  if (expectation.expectedSignals.includes("whatsapp") && !probe.hasWhatsappSignal) {
    gaps.push({
      key: "whatsapp_missing",
      label: "No WhatsApp CTA detected",
      severity: "low",
      observed: "No WhatsApp link was detected on the homepage.",
      recommendation: "Add a WhatsApp CTA for faster local lead capture.",
    });
  }

  if (expectation.expectedSignals.includes("social") && !probe.hasSocialSignal && !business.social_links) {
    gaps.push({
      key: "social_proof_missing",
      label: "Social proof not visible",
      severity: "low",
      observed: "No social profile signal was detected.",
      recommendation: "Expose Instagram/Facebook proof near the primary CTA.",
    });
  }

  const severityScore = Math.min(
    100,
    gaps.reduce((score, gap) => score + severityWeight(gap.severity), 0),
  );

  return {
    templateVersion: expectation.templateVersion,
    analysisVersion: ANALYSIS_VERSION,
    gaps,
    severityScore,
    summary: summarize(gaps),
    evidence: [
      ...probe.evidence,
      {
        type: "industry_expectation",
        templateVersion: expectation.templateVersion,
        expectedSignals: expectation.expectedSignals,
      },
    ] as Json[],
    expectationSnapshot: expectation as unknown as Json,
  };
}

function severityWeight(severity: Gap["severity"]) {
  if (severity === "high") return 25;
  if (severity === "medium") return 15;
  return 8;
}

function summarize(gaps: Gap[]) {
  if (gaps.length === 0) {
    return "No major deterministic digital gaps were detected from available public signals.";
  }

  const severe = gaps.filter((gap) => gap.severity === "high").length;
  return `${gaps.length} deterministic gaps detected, including ${severe} high-severity issue(s).`;
}
