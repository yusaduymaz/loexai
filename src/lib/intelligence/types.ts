import type { Json } from "@/types/database";

export type WebsiteProbe = {
  status: "ok" | "blocked" | "timeout" | "fetch_failed" | "unknown";
  finalUrl: string | null;
  statusCode: number | null;
  hasSsl: boolean | null;
  title: string | null;
  description: string | null;
  hasViewportMeta: boolean;
  hasContactSignal: boolean;
  hasBookingSignal: boolean;
  hasWhatsappSignal: boolean;
  hasSocialSignal: boolean;
  responseTimeMs: number | null;
  evidence: Json[];
};

export type Gap = {
  key: string;
  label: string;
  severity: "low" | "medium" | "high";
  observed: string;
  recommendation: string;
};

export type IndustryExpectation = {
  templateVersion: string;
  category: string;
  expectedSignals: Array<"website" | "mobile" | "contact" | "booking" | "whatsapp" | "social">;
};

export type GapAnalysisResult = {
  templateVersion: string;
  analysisVersion: string;
  gaps: Gap[];
  severityScore: number;
  summary: string;
  evidence: Json[];
  expectationSnapshot: Json;
};

export type ScoreResult = {
  formulaVersion: string;
  score: number;
  priority: "low" | "medium" | "high" | "urgent";
  closeProbability: number;
  estimatedDealValueMin: number;
  estimatedDealValueMax: number;
  currency: "USD" | "EUR" | "TRY";
  reasoning: string;
  breakdown: Json;
};
