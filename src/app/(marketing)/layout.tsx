import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { MarketingNav } from "@/components/landing/MarketingNav";
import { getCurrentUser } from "@/lib/auth/get-user";

/**
 * Marketing route-group layout. Mounted at `/`, `/pricing`, etc.
 *
 * Resolves auth state on the server and passes a boolean to the (client) nav
 * so the CTAs can flip to "Dashboard / Log out" for signed-in visitors. This
 * avoids the hydration mismatch you'd get if the nav read auth itself.
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <MarketingNav authenticated={Boolean(user)} />
      <main className="flex-grow pt-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
