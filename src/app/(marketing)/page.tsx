import { Cta } from "@/components/landing/Cta";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Faq } from "@/components/landing/Faq";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { Problem } from "@/components/landing/Problem";

/**
 * Landing page (LAND-01) — six sections + animated dashboard preview.
 *
 * Section order:
 *   1. Hero (D-04, D-06 CTA → /register)
 *   2. Problem
 *   3. Dashboard Preview (D-05, animated)
 *   4. How It Works (#how anchor target)
 *   5. Pricing
 *   6. FAQ (#faq anchor target)
 *   7. CTA
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <DashboardPreview />
      <HowItWorks />
      <Pricing />
      <Faq />
      <Cta />
    </>
  );
}
