import { cn } from "@/lib/utils";

/**
 * Animated shimmer text — relies on the `.text-gradient-shimmer` utility
 * defined in globals.css. Single-element wrapper so it's safe inside any
 * heading or inline context.
 */
export function AnimatedShinyText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-block text-gradient-shimmer", className)}>
      {children}
    </span>
  );
}
