"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DotPattern } from "./effects/DotPattern";

const items = [
  {
    q: "What exactly does one credit cover?",
    a: "One credit runs a complete opportunity workflow for a single business: discovery, enrichment, gap analysis, opportunity score, recommended service angle, and build brief generation.",
  },
  {
    q: "Is this another generic lead scraper?",
    a: "No. LoexAI is designed around commercial interpretation. Discovery is only the input layer. The value comes from scoring, diagnosis, and action framing.",
  },
  {
    q: "Can I use the output directly for outreach?",
    a: "Yes. The platform is built to generate a sales angle that is specific enough for a cold email, audit message, or intro deck narrative.",
  },
  {
    q: "Can the delivery team use the same output?",
    a: "Yes. The same run produces an implementation-ready build brief, reducing the gap between sales qualification and production handoff.",
  },
  {
    q: "Where is my data stored?",
    a: "Your account data and scan outputs are stored in Supabase with row-level protections. Provider-limited upstream fields are refreshed according to retention constraints.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="relative overflow-hidden border-b border-outline-variant/20 bg-background px-margin-mobile py-20 md:px-margin-desktop md:py-28"
    >
      <DotPattern className="text-on-surface-variant" opacity={0.08} />

      <div className="relative mx-auto grid max-w-container-max gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-secondary">
            FAQ
          </p>
          <h2 className="mt-5 max-w-lg text-balance text-4xl leading-[1.05] text-on-background md:text-5xl lg:text-[3.5rem] [font-family:var(--font-editorial-serif)]">
            The operational questions serious buyers usually ask.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-on-surface-variant">
            We kept the answers plain on purpose. This product is meant to
            support a disciplined revenue process, not hide behind vague AI
            language.
          </p>

          <div className="mt-10 rounded-2xl border border-outline-variant/20 bg-surface-container-low/60 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-secondary">
              Still curious?
            </p>
            <p className="mt-2 text-base leading-7 text-on-surface">
              Reach the team directly — we respond personally to every founder
              and operator inquiry within one working day.
            </p>
            <a
              href="mailto:hello@loexai.com"
              className="mt-4 inline-flex items-center gap-2 text-sm text-secondary transition-colors hover:text-on-surface"
            >
              hello@loexai.com →
            </a>
          </div>
        </div>

        <div className="panel-firm edge-highlight relative overflow-hidden rounded-[28px] p-4 md:p-6">
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <AccordionItem
                key={item.q}
                value={`item-${index}`}
                className="border-outline-variant/15 last:border-b-0"
              >
                <AccordionTrigger className="text-on-surface">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
