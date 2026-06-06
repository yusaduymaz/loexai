import { cn } from "@/lib/utils";

/**
 * SVG dot grid background — lighter & crisper than CSS-radial-gradient
 * patterns. Inspired by MagicUI / Vercel's pricing page texture.
 */
export function DotPattern({
  className,
  size = 22,
  dotSize = 1,
  opacity = 0.14,
}: {
  className?: string;
  size?: number;
  dotSize?: number;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="dot-pattern"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={size / 2} cy={size / 2} r={dotSize} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-pattern)" />
    </svg>
  );
}
