"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Radar, Search } from "lucide-react";

import { DotPattern } from "./effects/DotPattern";
import { BorderBeam } from "./effects/BorderBeam";

type ScanRow = {
  name: string;
  category: string;
  score: number;
  gap: string;
};

const SAMPLE_BUSINESSES: ScanRow[] = [
  { name: "Klinik Beyaz", category: "Dental", score: 87, gap: "No booking flow" },
  { name: "Cafe Mavi", category: "Cafe", score: 64, gap: "Weak mobile UX" },
  { name: "Studio Form", category: "Fitness", score: 78, gap: "Missing class funnel" },
  { name: "Berber Yusuf", category: "Barber", score: 71, gap: "No review strategy" },
  { name: "Pastane Lila", category: "Bakery", score: 52, gap: "No service landing page" },
];

const ROW_INTERVAL_MS = 900;
const DETAIL_HOLD_MS = 2400;

function scoreTone(score: number) {
  if (score >= 80) return "from-secondary to-secondary-container";
  if (score >= 65) return "from-primary to-secondary";
  return "from-primary-fixed-dim to-primary";
}

export function DashboardPreview() {
  const reduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  const shouldReduceMotion = isMounted && !!reduceMotion;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (shouldReduceMotion) {
      setRevealedCount(SAMPLE_BUSINESSES.length);
      setShowDetail(true);
      return;
    }

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function runCycle() {
      if (cancelled) return;
      setRevealedCount(0);
      setShowDetail(false);

      SAMPLE_BUSINESSES.forEach((_, index) => {
        const timeout = setTimeout(() => {
          if (!cancelled) setRevealedCount(index + 1);
        }, ROW_INTERVAL_MS * (index + 1));
        timeouts.push(timeout);
      });

      const showDetailTimeout = setTimeout(() => {
        if (!cancelled) setShowDetail(true);
      }, ROW_INTERVAL_MS * (SAMPLE_BUSINESSES.length + 1));

      const resetTimeout = setTimeout(() => {
        if (!cancelled) runCycle();
      }, ROW_INTERVAL_MS * (SAMPLE_BUSINESSES.length + 1) + DETAIL_HOLD_MS);

      timeouts.push(showDetailTimeout, resetTimeout);
    }

    runCycle();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [isMounted, shouldReduceMotion]);

  const highlightedRow = useMemo(
    () => SAMPLE_BUSINESSES.reduce((best, row) => (row.score > best.score ? row : best)),
    [],
  );

  return (
    <section
      id="preview"
      className="relative overflow-hidden border-b border-outline-variant/20 bg-[#041221] px-margin-mobile py-20 md:px-margin-desktop md:py-28"
    >
      <DotPattern className="text-on-surface-variant" opacity={0.1} size={26} />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-secondary/40 to-transparent"
      />

      <div className="relative mx-auto max-w-container-max">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-secondary">
              Platform preview
            </p>
            <h2 className="mt-5 max-w-xl text-balance text-4xl leading-[1.05] text-on-background md:text-5xl lg:text-[3.5rem] [font-family:var(--font-editorial-serif)]">
              A scan that ends with a sales angle your team can actually use.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant lg:justify-self-end">
            The interface is intentionally built around signal clarity: which
            account matters, why it matters, and what should happen next.
          </p>
        </div>

        <div className="panel-halo edge-highlight relative overflow-hidden rounded-[28px] p-1.5">
          <BorderBeam duration={18} thickness={1} />
          {/* Inner browser chrome */}
          <div className="relative rounded-[22px] border border-outline-variant/15 bg-surface-container-lowest/85 overflow-hidden">
            {/* Window bar */}
            <div className="flex items-center gap-3 border-b border-outline-variant/15 bg-surface-container-low/70 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="hidden flex-1 items-center justify-center md:flex">
                <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-low/70 px-3 py-1 font-mono text-[11px] text-on-surface-variant">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary/80" />
                  app.loexai.com / dashboard / discovery
                </div>
              </div>
              <div className="ml-auto text-[10px] uppercase tracking-[0.26em] text-on-surface-variant/55">
                v1.0
              </div>
            </div>

            <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[1.1fr_0.9fr]">
              {/* ── Left: scan results ─────────────────────────────── */}
              <div className="rounded-[20px] border border-outline-variant/15 bg-black/15 p-5">
                <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant/15 pb-4">
                  <div className="flex items-center gap-3 rounded-full border border-outline-variant/20 bg-surface-container-low/80 px-4 py-2">
                    <Search
                      className="h-4 w-4 text-secondary"
                      aria-hidden="true"
                    />
                    <span className="font-mono text-sm text-on-surface">
                      dentists near Sisli, Istanbul
                    </span>
                  </div>
                  <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-secondary">
                    <Radar
                      className="h-3.5 w-3.5 animate-pulse-soft"
                      aria-hidden="true"
                    />
                    Live analysis
                  </div>
                </div>

                <ul className="mt-5 grid gap-3">
                  {SAMPLE_BUSINESSES.map((business, index) => {
                    const isRevealed = index < revealedCount;
                    const isActive = !showDetail && index === revealedCount - 1;

                    return (
                      <li
                        key={business.name}
                        className={[
                          "grid items-center gap-4 rounded-2xl border px-4 py-4 transition-all duration-300 md:grid-cols-[1fr_auto_auto]",
                          isRevealed
                            ? "border-outline-variant/25 bg-surface-container-low/70 opacity-100"
                            : "border-outline-variant/10 bg-surface-container-low/30 opacity-45",
                          isActive
                            ? "border-secondary/50 shadow-[0_0_30px_rgba(174,236,255,0.2)]"
                            : "",
                        ].join(" ")}
                      >
                        <div>
                          <p className="text-base text-on-surface">
                            {business.name}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.26em] text-on-surface-variant/70">
                            {business.category}
                          </p>
                        </div>
                        <div className="rounded-full border border-outline-variant/15 bg-surface/60 px-3 py-1.5 text-sm text-on-surface-variant">
                          {isRevealed ? business.gap : "Scanning signal"}
                        </div>
                        <div className="min-w-[80px] text-right">
                          {isRevealed ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-container-lowest">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${scoreTone(business.score)} transition-all duration-700`}
                                  style={{ width: `${business.score}%` }}
                                />
                              </div>
                              <span
                                className={[
                                  "font-mono text-base tabular-nums",
                                  isActive ? "text-secondary" : "text-on-surface",
                                ].join(" ")}
                              >
                                {business.score}
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-sm text-on-surface-variant/70">
                              ...
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer stats */}
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-outline-variant/15 pt-4 text-center text-[11px] uppercase tracking-[0.22em] text-on-surface-variant/65">
                  <div>
                    <p className="text-base font-medium text-on-surface [font-family:var(--font-editorial-serif)]">
                      {SAMPLE_BUSINESSES.length}
                    </p>
                    <p>Analyzed</p>
                  </div>
                  <div>
                    <p className="text-base font-medium text-on-surface [font-family:var(--font-editorial-serif)]">
                      2
                    </p>
                    <p>High priority</p>
                  </div>
                  <div>
                    <p className="text-base font-medium text-on-surface [font-family:var(--font-editorial-serif)]">
                      ~3k–8k €
                    </p>
                    <p>Deal range</p>
                  </div>
                </div>
              </div>

              {/* ── Right: detail panel ─────────────────────────────── */}
              <div className="grid gap-5">
                <div className="rounded-[20px] border border-outline-variant/15 bg-surface-container-low/75 p-5">
                  <AnimatePresence mode="wait">
                    {showDetail ? (
                      <motion.div
                        key="detail"
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.35 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/70">
                              Highest leverage account
                            </p>
                            <h3 className="mt-2 text-3xl leading-tight text-on-background [font-family:var(--font-editorial-serif)]">
                              {highlightedRow.name}
                            </h3>
                          </div>
                          <div className="rounded-full border border-primary/25 bg-gradient-to-br from-primary/20 to-secondary/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-primary">
                            Score {highlightedRow.score}
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          {[
                            "Missing booking conversion path",
                            "Low trust density on mobile",
                            "Weak service-page structure for SEO",
                          ].map((item) => (
                            <div
                              key={item}
                              className="flex items-start gap-3 rounded-2xl border border-outline-variant/15 bg-surface/55 px-4 py-3 text-sm leading-6 text-on-surface"
                            >
                              <CheckCircle2
                                className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                                aria-hidden="true"
                              />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center text-sm text-on-surface-variant"
                      >
                        <div className="h-10 w-10 animate-spin-slow rounded-full border-2 border-outline-variant/40 border-t-secondary" />
                        Waiting for strongest commercial signal...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="rounded-[20px] border border-outline-variant/15 bg-surface-container-low/75 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/70">
                    Next action
                  </p>
                  <h4 className="mt-3 text-2xl leading-tight text-on-background [font-family:var(--font-editorial-serif)]">
                    Pitch website + online booking modernization
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                    LoexAI prepares a concrete narrative: why conversion is
                    leaking, what the service package should include, and how
                    the implementation scope can be framed.
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm text-secondary">
                    Generate outreach brief
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
