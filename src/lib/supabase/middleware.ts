import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/config/public";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Public routes that do NOT require auth. Anything not in this list under
 * the matcher in `middleware.ts` is treated as protected.
 *
 * `/logout` is public because it is the destination of a signed-out user
 * (and the route handler that performs `signOut` must run without being
 * pre-empted by an auth redirect). See PLAN-1C §logout/route.ts.
 */
const PUBLIC_PATHS: ReadonlyArray<string> = [
  "/",
  "/pricing",
  "/login",
  "/register",
  "/logout",
  "/api/health",
];

function isPublicPath(pathname: string): boolean {
  // exact match for top-level public pages
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // auth callback / OAuth / magic-link endpoints
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}

/**
 * Per-request session refresh + route guard.
 *
 * Called by the root `middleware.ts`. Returns a `NextResponse` whose cookies
 * carry the refreshed Supabase tokens (set via the `setAll` callback below).
 *
 * Auth model:
 *   - Use `getClaims()` (JWT validation) — NEVER `getSession()` (cookie-trust only).
 *   - Public routes pass through unconditionally.
 *   - Unauthenticated requests to protected routes redirect to `/login`.
 *   - Admin routes additionally check `public.users.role === 'admin'`.
 *     This DB round-trip is SHORT-CIRCUITED to `/admin/*` only (perf — see
 *     PLAN-1A Fix #2). Non-admin protected routes skip it.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, NEXT_PUBLIC_SUPABASE_URL: url } =
    getPublicEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }: CookieToSet) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const pathname = request.nextUrl.pathname;

  // Public routes — refresh cookies (so the user stays logged in if they
  // wander to a public page mid-session) but skip auth check entirely.
  if (isPublicPath(pathname)) {
    // Still call getClaims to refresh cookies opportunistically.
    await supabase.auth.getClaims();
    return supabaseResponse;
  }

  // Protected route: require valid JWT claims.
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims ?? null;

  if (!claims) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes: confirm role from DB.
  // Short-circuit: only fire the DB round-trip when the path is admin-prefixed.
  if (pathname.startsWith("/admin")) {
    const userId = claims.sub;
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashUrl);
    }
  }

  return supabaseResponse;
}
