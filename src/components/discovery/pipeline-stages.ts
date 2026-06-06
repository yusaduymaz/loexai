export const PIPELINE_STAGES = [
  {
    key: "discovery",
    label: "Discovery",
    description: "Provider search + dedup",
    deterministic: true,
  },
  {
    key: "enrichment",
    label: "Enrichment",
    description: "Website probe + signals",
    deterministic: true,
  },
  {
    key: "gap_analysis",
    label: "Gap analysis",
    description: "Industry template diff",
    deterministic: true,
  },
  {
    key: "scoring",
    label: "Scoring",
    description: "Opportunity score",
    deterministic: true,
  },
  {
    key: "solution_recommendation",
    label: "Solution",
    description: "AI offer mapping",
    deterministic: false,
  },
  {
    key: "sales_strategy",
    label: "Sales",
    description: "Pitch + outreach assets",
    deterministic: false,
  },
  {
    key: "build_prompt",
    label: "Build prompt",
    description: "Implementation brief",
    deterministic: false,
  },
  {
    key: "qa",
    label: "QA",
    description: "Hallucination guard",
    deterministic: false,
  },
] as const;

export type PipelineStageKey = (typeof PIPELINE_STAGES)[number]["key"];

export function isPipelineStageKey(value: string): value is PipelineStageKey {
  return PIPELINE_STAGES.some((s) => s.key === value);
}
