"use client";

import { motion } from "framer-motion";
import { Search, Microscope, Rocket } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Search,
    title: "Discover",
    body: "Pick a category + location. LoexAI pulls local businesses from your chosen discovery provider and deduplicates them by place ID.",
  },
  {
    n: "02",
    icon: Microscope,
    title: "Analyze",
    body: "Deterministic checks (website, SSL, mobile, booking, reviews) feed a numeric opportunity score — no LLM guessing.",
  },
  {
    n: "03",
    icon: Rocket,
    title: "Sell + Build",
    body: "AI turns each gap into a pitch, cold email, and an implementation-ready build prompt for Cursor or Claude.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative z-20 bg-background px-margin-mobile py-stack-xl md:px-margin-desktop md:py-24"
    >
      <div className="mx-auto max-w-container-max">
        <div className="mb-stack-xl text-center">
          <p className="mb-stack-sm font-label-caps text-label-caps uppercase tracking-widest text-secondary">
            How it works
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            From raw map data to a closed deal — in one workflow.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex flex-col gap-stack-md rounded-xl border border-outline-variant/30 bg-surface-container p-stack-lg"
              >
                <div className="inline-flex h-8 w-fit items-center rounded-full bg-primary-container/15 px-3 font-data-mono text-label-caps tracking-wider text-primary">
                  {step.n}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-high">
                  <Icon className="h-6 w-6 text-secondary" aria-hidden="true" />
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">
                  {step.title}
                </h3>
                <p className="text-body-sm leading-relaxed text-on-surface-variant">
                  {step.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
