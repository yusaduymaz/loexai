import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/config/public";
import { requireEnvGroup } from "@/lib/config/server";

/**
 * Service-role Supabase client.
 *
 * BINDING RULES (PITFALL §RLS-2):
 *   1. `import "server-only"` is mandatory and lives on the first line so that
 *      any accidental client-side import becomes a Next.js BUILD error, not a
 *      runtime data leak.
 *   2. NEVER import this from a Client Component, hook, or `components/`
 *      file. Only from server actions, route handlers, and other `lib/`
 *      modules that are themselves `server-only`.
 *   3. The key MUST come from `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_`
 *      prefix). Any leak into a public env var is treated as a credential
 *      compromise.
 *
 * Use this client only when you NEED to bypass RLS (e.g. cross-user admin
 * reads, system-level inserts). For per-user reads, use `createClient` from
 * `./server.ts` instead — it respects RLS.
 */
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL: url } = getPublicEnv();
  const { SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } = requireEnvGroup(
    "supabaseAdmin",
  );

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
