"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuroraBackdrop } from "./effects/AuroraBackdrop";
import { BorderBeam } from "./effects/BorderBeam";
import { DotPattern } from "./effects/DotPattern";

export function Cta() {
  return (
    <section className="relative overflow-hidden px-margin-mobile py-24 md:px-margin-desktop md:py-32">
      <AuroraBackdrop variant="hero" />
      <DotPattern className="text-on-surface-variant" opacity={0.14} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="panel-halo edge-highlight relative mx-auto overflow-hidden rounded-[36px] px-6 py-12 md:max-w-5xl md:px-12 md:py-16"
      >
        <BorderBeam duration={12} thickness={1} />

        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-secondary">
              Ready to test the motion
            </p>
            <h2 className="mt-5 max-w-3xl text-balance text-4xl leading-[1.05] text-on-background md:text-6xl [font-family:var(--font-editorial-serif)]">
              Replace generic prospecting with a sharper, more credible client
              acquisition system.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-on-surface-variant md:text-lg">
              Start free, run your first scans, and decide with real market
              evidence whether the workflow should become part of your
              firm&apos;s operating stack.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              asChild
              variant="primary"
              size="lg"
              className="btn-shine min-w-[240px]"
            >
              <Link href="/register">
                Create Free Account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <p className="text-sm text-on-surface-variant">
              <span className="text-on-surface">20 credits</span> included for
              initial qualification work.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                No card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                2-minute setup
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
