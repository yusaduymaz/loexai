import { PageTransition } from "@/components/motion/PageTransition";

/**
 * Animates marketing page content on each navigation. The nav and footer live
 * in `layout.tsx` and stay mounted.
 */
export default function MarketingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
