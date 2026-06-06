import { PageTransition } from "@/components/motion/PageTransition";

/**
 * Animates auth screens (login / register) on navigation between them.
 */
export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
