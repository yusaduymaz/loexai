import "server-only";

import type { IndustryExpectation } from "@/lib/intelligence/types";

export const TEMPLATE_VERSION = "industry-template-v1";

export const DEFAULT_SIGNALS: IndustryExpectation["expectedSignals"] = [
  "website",
  "mobile",
  "contact",
  "social",
];

export const CATEGORY_SIGNAL_MAP: Record<string, IndustryExpectation["expectedSignals"]> = {
  restaurant: ["website", "mobile", "contact", "booking", "whatsapp", "social"],
  restaurants: ["website", "mobile", "contact", "booking", "whatsapp", "social"],
  cafe: ["website", "mobile", "contact", "social"],
  dentist: ["website", "mobile", "contact", "booking"],
  dentists: ["website", "mobile", "contact", "booking"],
  gym: ["website", "mobile", "contact", "booking", "social"],
  gyms: ["website", "mobile", "contact", "booking", "social"],
  salon: ["website", "mobile", "contact", "booking", "social"],
  spa: ["website", "mobile", "contact", "booking", "social"],
  clinic: ["website", "mobile", "contact", "booking"],
};

export function getIndustryExpectation(category: string | null): IndustryExpectation {
  const normalized = (category ?? "").toLowerCase().trim();
  const key = Object.keys(CATEGORY_SIGNAL_MAP).find((candidate) =>
    normalized.includes(candidate),
  );
  const expectedSignals = key ? CATEGORY_SIGNAL_MAP[key] : DEFAULT_SIGNALS;

  return {
    templateVersion: TEMPLATE_VERSION,
    category: category || "general-local-business",
    expectedSignals: expectedSignals ?? DEFAULT_SIGNALS,
  };
}
