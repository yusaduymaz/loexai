"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

type Plan = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta:
    | { kind: "link"; href: string; label: string; variant: "primary" | "outline" }
    | { kind: "disabled"; label: string };
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/mo",
    blurb: "Free tier — explore the engine with 20 credits.",
    features: [
      "20 opportunity credits",
      "Discovery + enrichment",
      "Gap analysis + scoring",
      "1 build prompt per scan",
      "Email support",
    ],
    cta: {
      kind: "link",
      href: "/register",
      label: "Get Started",
      variant: "primary",
    },
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "/mo",
    blurb: "For freelancers running outreach at volume.",
    features: [
      "500 credits / month",
      "Unlimited build prompts",
      "Sales strategy generator",
      "CRM-ready exports",
      "Priority support",
    ],
    cta: { kind: "disabled", label: "Coming Q1" },
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$199",
    cadence: "/mo",
    blurb: "Teams, white-label, and custom workflows.",
    features: [
      "Everything in Pro",
      "5 team seats",
      "White-label exports",
      "Custom API access",
      "Dedicated account manager",
    ],
    cta: { kind: "disabled", label: "Coming Q1" },
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative z-20 bg-background px-margin-mobile py-stack-xl md:px-margin-desktop md:py-24"
    >
      <div className="mx-auto max-w-container-max">
        <div className="mb-stack-xl text-center">
          <p className="mb-stack-sm font-label-caps text-label-caps uppercase tracking-widest text-secondary">
            Pricing
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            Start free. Upgrade when your pipeline outgrows it.
          </h2>
          <p className="mx-auto mt-stack-md max-w-2xl text-body-lg text-on-surface-variant">
            One credit = one full opportunity pipeline run (discover → score →
            pitch → build prompt). New accounts ship with 20 credits.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-stack-lg md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={
                plan.highlighted
                  ? "relative flex h-[105%] flex-col rounded-xl border-2 border-secondary bg-surface-container-low p-8 shadow-[0_0_40px_rgba(0,217,255,0.15)] md:-translate-y-4"
                  : "flex h-full flex-col rounded-xl border border-outline-variant/30 bg-surface p-8"
              }
            >
              {plan.highlighted ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-3 py-1 font-label-caps text-label-caps font-bold uppercase tracking-wider text-on-secondary">
                  Most Popular
                </div>
              ) : null}

              <h3
                className={`mb-2 font-title-md text-title-md ${
                  plan.highlighted ? "text-secondary mt-2" : "text-on-surface"
                }`}
              >
                {plan.name}
              </h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg font-bold text-on-surface">
                  {plan.price}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  {plan.cadence}
                </span>
              </div>
              <p className="mb-8 h-10 text-body-sm text-on-surface-variant">
                {plan.blurb}
              </p>

              <ul className="mb-8 flex flex-1 flex-col gap-stack-md">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check
                      aria-hidden="true"
                      className={`h-5 w-5 shrink-0 ${
                        plan.highlighted ? "text-secondary" : "text-outline"
                      }`}
                    />
                    <span className="text-body-sm text-on-surface">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {plan.cta.kind === "link" ? (
                <Button
                  asChild
                  variant={plan.cta.variant}
                  className="w-full"
                >
                  <Link href={plan.cta.href}>{plan.cta.label}</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled
                  variant="outline"
                  className="w-full"
                  title="Available Q1 — Stripe billing not live yet"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  {plan.cta.label}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
