import { Cta } from "@/components/landing/Cta";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Faq } from "@/components/landing/Faq";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pipeline } from "@/components/landing/Pipeline";
import { Pricing } from "@/components/landing/Pricing";
import { Problem } from "@/components/landing/Problem";

/**
 * Landing page (LAND-01) — eight sections, end-to-end animated.
 *
 * Section order:
 *   1. Hero (trust marquee + animated scan card)
 *   2. Problem (why teams stall)
 *   3. DashboardPreview (#preview — live scan animation)
 *   4. Pipeline (#pipeline — 8-stage deterministic→AI flow)
 *   5. HowItWorks (#how — three-step operating model)
 *   6. Pricing (#pricing — highlighted Pro plan with border beam)
 *   7. FAQ (#faq)
 *   8. CTA (closing)
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <DashboardPreview />
      <Pipeline />
      <HowItWorks />
      <Pricing />
      <Faq />
      <Cta />
    </>
  );
}
