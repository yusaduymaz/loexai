/**
 * Plan-level limits — single source of truth.
 *
 * These constants back the locked decisions in
 * `.planning/credit-model-and-discovery-limits.md`:
 *   - Free tier: 3 scans / calendar month, max 10 leads / scan.
 *   - Scan itself is free (deterministic pipeline only). The AI pipeline
 *     (Phase 4) will introduce per-analysis credit costs.
 *
 * Plans (paid tiers) land in Phase 5 with Stripe. Until then every user is
 * treated as `free`; admins bypass the cap in the SQL RPC.
 *
 * Read this file from both server actions (cap enforcement) and server
 * components (UI labels) so the two never drift.
 */

export type PlanId = "free";

export interface PlanLimits {
  /** Discovery scans allowed per calendar month. Resets on the 1st. */
  monthlyScans: number;
  /** Max businesses returned per discovery scan. */
  maxLeadsPerScan: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    monthlyScans: 3,
    maxLeadsPerScan: 10,
  },
};

export const DEFAULT_PLAN: PlanId = "free";

export function getPlanLimits(plan: PlanId = DEFAULT_PLAN): PlanLimits {
  return PLAN_LIMITS[plan];
}

export interface ScanQuota {
  used: number;
  cap: number;
  remaining: number;
  /** ISO date string (YYYY-MM-DD) of the current period start. */
  periodStart: string;
}

/**
 * Read the user's scan quota for the current calendar month, applying the
 * lazy-reset logic the SQL RPC uses: if the stored period is older than the
 * current month, the count is treated as 0 (the DB will reset on next
 * reserve_scan_slot call).
 *
 * Server-only — relies on the admin client to bypass RLS for read.
 */
export async function getScanQuota(userId: string, plan: PlanId = DEFAULT_PLAN): Promise<ScanQuota> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("monthly_scan_count, scan_count_period_start")
    .eq("id", userId)
    .maybeSingle();

  const limits = getPlanLimits(plan);
  const cap = limits.monthlyScans;

  const now = new Date();
  const currentPeriodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  if (error || !data) {
    return { used: 0, cap, remaining: cap, periodStart: currentPeriodStart };
  }

  const storedPeriod = data.scan_count_period_start;
  const isStale = storedPeriod < currentPeriodStart;
  const used = isStale ? 0 : data.monthly_scan_count;

  return {
    used,
    cap,
    remaining: Math.max(cap - used, 0),
    periodStart: isStale ? currentPeriodStart : storedPeriod,
  };
}
