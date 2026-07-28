"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

interface FaqItem {
  question: string;
  answer: string;
}

export default function Faq({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);
  // q1..q6, no gap. The list used to skip q2 (q1, q3..q7), which is what sent
  // the content writer's numbered rows one key off when her sheet was applied.
  const items: FaqItem[] = [1, 2, 3, 4, 5, 6].map((n) => ({
    question: t(`faq.q${n}.question` as Parameters<typeof t>[0]),
    answer: t(`faq.q${n}.answer` as Parameters<typeof t>[0]),
  }));
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reducedMotion = useReducedMotion();

  return (
    <Section id="faq">
      <Container>
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">{t("faq.title")}</h2>
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
