"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="relative z-20 px-margin-mobile py-stack-xl md:px-margin-desktop md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto flex max-w-4xl flex-col items-center gap-stack-lg overflow-hidden rounded-xl border border-outline-variant/40 bg-primary-container/20 px-stack-lg py-stack-xl text-center md:px-stack-xl"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/20 blur-[100px]"
        />
        <p className="relative z-10 font-label-caps text-label-caps uppercase tracking-widest text-secondary">
          Ready to ship?
        </p>
        <h2 className="relative z-10 font-display-lg text-3xl font-bold tracking-tight text-on-background md:text-5xl">
          Stop guessing who to email.
          <br />
          Start with a real opportunity.
        </h2>
        <p className="relative z-10 max-w-xl text-body-lg text-on-surface-variant">
          Sign up free, get 20 credits, and see your first scored opportunity in
          under two minutes.
        </p>
        <Button asChild variant="primary" size="lg" className="relative z-10">
          <Link href="/register">Get Started — it's free</Link>
        </Button>
      </motion.div>
    </section>
  );
}
