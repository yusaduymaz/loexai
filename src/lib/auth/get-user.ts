import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthUser } from "@/types/domain";

/**
 * Clerk is the auth source of truth. public.users is the app profile row used
 * by domain tables through a stable UUID FK.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  const admin = createAdminClient();
  const existing = await admin
    .from("users")
    .select("id, clerk_user_id, email, role, credits")
    .eq("clerk_user_id", clerkUser.id)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  let profile = existing.data;

  if (!profile) {
    const byEmail = await admin
      .from("users")
      .select("id, clerk_user_id, email, role, credits")
      .eq("email", email)
      .maybeSingle();

    if (byEmail.error) {
      throw byEmail.error;
    }

    if (byEmail.data) {
      const updated = await admin
        .from("users")
        .update({ clerk_user_id: clerkUser.id, email })
        .eq("id", byEmail.data.id)
        .select("id, clerk_user_id, email, role, credits")
        .single();

      if (updated.error) throw updated.error;
      profile = updated.data;
    }
  }

  if (!profile) {
    const inserted = await admin
      .from("users")
      .insert({
        clerk_user_id: clerkUser.id,
        email,
        role: "user",
        credits: 20,
      })
      .select("id, clerk_user_id, email, role, credits")
      .single();

    if (inserted.error) throw inserted.error;
    profile = inserted.data;
  }

  return {
    id: profile.id,
    clerkUserId: clerkUser.id,
    email: profile.email,
    role: profile.role === "admin" ? "admin" : "user",
    credits: typeof profile.credits === "number" ? profile.credits : 0,
  };
}
