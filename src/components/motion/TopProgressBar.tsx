"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Phase = "idle" | "loading" | "done";

/**
 * Global navigation progress bar. Dependency-free App Router implementation:
 *
 *  - START: a capture-phase click listener detects same-origin internal-link
 *    clicks (the moment a navigation is requested) and switches to `loading`.
 *  - FINISH: a `usePathname` effect completes the bar once the new route has
 *    committed.
 *
 * We intentionally avoid `useSearchParams` here — reading it in the root layout
 * would opt the whole tree into client rendering. A safety timeout completes
 * the bar for the rare same-pathname navigation that never resolves.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const safetyTimer = useRef<ReturnType<typeof setTimeout>>();
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  // START — intercept internal link clicks.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || !href) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      try {
        const next = new URL(href, window.location.href);
        if (next.origin !== window.location.origin) return;
        // Same URL (incl. pure hash change) → no navigation, no bar.
        if (
          next.pathname === window.location.pathname &&
          next.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }

      setPhase("loading");
    };

    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // FINISH — the new route has committed.
  useEffect(() => {
    setPhase((current) => (current === "loading" ? "done" : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Phase side effects: safety auto-finish + reset-to-idle after the bar fills.
  useEffect(() => {
    clearTimeout(safetyTimer.current);
    clearTimeout(resetTimer.current);

    if (phase === "loading") {
      safetyTimer.current = setTimeout(() => setPhase("done"), 8000);
    } else if (phase === "done") {
      resetTimer.current = setTimeout(() => setPhase("idle"), 400);
    }

    return () => {
      clearTimeout(safetyTimer.current);
      clearTimeout(resetTimer.current);
    };
  }, [phase]);

  const width = phase === "idle" ? 0 : phase === "loading" ? 90 : 100;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary shadow-[0_0_10px_rgba(179,197,255,0.7)]"
        style={{
          width: `${width}%`,
          opacity: phase === "loading" ? 1 : 0,
          transitionProperty: "width, opacity",
          transitionDuration: phase === "loading" ? "8000ms, 200ms" : "200ms, 300ms",
          transitionTimingFunction: "cubic-bezier(0.1, 0.7, 0.1, 1), ease",
        }}
      />
    </div>
  );
}
