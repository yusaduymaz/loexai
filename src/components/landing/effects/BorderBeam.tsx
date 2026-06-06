"use client";

import { cn } from "@/lib/utils";

/**
 * MagicUI-inspired rotating gradient border (BorderBeam).
 *
 * Drop into a `relative overflow-hidden rounded-*` parent. We render a
 * conic-gradient that fills the parent, then use the classic
 * `mask-composite: exclude` trick to hide everything except a thin ring of
 * `thickness` pixels around the perimeter. CSS animation rotates the
 * gradient — the beam appears to travel around the edge.
 *
 * Pure CSS, no JS, no layout thrash. Safe to stack with other absolute
 * decorations; sits below content via implicit DOM order — render this
 * BEFORE your card's inner content.
 */
export function BorderBeam({
  className,
  duration = 12,
  thickness = 1,
  colorFrom = "#aeecff",
  colorTo = "#b3c5ff",
}: {
  className?: string;
  duration?: number;
  thickness?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        className,
      )}
      style={{
        padding: `${thickness}px`,
        background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${colorFrom} 60deg, ${colorTo} 90deg, transparent 150deg, transparent 360deg)`,
        WebkitMask:
          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: `spin-slow ${duration}s linear infinite`,
      }}
    />
  );
}
