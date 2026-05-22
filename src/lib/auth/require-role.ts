import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-user";
import type { AuthUser } from "@/types/domain";

/**
 * Server-Component / Server-Action guard helper.
 *
 * Resolves the current user and verifies their role. If the user is
 * unauthenticated OR holds a different role, redirects to a safe destination
 * (defense-in-depth — middleware should have already redirected, but pages
 * that bypass the matcher need to assert again).
 *
 * Throws via `redirect()` — callers do not need to handle the failure case.
 */
export async function requireRole(role: AuthUser["role"]): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== role) {
    // user trying to reach admin → /dashboard ; admin reaching user-only is
    // currently allowed (admins see everything). If we ever lock admins out
    // of user pages, change this branch.
    if (role === "admin") {
      redirect("/dashboard");
    }
    // For role === 'user' mismatch (admin accessing user-only), no redirect.
    return user;
  }

  return user;
}
