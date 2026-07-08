"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import type { PortfolioDTO } from "@/lib/types";
import { CaseCard } from "./case-card";
import { CaseLightbox } from "./lightbox";

export function PortfolioView({ cases }: { cases: PortfolioDTO[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <Header />

      <main className="bg-background">
        <div className="border-b border-border bg-gradient-to-b from-muted/60 to-background py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Portfolio
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
              >
                Case Studies
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 text-base text-muted-foreground sm:text-lg"
              >
                Real brand placements, real results — a look at campaigns delivered across
                our film and TV catalog.
              </motion.p>
            </div>
          </Container>
        </div>

        <Container className="py-16 sm:py-20">
          {cases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
              No case studies yet — check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {cases.map((c, i) => (
                <CaseCard key={c.id} data={c} index={i} onOpen={() => setActiveIndex(i)} />
              ))}
            </div>
          )}
        </Container>

        <div className="border-t border-border bg-section">
          <Container className="flex flex-col items-center gap-5 py-16 text-center sm:py-20">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Want results like these for your brand?
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Explore active productions currently accepting brand placement applications.
            </p>
            <Button asChild variant="primary" size="lg">
              <Link href="/catalog">Browse current projects</Link>
            </Button>
          </Container>
        </div>
      </main>

      <Footer />

      <CaseLightbox
        cases={cases}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
      />
    </>
  );
}
