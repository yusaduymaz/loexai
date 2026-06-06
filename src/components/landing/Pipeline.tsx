"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bot,
  Compass,
  Crosshair,
  FileCode2,
  MessagesSquare,
  Network,
  Wand2,
} from "lucide-react";

import { DotPattern } from "./effects/DotPattern";

const stages = [
  {
    icon: Compass,
    label: "Lead Discovery",
    detail: "Pull a clean operating set of local businesses by category & radius.",
    tone: "deterministic",
  },
  {
    icon: Network,
    label: "Business Enrichment",
    detail: "Website, SSL, mobile, booking, CTA — captured deterministically.",
    tone: "deterministic",
  },
  {
    icon: Crosshair,
    label: "Gap Analysis",
    detail: "Industry templates expose commercially useful weaknesses.",
    tone: "hybrid",
  },
  {
    icon: BadgeCheck,
    label: "Opportunity Score",
    detail: "0–100 score, priority tier, deal range, close probability.",
    tone: "hybrid",
  },
  {
    icon: Wand2,
    label: "Solution Recommendation",
    detail: "Primary offer, secondary offers, and credible upsells.",
    tone: "ai",
  },
  {
    icon: MessagesSquare,
    label: "Sales Strategy",
    detail: "Cold email, DM, WhatsApp, pitch and objection handling.",
    tone: "ai",
  },
  {
    icon: FileCode2,
    label: "Build Prompt",
    detail: "Implementation-ready brief for Claude / Cursor and your team.",
    tone: "ai",
  },
  {
    icon: Bot,
    label: "QA & Confidence",
    detail: "Hallucination checks, evidence binding, confidence score.",
    tone: "ai",
  },
];

type ToneStyle = { ring: string; tag: string; label: string };

const toneStyles = {
  deterministic: {
    ring: "ring-1 ring-primary/25",
    tag: "bg-primary/10 text-primary",
    label: "Deterministic",
  },
  hybrid: {
    ring: "ring-1 ring-secondary/25",
    tag: "bg-secondary/10 text-secondary",
    label: "Hybrid",
  },
  ai: {
    ring: "ring-1 ring-tertiary/30",
    tag: "bg-tertiary/15 text-tertiary",
    label: "AI",
  },
} satisfies Record<string, ToneStyle>;

type ToneKey = keyof typeof toneStyles;

export function Pipeline() {
  return (
    <section
      id="pipeline"
      className="relative overflow-hidden border-b border-outline-variant/20 bg-[#04101e] px-margin-mobile py-20 md:px-margin-desktop md:py-28"
    >
      <DotPattern className="text-on-surface-variant" opacity={0.12} size={20} />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-outline-variant/60 to-transparent"
      />

      <div className="relative mx-auto max-w-container-max">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-secondary">
              The 8-stage pipeline
            </p>
            <h2 className="mt-5 max-w-xl text-balance text-4xl leading-[1.05] text-on-background md:text-5xl lg:text-[3.5rem] [font-family:var(--font-editorial-serif)]">
              Deterministic where it can be. AI where it actually matters.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant lg:justify-self-end">
            Every business runs through the same disciplined sequence — code
            first, models second. The result is reliable, repeatable, and
            cheaper to operate than a single monolithic LLM prompt.
          </p>
        </div>

        {/* Tone legend */}
        <div className="mt-10 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
          {Object.entries(toneStyles).map(([key, t]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${t.tag}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {t.label}
            </span>
          ))}
        </div>

        {/* Stage grid */}
        <div className="relative mt-10">
          {/* Connecting beam — desktop only, behind the cards */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-[42px] hidden h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent lg:block"
          />

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const t = toneStyles[stage.tone as ToneKey];

              return (
                <motion.li
                  key={stage.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`panel-firm lift-hover relative flex flex-col gap-4 rounded-[20px] p-5 ${t.ring}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-on-surface-variant/55">
                      Stage {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] ${t.tag}`}
                    >
                      {t.label}
                    </span>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low/80">
                    <Icon className="h-5 w-5 text-secondary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg leading-tight text-on-background [font-family:var(--font-editorial-serif)]">
                      {stage.label}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      {stage.detail}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
