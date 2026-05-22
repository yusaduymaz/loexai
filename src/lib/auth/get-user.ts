import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AuthUser } from "@/types/domain";

/**
 * Resolve the currently authenticated user with their `role` and `credits`.
 *
 * Returns `null` if the request is unauthenticated OR the corresponding
 * `public.users` row is missing (which would indicate a broken trigger —
 * see PLAN-1A migration). Callers MUST handle the null case.
 *
 * Implementation:
 *   1. `supabase.auth.getClaims()` validates the JWT (never `getSession()`).
 *   2. RLS-bound SELECT on `public.users` reads the row matching `auth.uid()`.
 *      The SELECT policy (`auth.uid() = id`) gates this — see migration.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    return null;
  }

  const claims = claimsData.claims;
  const userId = claims.sub;
  const email = typeof claims.email === "string" ? claims.email : null;

  if (!userId || !email) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, credits")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    // Trigger should have created the row on auth.users insert. Missing row
    // = broken trigger or RLS misconfig. Treat as unauthenticated to fail safe.
    return null;
  }

  const role: AuthUser["role"] = profile.role === "admin" ? "admin" : "user";
  const credits = typeof profile.credits === "number" ? profile.credits : 0;

  return {
    id: userId,
    email,
    role,
    credits,
  };
}
