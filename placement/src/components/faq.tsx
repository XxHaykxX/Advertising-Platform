"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

const items: FaqItem[] = [
  {
    question: "How does pricing work?",
    answer:
      "Placements start from $5K. Listing and browsing are free — we only take a fee when a deal actually closes, so brands and filmmakers never pay for placements that fall through.",
  },
  {
    question: "How is brand safety scored?",
    answer:
      "Every script is broken down scene by scene and scored against the GARM 11-category brand safety framework, so you can see exactly where your product would appear before committing to a deal.",
  },
  {
    question: "What does anonymization mean?",
    answer:
      "Placement reports are shared anonymously by default. Production and brand identities stay hidden until both sides confirm mutual interest, keeping early conversations low-pressure on both ends.",
  },
  {
    question: "How do filmmakers list a project?",
    answer:
      "Filmmakers upload their screenplay, and our system analyzes it automatically to surface placement-ready scenes. The project then appears in the catalog for brands to discover and review.",
  },
  {
    question: "What production stages are listed?",
    answer:
      "You'll find projects across every stage — from scripts still in development, to productions in pre-production and financing, through to those already in active filming.",
  },
  {
    question: "How does matching and negotiation work?",
    answer:
      "Our matching surfaces relevant scenes based on your brand's category and goals. From there, you can message the production directly and negotiate terms inside the platform, no middlemen required.",
  },
  {
    question: "Is the data verified?",
    answer:
      "Yes. Production details, viewership estimates, and script analysis are reviewed by our team before a project goes live, so every number you see in a report is trustworthy.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reducedMotion = useReducedMotion();

  return (
    <Section id="faq">
      <Container>
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">Frequently Asked Questions</h2>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mx-auto max-w-3xl">
            {items.map((item, index) => {
              const isOpen = openIndex === index;
              const panelId = `faq-panel-${index}`;
              const buttonId = `faq-trigger-${index}`;

              return (
                <div key={item.question} className="border-b border-border">
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 py-6 text-left"
                    >
                      <span className="font-semibold text-foreground">{item.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                          isOpen && "rotate-180 text-primary"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        key="content"
                        initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        animate={reducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                        exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-10 text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
