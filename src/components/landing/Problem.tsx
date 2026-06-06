"use client";

import { motion } from "framer-motion";
import { Clock3, MailX, ScrollText } from "lucide-react";

import { DotPattern } from "./effects/DotPattern";

const pains = [
  {
    icon: Clock3,
    title: "Research is disconnected from revenue",
    body: "Teams burn hours assembling prospect lists without a defensible reason why a specific business should buy now.",
    accent: "from-secondary/30 via-secondary/0 to-transparent",
  },
  {
    icon: MailX,
    title: "Outreach lacks commercial specificity",
    body: "Most cold messages describe services. Very few diagnose a concrete gap, quantify urgency, and suggest the right scope.",
    accent: "from-primary/30 via-primary/0 to-transparent",
  },
  {
    icon: ScrollText,
    title: "Delivery context starts from zero",
    body: "Even after a positive reply, strategy has to be rewritten into a build brief. Sales and production stay disconnected.",
    accent: "from-tertiary/30 via-tertiary/0 to-transparent",
  },
];

export function Problem() {
  return (
    <section className="relative overflow-hidden border-b border-outline-variant/20 bg-[#061526] px-margin-mobile py-20 md:px-margin-desktop md:py-28">
      <DotPattern className="text-on-surface-variant" opacity={0.1} />

      <div className="relative mx-auto grid max-w-container-max gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-secondary">
            Why teams stall
          </p>
          <h2 className="mt-5 max-w-xl text-balance text-4xl leading-[1.05] text-on-background md:text-5xl lg:text-[3.5rem] [font-family:var(--font-editorial-serif)]">
            Opportunity hunting still looks far too manual for a modern firm.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-on-surface-variant">
            The issue is not access to lead data. The issue is converting raw
            local market data into a persuasive business case your team can use
            immediately.
          </p>

          {/* Stat strip */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-5">
              <p className="text-3xl text-on-background [font-family:var(--font-editorial-serif)]">
                4–6 hrs
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                wasted per qualified lead with manual workflows
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-5">
              <p className="text-3xl text-on-background [font-family:var(--font-editorial-serif)]">
                {"<"}5%
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                of generic cold outreach gets a measured reply
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {pains.map((pain, index) => {
            const Icon = pain.icon;

            return (
              <motion.article
                key={pain.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="panel-firm lift-hover relative grid gap-5 overflow-hidden rounded-[24px] p-6 md:grid-cols-[72px_1fr]"
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${pain.accent} blur-3xl`}
                />
                <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-low/80">
                  <Icon className="h-7 w-7 text-secondary" aria-hidden="true" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between gap-4 border-b border-outline-variant/15 pb-4">
                    <h3 className="text-2xl leading-tight text-on-background [font-family:var(--font-editorial-serif)]">
                      {pain.title}
                    </h3>
                    <span className="text-[11px] uppercase tracking-[0.28em] text-on-surface-variant/60">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="pt-4 text-base leading-7 text-on-surface-variant">
                    {pain.body}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
