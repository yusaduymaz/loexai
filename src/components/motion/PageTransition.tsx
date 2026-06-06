"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Wraps page content in an enter animation. Mounted via each route group's
 * `template.tsx`, so it re-runs on every navigation while the surrounding
 * layout (sidebar, header, nav, footer) stays mounted and static.
 *
 * Respects `prefers-reduced-motion`: when set, the vertical offset and easing
 * collapse to a near-instant fade so motion-sensitive users aren't affected.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0.15 : 0.34,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
