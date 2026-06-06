"use client";

import { motion } from "framer-motion";
import { MapPinned, Radar, Send } from "lucide-react";

import { DotPattern } from "./effects/DotPattern";

const steps = [
  {
    number: "01",
    icon: MapPinned,
    title: "Define the market",
    body: "Choose geography and category. LoexAI pulls target businesses, deduplicates the market, and establishes the operating set.",
  },
  {
    number: "02",
    icon: Radar,
    title: "Audit the commercial gap",
    body: "We inspect trust, booking, SEO, website quality, and digital infrastructure to quantify whether the account is worth pursuit.",
  },
  {
    number: "03",
    icon: Send,
    title: "Move from signal to action",
    body: "The winning angle becomes an outreach narrative, a service recommendation, and a build brief the delivery team can execute.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative overflow-hidden border-b border-outline-variant/20 px-margin-mobile py-20 md:px-margin-desktop md:py-28"
    >
      <DotPattern className="text-on-surface-variant" opacity={0.1} />

      <div className="relative mx-auto max-w-container-max">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-secondary">
              Operating model
            </p>
            <h2 className="mt-5 max-w-xl text-balance text-4xl leading-[1.05] text-on-background md:text-5xl lg:text-[3.5rem] [font-family:var(--font-editorial-serif)]">
              One workflow from market scan to a client-ready commercial angle.
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-7 text-on-surface-variant lg:justify-self-end">
            We designed the product like a disciplined advisory process, not
            another dashboard. Every stage reduces ambiguity and increases the
            quality of your next action.
          </p>
        </div>

        <div className="relative mt-14">
          {/* Connecting beam — desktop only */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[60px] hidden h-px lg:block"
          >
            <div className="mx-12 h-full bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="panel-firm lift-hover edge-highlight relative overflow-hidden rounded-[24px] p-7"
                >
                  <div className="relative flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/65">
                      Step {step.number}
                    </span>
                    <div className="relative">
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-secondary/15 blur-md"
                      />
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-secondary/30 bg-gradient-to-br from-surface-container-low to-surface-container-high">
                        <Icon
                          className="h-5 w-5 text-secondary"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-10 text-3xl leading-tight text-on-background [font-family:var(--font-editorial-serif)]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-on-surface-variant">
                    {step.body}
                  </p>

                  {/* Big translucent number for editorial feel */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-6 -right-2 text-[7rem] leading-none text-on-surface/[0.035] [font-family:var(--font-editorial-serif)]"
                  >
                    {step.number}
                  </span>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
