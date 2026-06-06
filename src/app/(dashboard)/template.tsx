import { PageTransition } from "@/components/motion/PageTransition";

/**
 * Re-mounts on every dashboard navigation, animating only the page content.
 * The sidebar and header live in `layout.tsx`, so they stay put across tabs.
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
