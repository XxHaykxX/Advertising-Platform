"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
};

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32">
      {/* ── Light indigo decoration ─────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-10%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -left-24 top-1/3 h-[360px] w-[360px] rounded-full bg-indigo-300/25 blur-[100px]" />
        <div className="absolute -right-24 top-10 h-[420px] w-[420px] rounded-full bg-indigo-200/30 blur-[110px]" />
      </div>

      <Container>
        <motion.div
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
          variants={reduce ? undefined : container}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <motion.h1
            variants={reduce ? undefined : item}
            className="text-[48px] font-extrabold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-6xl"
          >
            <span className="grad-text">Brand Placement</span> Marketplace
          </motion.h1>

          <motion.p
            variants={reduce ? undefined : item}
            className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Connect brands with film & series productions through scene-level,
            brand-safe placement reports.
          </motion.p>

          <motion.div
            variants={reduce ? undefined : item}
            className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button asChild variant="primary" size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/catalog">Browse Projects</Link>
            </Button>
          </motion.div>

          <motion.p variants={reduce ? undefined : item} className="mt-5 text-sm text-muted-foreground">
            Placements from $5K. Platform fee only on closed deals.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}
