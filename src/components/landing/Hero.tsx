"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

/**
 * Landing Hero — D-04 production quality, D-06 CTA → /register.
 *
 * Tokens-only styling. Background gradient + glow accents mirror the
 * `tasarimornegi/LandingPage.html` hero composition.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[860px] items-center justify-center overflow-hidden px-margin-mobile pt-32 md:px-margin-desktop md:pt-40">
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-background via-[#0a1a3a] to-[#004e7a] opacity-80"
      />

      {/* Glow accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/4 top-1/4 z-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1/4 right-1/4 z-0 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[100px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex max-w-4xl flex-col items-center gap-stack-lg text-center"
      >
        <div className="mb-stack-sm inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container/50 px-4 py-1.5 backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_#00d9ff]"
          />
          <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
            Opportunity Intelligence Platform
          </span>
        </div>

        <h1 className="font-display-lg text-4xl font-bold tracking-tight text-on-background md:text-[64px] md:leading-[72px]">
          Find local businesses that{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            actually need your services.
          </span>
        </h1>

        <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant md:text-title-md">
          LoexAI discovers nearby businesses, analyzes their digital gaps, and
          turns each finding into a pitch and a build prompt. Stop guessing who
          to email — know exactly what to sell and why.
        </p>

        <div className="mt-stack-md flex w-full flex-col gap-stack-md sm:w-auto sm:flex-row">
          <Button asChild variant="primary" size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <a href="#how">See how it works</a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
