"use client";

import { motion } from "framer-motion";
import { Clock, MessageSquareOff, FileCode2 } from "lucide-react";

const pains = [
  {
    icon: Clock,
    title: "Manual research wastes hours",
    body: "Scrolling Google Maps, opening 30 websites, taking notes — and you still don't know which lead is worth a cold email.",
  },
  {
    icon: MessageSquareOff,
    title: "Generic pitches get ignored",
    body: "Template outreach goes to spam. Without a specific gap to point to, your message reads like every other agency's.",
  },
  {
    icon: FileCode2,
    title: "Build prompts? You write them yourself.",
    body: "Once you close a deal, you spend another hour scoping the build. There is no bridge between discovery and delivery.",
  },
];

export function Problem() {
  return (
    <section className="relative z-20 bg-surface-container-lowest px-margin-mobile py-stack-xl md:px-margin-desktop md:py-24">
      <div className="mx-auto max-w-container-max">
        <div className="mb-stack-xl text-center">
          <p className="mb-stack-sm font-label-caps text-label-caps uppercase tracking-widest text-secondary">
            The problem
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            Finding the right local lead shouldn&apos;t feel like archaeology.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-3">
          {pains.map((pain, index) => {
            const Icon = pain.icon;
            return (
              <motion.div
                key={pain.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col gap-stack-md rounded-xl border border-outline-variant/30 bg-surface p-stack-lg transition-all duration-300 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(0,102,255,0.1)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-high">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">
                  {pain.title}
                </h3>
                <p className="text-body-sm leading-relaxed text-on-surface-variant">
                  {pain.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
