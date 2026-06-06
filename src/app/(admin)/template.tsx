import { PageTransition } from "@/components/motion/PageTransition";

/**
 * Re-mounts on every admin navigation, animating only the page content while
 * the admin sidebar and header (in `layout.tsx`) stay mounted across tabs.
 */
export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
