"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Check, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { BorderBeam } from "./effects/BorderBeam";
import { DotPattern } from "./effects/DotPattern";

const PRICE_PRO = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "price_pro_mock";
const PRICE_AGENCY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY || "price_agency_mock";

type Plan = {
  name: string;
  price: string;
  cadence: string;
  label: string;
  blurb: string;
  features: string[];
  cta?: { href: string; label: string; variant: "primary" | "secondary" };
  priceId?: string;
  plan?: string;
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/mo",
    label: "For evaluation",
    blurb:
      "Validate the workflow, run discovery, and understand whether the engine fits your sales motion.",
    features: [
      "20 credits to start",
      "Discovery and opportunity scoring",
      "Build brief generation",
      "Email support",
    ],
    cta: { href: "/register", label: "Start Free", variant: "secondary" },
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "/mo",
    label: "For owner-operators",
    blurb:
      "For freelancers and small agencies that need a repeatable local prospecting system every week.",
    features: [
      "500 monthly credits",
      "Unlimited build briefs",
      "Priority support",
      "CRM-ready exports",
    ],
    priceId: PRICE_PRO,
    plan: "pro",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$199",
    cadence: "/mo",
    label: "For teams",
    blurb:
      "For firms running multiple operators, larger territories, and more structured outbound programs.",
    features: [
      "Team seats included",
      "White-label exports",
      "Custom API access",
      "Dedicated account support",
    ],
    priceId: PRICE_AGENCY,
    plan: "agency",
  },
];

export function Pricing() {
  const { isSignedIn } = useUser();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showSignedIn = isMounted && isSignedIn;

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!isSignedIn) {
      window.location.href = `/register?redirect_url=${encodeURIComponent(window.location.href)}`;
      return;
    }
    try {
      setLoadingPriceId(priceId);
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode: "subscription", plan: planName }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to initiate checkout");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-b border-outline-variant/20 bg-[#051321] px-margin-mobile py-20 md:px-margin-desktop md:py-28"
    >
      <DotPattern className="text-on-surface-variant" opacity={0.1} />

      <div className="relative mx-auto max-w-container-max">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-secondary">
              Pricing
            </p>
            <h2 className="mt-5 max-w-xl text-balance text-4xl leading-[1.05] text-on-background md:text-5xl lg:text-[3.5rem] [font-family:var(--font-editorial-serif)]">
              Start with a measured pilot. Scale once the motion is proven.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant lg:justify-self-end">
            Pricing is built around full opportunity runs: discover, score,
            explain, recommend, and brief. No separate charge for the strategic
            layer.
          </p>
        </div>

        <div className="mt-14 grid gap-5 xl:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className={[
                "relative flex flex-col overflow-hidden rounded-[28px] p-7",
                plan.highlighted
                  ? "panel-halo edge-highlight scale-[1.01] lg:-translate-y-2"
                  : "panel-firm lift-hover",
              ].join(" ")}
            >
              {plan.highlighted ? <BorderBeam duration={10} thickness={1} /> : null}

              {plan.highlighted ? (
                <div className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/15 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-secondary">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Recommended
                </div>
              ) : null}

              <div className="relative border-b border-outline-variant/15 pb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/70">
                  {plan.label}
                </p>
                <h3 className="mt-3 text-3xl text-on-background [font-family:var(--font-editorial-serif)]">
                  {plan.name}
                </h3>
                <div className="mt-5 flex items-end gap-2">
                  <span
                    className={[
                      "text-5xl leading-none [font-family:var(--font-editorial-serif)]",
                      plan.highlighted
                        ? "bg-gradient-to-br from-primary via-secondary to-secondary-container bg-clip-text text-transparent"
                        : "text-on-background",
                    ].join(" ")}
                  >
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm text-on-surface-variant">
                    {plan.cadence}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                  {plan.blurb}
                </p>
              </div>

              <ul className="relative mt-6 flex flex-1 flex-col gap-2.5 text-sm leading-6 text-on-surface">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 px-1 py-1.5">
                    <span
                      className={[
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                        plan.highlighted
                          ? "bg-secondary/20 text-secondary"
                          : "bg-surface-container-low text-on-surface-variant",
                      ].join(" ")}
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="relative mt-8">
                {plan.cta ? (
                  <Button
                    asChild
                    variant={plan.cta.variant}
                    className="w-full"
                    size="lg"
                  >
                    <Link href={showSignedIn ? "/dashboard" : plan.cta.href}>
                      {showSignedIn ? "Go to Dashboard" : plan.cta.label}
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleSubscribe(plan.priceId!, plan.plan!)}
                    disabled={loadingPriceId !== null}
                    variant={plan.highlighted ? "primary" : "secondary"}
                    className={["w-full", plan.highlighted ? "btn-shine" : ""].join(" ")}
                    size="lg"
                  >
                    {loadingPriceId === plan.priceId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : showSignedIn ? (
                      `Choose ${plan.name}`
                    ) : (
                      "Get Started"
                    )}
                  </Button>
                )}
              </div>
            </motion.article>
          ))}
        </div>

        {/* Reassurance row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-on-surface-variant">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Cancel anytime
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Pay only for what you use
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            EU-hosted infrastructure
          </span>
        </div>
      </div>
    </section>
  );
}
