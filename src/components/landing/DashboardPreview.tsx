"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Radar, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/**
 * D-05: Animated dashboard preview.
 *
 * "Live intelligence feed" — left column streams fake scan rows with score
 * counters, right column reveals a detail card for the highest-scoring
 * business. Cycle resets every ~8 seconds.
 *
 * Reduced-motion users see a static final-state snapshot with all rows
 * scored and the detail card already visible.
 */

type ScanRow = {
  name: string;
  category: string;
  score: number;
};

const SAMPLE_BUSINESSES: ScanRow[] = [
  { name: "Klinik Beyaz", category: "Dental", score: 87 },
  { name: "Cafe Mavi", category: "Cafe", score: 64 },
  { name: "Berber Yusuf", category: "Barber", score: 71 },
  { name: "Pastane Lila", category: "Bakery", score: 52 },
  { name: "Studio Form", category: "Fitness", score: 78 },
];

const ROW_INTERVAL_MS = 900;
const DETAIL_HOLD_MS = 2400;

export function DashboardPreview() {
  const reduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (reduceMotion) {
      setRevealedCount(SAMPLE_BUSINESSES.length);
      setShowDetail(true);
      return;
    }

    let timeouts: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    function runCycle() {
      if (cancelled) return;
      setRevealedCount(0);
      setShowDetail(false);

      SAMPLE_BUSINESSES.forEach((_, idx) => {
        const t = setTimeout(
          () => {
            if (!cancelled) setRevealedCount(idx + 1);
          },
          ROW_INTERVAL_MS * (idx + 1),
        );
        timeouts.push(t);
      });

      const detailT = setTimeout(
        () => {
          if (!cancelled) setShowDetail(true);
        },
        ROW_INTERVAL_MS * (SAMPLE_BUSINESSES.length + 1),
      );
      timeouts.push(detailT);

      const resetT = setTimeout(
        () => {
          if (!cancelled) runCycle();
        },
        ROW_INTERVAL_MS * (SAMPLE_BUSINESSES.length + 1) + DETAIL_HOLD_MS,
      );
      timeouts.push(resetT);
    }

    runCycle();

    return () => {
      cancelled = true;
      timeouts.forEach((t) => clearTimeout(t));
      timeouts = [];
    };
  }, [isMounted, reduceMotion]);

  const highlightedRow = useMemo(
    () =>
      SAMPLE_BUSINESSES.reduce((best, row) =>
        row.score > best.score ? row : best,
      ),
    [],
  );

  return (
    <section className="relative z-20 px-margin-mobile py-stack-xl md:px-margin-desktop md:py-24">
      <div className="mx-auto max-w-container-max">
        <div className="mb-stack-xl text-center">
          <p className="mb-stack-sm font-label-caps text-label-caps uppercase tracking-widest text-secondary">
            Live intelligence feed
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            Watch a scan turn into a closeable opportunity.
          </h2>
        </div>

        <div
          aria-hidden="true"
          className="relative mx-auto grid max-w-5xl grid-cols-1 gap-stack-md rounded-xl border border-outline-variant/30 bg-surface-container p-stack-lg shadow-ambient md:grid-cols-5"
          style={{ willChange: "transform" }}
        >
          {/* Left: streaming scan rows */}
          <div className="flex flex-col gap-stack-md md:col-span-3">
            <div className="flex items-center gap-stack-sm rounded-lg border border-outline-variant/30 bg-surface-container-low px-stack-md py-stack-sm">
              <Search className="h-4 w-4 text-secondary" aria-hidden="true" />
              <span className="font-data-mono text-body-sm text-on-surface">
                dentists in Istanbul, 2km
              </span>
              <span className="ml-auto inline-flex items-center gap-1 font-label-caps text-label-caps uppercase tracking-widest text-secondary">
                <Radar className="h-3 w-3" aria-hidden="true" />
                Scanning
              </span>
            </div>

            <ul className="flex flex-col gap-stack-sm">
              {SAMPLE_BUSINESSES.map((biz, idx) => {
                const isRevealed = idx < revealedCount;
                const isActive = !showDetail && idx === revealedCount - 1;
                return (
                  <li
                    key={biz.name}
                    className={`flex items-center justify-between rounded-lg border px-stack-md py-stack-sm transition-all duration-300 ${
                      isRevealed
                        ? "border-outline-variant/40 bg-surface-container-low opacity-100"
                        : "border-outline-variant/20 bg-surface-container-low/30 opacity-40"
                    } ${
                      isActive
                        ? "shadow-[0_0_24px_rgba(0,217,255,0.35)] border-secondary/50"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-body-sm font-medium text-on-surface">
                        {biz.name}
                      </span>
                      <span className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">
                        {biz.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-stack-sm">
                      {isRevealed ? (
                        <ScoreCounter target={biz.score} active={isActive} />
                      ) : (
                        <span className="font-data-mono text-body-sm text-on-surface-variant">
                          Analyzing…
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: detail card */}
          <div className="relative flex flex-col gap-stack-md rounded-lg border border-outline-variant/40 bg-surface-container-low p-stack-md md:col-span-2">
            <AnimatePresence>
              {showDetail ? (
                <motion.div
                  key="detail"
                  initial={
                    reduceMotion ? false : { opacity: 0, y: 12 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-stack-md"
                >
                  <div className="flex items-start justify-between gap-stack-sm">
                    <div>
                      <p className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">
                        Top opportunity
                      </p>
                      <h3 className="font-title-md text-title-md text-on-surface">
                        {highlightedRow.name}
                      </h3>
                    </div>
                    <Badge variant="warning">HIGH</Badge>
                  </div>

                  <div>
                    <p className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">
                      Opportunity score
                    </p>
                    <p className="font-data-mono text-5xl font-medium text-on-surface">
                      {highlightedRow.score}
                    </p>
                  </div>

                  <ul className="flex flex-col gap-stack-xs">
                    {[
                      "No website",
                      "No online booking",
                      "Weak local SEO",
                    ].map((gap) => (
                      <li
                        key={gap}
                        className="flex items-center gap-stack-sm text-body-sm text-on-surface-variant"
                      >
                        <Check
                          className="h-4 w-4 text-secondary"
                          aria-hidden="true"
                        />
                        {gap}
                      </li>
                    ))}
                  </ul>

                  <div className="rounded-lg border border-outline-variant/30 bg-surface-container px-stack-md py-stack-sm">
                    <p className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">
                      Recommended
                    </p>
                    <p className="text-body-sm text-on-surface">
                      Business website + booking system
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[280px] items-center justify-center text-center"
                >
                  <p className="text-body-sm text-on-surface-variant">
                    Waiting for highest-scoring lead…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreCounter({
  target,
  active,
}: {
  target: number;
  active: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState<number>(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(target);
      return;
    }
    let frame = 0;
    const steps = 18;
    const interval = setInterval(() => {
      frame += 1;
      const next = Math.round((target * frame) / steps);
      setValue(next >= target ? target : next);
      if (frame >= steps) clearInterval(interval);
    }, 24);
    return () => clearInterval(interval);
  }, [target, reduceMotion]);

  return (
    <span
      className={`font-data-mono text-body-sm font-medium tabular-nums ${
        active ? "text-secondary" : "text-on-surface"
      }`}
    >
      {value}
    </span>
  );
}
