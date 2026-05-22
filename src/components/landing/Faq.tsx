"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    q: "What is LoexAI?",
    a: "LoexAI is a local opportunity intelligence platform. It discovers nearby businesses, analyzes each one's digital weaknesses, scores them by sales potential, and generates an outreach plan plus an implementation-ready build prompt for your dev tools.",
  },
  {
    q: "Is this just a lead scraper?",
    a: "No. Scraping is the first step — what matters is what we do after. LoexAI runs deterministic gap analysis and scoring, then uses AI only to explain findings and draft outreach. It is opportunity intelligence, not a leads list.",
  },
  {
    q: "What does one credit get me?",
    a: "One credit runs a full pipeline for a single business: discovery → enrichment → gap analysis → opportunity score → solution recommendation → sales strategy → build prompt. Re-running the same business uses the cached result with no extra credit cost.",
  },
  {
    q: "Do you store business data forever?",
    a: "No. Provider data is retained only as long as policy allows (Google Places caps at 30 days for most fields). After that we keep your derived insights — your scores, pitches, and prompts — but refresh upstream attributes on demand.",
  },
  {
    q: "Can I bring my own AI provider?",
    a: "Yes. AI is wrapped behind a provider interface. Production runs on Anthropic Claude; development can use OpenRouter free models. Swap providers with one environment variable — no code changes.",
  },
  {
    q: "Where is my data stored and is it shared?",
    a: "Your scans and outputs live in your Supabase row, gated by row-level security. We never share, sell, or train AI on your data. EU customers can opt into Supabase EU regions on the Agency plan.",
  },
  {
    q: "Do I need to write prompts to use the build feature?",
    a: "No. LoexAI produces a complete build prompt (tech stack, pages, components, data model) you can paste straight into Cursor or Claude. Tweak it if you want — most users ship the default.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="relative z-20 bg-surface-container-lowest px-margin-mobile py-stack-xl md:px-margin-desktop md:py-24"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-stack-xl text-center">
          <p className="mb-stack-sm font-label-caps text-label-caps uppercase tracking-widest text-secondary">
            FAQ
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            Honest answers, no marketing fluff.
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={item.q} value={`item-${index}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
