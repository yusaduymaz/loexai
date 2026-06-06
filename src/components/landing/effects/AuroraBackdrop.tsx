import { cn } from "@/lib/utils";

/**
 * Layered aurora / orb backdrop. Drop into a `relative overflow-hidden`
 * parent — it pins to `inset-0` and stays decorative (aria-hidden).
 *
 * The look:
 *  - One large electric-blue orb top-left
 *  - One cyan orb mid-right
 *  - A soft cool sweep across the bottom
 *  - A grid / dot pattern overlay (handled separately via DotPattern)
 *
 * Animation is GPU-only (translate / scale / opacity) so it stays cheap.
 */
export function AuroraBackdrop({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "soft" | "hero";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* Base gradient floor — slightly darker than the section bg, gives the
          orbs something to sit on. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#041427_0%,#03101f_55%,#020c19_100%)]" />

      {/* Top-left electric-blue orb. */}
      <div
        className={cn(
          "absolute -left-[10%] -top-[20%] h-[55vw] w-[55vw] rounded-full blur-[120px] animate-aurora-drift",
          variant === "soft" ? "opacity-30" : "opacity-55",
        )}
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,102,255,0.55) 0%, rgba(0,102,255,0.15) 35%, transparent 70%)",
        }}
      />

      {/* Mid-right cyan orb. */}
      <div
        className={cn(
          "absolute right-[-15%] top-[20%] h-[48vw] w-[48vw] rounded-full blur-[140px] animate-aurora-drift",
          variant === "soft" ? "opacity-25" : "opacity-50",
        )}
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,217,255,0.45) 0%, rgba(0,217,255,0.10) 40%, transparent 70%)",
          animationDelay: "-4s",
        }}
      />

      {/* Bottom-center warm-cool wash. */}
      {variant === "hero" ? (
        <div
          className="absolute inset-x-0 bottom-[-25%] h-[60vw] opacity-40 blur-[110px] animate-aurora-drift"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(179,197,255,0.4) 0%, transparent 60%)",
            animationDelay: "-8s",
          }}
        />
      ) : null}

      {/* Vignette so edges feel intentional. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,12,25,0.7)_100%)]" />
    </div>
  );
}
