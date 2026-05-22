import type { Metadata } from "next";

import { Pricing } from "@/components/landing/Pricing";

export const metadata: Metadata = {
  title: "Pricing — LoexAI",
  description:
    "Start free with 20 credits. Pro and Agency plans coming Q1 — bring your AI provider, your discovery provider, your workflow.",
};

/**
 * Standalone pricing page (LAND-02).
 *
 * The same `<Pricing />` component is embedded in the landing page; here we
 * give it its own route with a focused hero header.
 */
export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-margin-mobile pt-stack-xl text-center md:px-margin-desktop md:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary-container/10 via-background to-background"
        />
        <div className="mx-auto max-w-3xl">
          <p className="mb-stack-sm font-label-caps text-label-caps uppercase tracking-widest text-secondary">
            Pricing
          </p>
          <h1 className="font-display-lg text-4xl font-bold tracking-tight text-on-background md:text-5xl">
            Plans that match your pipeline.
          </h1>
          <p className="mt-stack-md text-body-lg text-on-surface-variant">
            Every account starts with 20 credits. Stripe billing goes live in
            Q1 — until then, Starter is the only active tier.
          </p>
        </div>
      </section>
      <Pricing />
    </>
  );
}
