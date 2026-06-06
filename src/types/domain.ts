/**
 * Phase 1 — auth-only domain types.
 *
 * Cross-phase types (BusinessLead, OpportunityScore, SolutionType, etc.)
 * are introduced in Phase 2/3/4 — do NOT pre-define them here. Each phase
 * adds its own types in its own PLAN. Premature definition leads to drift
 * between the spec and the actual columns/AI outputs.
 */

export type AuthUser = {
  id: string;
  clerkUserId: string;
  email: string;
  role: "user" | "admin";
  credits: number;
  plan: "free" | "pro" | "agency";
  subscriptionCredits: number;
  topupCredits: number;
};

