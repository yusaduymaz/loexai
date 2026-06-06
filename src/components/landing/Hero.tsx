"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronRight,
  CircleDot,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimatedShinyText } from "./effects/AnimatedShinyText";
import { AuroraBackdrop } from "./effects/AuroraBackdrop";
import { BorderBeam } from "./effects/BorderBeam";
import { DotPattern } from "./effects/DotPattern";
import { Marquee } from "./effects/Marquee";
import { NumberTicker } from "./effects/NumberTicker";

const metrics = [
  { value: 18, label: "Signals analyzed per business", suffix: "+" },
  { value: 92, label: "Avg. confidence on top-decile leads", suffix: "%" },
  { value: 1, label: "Minute from scan to client-ready brief", suffix: "" },
];

// Marquee labels — kept descriptive instead of fake-logo placeholders.
const trustItems = [
  "Independent agencies",
  "Local growth operators",
  "SaaS resellers",
  "Web studios",
  "AI automation builders",
  "Solo consultants",
  "Outbound teams",
  "Vertical specialists",
];

const proofPoints = [
  { icon: CircleDot, label: "Deterministic gap analysis" },
  { icon: TrendingUp, label: "Opportunity scoring 0–100" },
  { icon: Sparkles, label: "Sales angle + build brief in one pass" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-outline-variant/20 px-margin-mobile pb-20 pt-28 md:px-margin-desktop md:pb-32 md:pt-36">
      <AuroraBackdrop variant="hero" />
      <DotPattern className="text-on-surface-variant" opacity={0.16} size={26} />

      <div className="relative mx-auto grid max-w-container-max gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        {/* ── Left column ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          {/* Eyebrow chip */}
          <motion.a
            href="#preview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="group inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low/70 py-1.5 pl-1.5 pr-4 text-xs text-on-surface-variant backdrop-blur-md transition-colors hover:border-secondary/40 hover:text-on-surface"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.22em] text-secondary">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              New
            </span>
            <AnimatedShinyText className="text-[11px] tracking-wide">
              Opportunity intelligence for agencies & freelancers
            </AnimatedShinyText>
            <ArrowUpRight
              className="h-3.5 w-3.5 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </motion.a>

          {/* Headline */}
          <h1 className="mt-8 text-balance text-[3rem] leading-[1] tracking-[-0.02em] text-on-background md:text-[4.75rem] lg:text-[5.5rem] [font-family:var(--font-editorial-serif)]">
            Find the businesses
            <br className="hidden md:block" />
            that actually{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-secondary to-secondary-container bg-clip-text text-transparent">
                need your services.
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-secondary/60 to-transparent"
              />
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-on-surface-variant md:text-xl">
            LoexAI identifies local businesses with commercially useful digital
            gaps, scores the opportunity, and turns the finding into a pitch
            plus an implementation brief your team can ship —{" "}
            <span className="text-on-surface">in one pass</span>.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              variant="primary"
              size="lg"
              className="btn-shine min-w-[210px]"
            >
              <Link href="/register">
                Start Free Audit
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="min-w-[210px]">
              <a href="#preview">
                See platform walkthrough
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>

          {/* Inline trust micro-bar */}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative grid h-2 w-2 place-items-center">
                <span className="absolute h-full w-full animate-ping-soft rounded-full bg-secondary/70" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-secondary" />
              </span>
              No card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3 w-3 text-secondary" aria-hidden="true" />
              20 credits on signup
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-on-surface-variant/60" />
              Cancel anytime
            </span>
          </div>

          {/* Inline metrics */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + 0.08 * index, duration: 0.45 }}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/55 px-5 py-4 backdrop-blur-sm"
              >
                <p className="text-3xl text-on-background [font-family:var(--font-editorial-serif)]">
                  <NumberTicker value={metric.value} suffix={metric.suffix} />
                </p>
                <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">
                  {metric.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Right column: animated scan card ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative"
        >
          {/* Decorative back glow */}
          <div
            aria-hidden="true"
            className="absolute -inset-x-10 -inset-y-12 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(0,217,255,0.18),transparent_70%)] blur-2xl"
          />

          <div className="panel-halo edge-highlight relative overflow-hidden rounded-[28px] p-6">
            <BorderBeam duration={14} thickness={1} />

            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/70">
                    Executive Snapshot
                  </p>
                  <p className="mt-1 text-xl text-on-background [font-family:var(--font-editorial-serif)]">
                    Istanbul · Dental Market
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-secondary">
                  <span className="relative grid h-2 w-2 place-items-center">
                    <span className="absolute h-full w-full animate-ping-soft rounded-full bg-secondary/70" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-secondary" />
                  </span>
                  Live scan
                </div>
              </div>

              {/* Hero score card */}
              <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-black/15 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.28em] text-on-surface-variant/70">
                      Recommended target
                    </p>
                    <p className="mt-2 text-2xl text-on-background [font-family:var(--font-editorial-serif)]">
                      Klinik Beyaz
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">
                      No structured service pages, no booking conversion path,
                      and low trust signaling across mobile. High-probability
                      website retainer angle.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-secondary/10 px-4 py-3 text-right">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-primary/80">
                      Score
                    </p>
                    <p className="text-4xl leading-none text-on-background [font-family:var(--font-editorial-serif)]">
                      <NumberTicker value={87} />
                    </p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-lowest">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "87%" }}
                      transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-secondary-container"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-on-surface-variant/55">
                    <span>Low</span>
                    <span>Urgent</span>
                  </div>
                </div>
              </div>

              {/* Core outputs */}
              <div className="mt-5 rounded-2xl border border-outline-variant/20 bg-surface-container-low/70 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-on-surface-variant/70">
                  Core outputs
                </p>
                <ul className="mt-4 grid gap-3 md:grid-cols-3">
                  {proofPoints.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="flex items-start gap-2.5 rounded-xl border border-outline-variant/15 bg-surface/40 px-3 py-3 text-sm leading-5 text-on-surface"
                    >
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Floating "AI insight" callout */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="panel-glass absolute -bottom-6 -left-4 hidden max-w-[260px] rounded-2xl px-4 py-3 lg:block"
          >
            <p className="text-[10px] uppercase tracking-[0.26em] text-secondary">
              AI Insight
            </p>
            <p className="mt-1 text-sm leading-5 text-on-surface">
              Pitch website + online booking modernization.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Trust marquee */}
      <div className="relative mx-auto mt-20 max-w-container-max">
        <p className="text-center text-[11px] uppercase tracking-[0.32em] text-on-surface-variant/55">
          Built for the operators who close work, not collect leads
        </p>
        <Marquee className="mt-6">
          {trustItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-3 whitespace-nowrap text-base text-on-surface-variant/70 [font-family:var(--font-editorial-serif)]"
            >
              {item}
              <span
                aria-hidden="true"
                className="inline-block h-1 w-1 rounded-full bg-outline-variant/70"
              />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
