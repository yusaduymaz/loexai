import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side database client.
 *
 * Clerk owns authentication, so Supabase no longer has a per-request JWT/RLS
 * session. Server routes/actions use the service-role client and must apply
 * explicit `user_id = currentProfile.id` filters for user-facing reads/writes.
 */
export async function createClient() {
  return createAdminClient();
}
