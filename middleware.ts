import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root middleware — single auth + role gate (CONTEXT D-02).
 *
 * Delegates to `lib/supabase/middleware.ts:updateSession`, which:
 *   1. Refreshes the Supabase session cookies on every request.
 *   2. Redirects unauthenticated requests to `/login` (with `next=...`).
 *   3. Redirects non-admin users away from `/admin/*` to `/dashboard`.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  /**
   * Match everything EXCEPT:
   *   - Next.js internal assets (`_next/static`, `_next/image`)
   *   - favicons
   *   - common static file extensions (svg/png/jpg/jpeg/gif/webp)
   *
   * Keep this in sync with the `PUBLIC_PATHS` allowlist inside
   * `lib/supabase/middleware.ts` — the matcher decides which requests reach
   * the middleware; `PUBLIC_PATHS` decides which of those skip auth.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
