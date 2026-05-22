import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireRole } from "@/lib/auth/require-role";

/**
 * (admin) route-group layout — Server Component.
 *
 * Defense-in-depth admin gate. Middleware (PLAN-1A) already short-circuits
 * non-admin requests to /dashboard by reading `public.users.role`. This
 * layout re-asserts via `requireRole('admin')` so a future matcher change
 * cannot leak admin pages.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");

  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen">
            <AdminSidebar />
          </div>
        </div>
        <div className="flex min-h-screen flex-col">
          <AdminHeader user={user} />
          <main className="flex-grow px-margin-mobile md:px-margin-desktop py-stack-lg">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
