import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * POST /logout
 *
 * Sign the current user out and redirect to /login. Invoked via an HTML form
 * (so it is prefetch-safe — Next.js won't issue a speculative POST). GET is
 * not supported on purpose: logging out should be an explicit action.
 *
 * The /logout path is included in the middleware public-route allowlist
 * (see lib/supabase/middleware.ts) so signOut can run without being
 * preempted by the auth redirect.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), 303);
}
