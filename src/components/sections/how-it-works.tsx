"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Film, ClipboardCheck, Headset, type LucideIcon } from "lucide-react";
import { SectionBackdrop } from "@/components/sections/section-backdrop";
import { makeUI, type Locale } from "@/lib/i18n";

interface Step {
  id: string;
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: "01",
    number: "01",
    icon: Film,
    title: "Производитель публикует проект",
    description:
      "Студия заранее размещает будущий фильм и доступные рекламные слоты — ещё до начала съёмок. Покупатели видят проект задолго до выхода.",
  },
  {
    id: "02",
    number: "02",
    icon: ClipboardCheck,
    title: "Покупатель оставляет заявку",
    description:
      "Рекламодатель находит подходящий проект в каталоге, выбирает тип размещения и бронирует слот заявкой — пока места свободны.",
  },
  {
    id: "03",
    number: "03",
    icon: Headset,
    title: "Менеджер ведёт сделку",
    description:
      "Наш менеджер связывается, согласует условия и сопровождает размещение вашего бренда в кадре — вплоть до выхода фильма.",
  },
];

export function HowItWorks({
  t,
  locale,
}: {
  t: Record<string, string>;
  locale: Locale;
}) {
  const ui = makeUI(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const localizedSteps = steps.map((s, i) => ({
    ...s,
    title: t[`how.step${i + 1}.title`] ?? s.title,
    description: t[`how.step${i + 1}.desc`] ?? s.description,
  }));

  return (
    <section
      id="how"
      className="relative isolate overflow-hidden bg-background py-24 md:py-32"
    >
      <SectionBackdrop />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {t["how.eyebrow"]}
          </p>
          <h2 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
            {t["how.heading"]}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/65 sm:text-lg">
            {t["how.subtitle"]}
          </p>
        </motion.div>

        <div ref={containerRef} className="relative mx-auto max-w-6xl">
          {/* center timeline line (desktop) */}
          <div className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 lg:block">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/25 to-primary/5" />
            <motion.div
              style={{ scaleY: lineScale }}
              className="absolute inset-0 origin-top bg-gradient-to-b from-primary to-primary/40"
            />
          </div>

          <div className="space-y-16 lg:space-y-24">
            {localizedSteps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                index={index}
                isLeft={index % 2 === 0}
                stepLabel={ui("how.step")}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
        aria-hidden="true"
      />
    </section>
  );
}

interface StepItemProps {
  step: Step;
  index: number;
  isLeft: boolean;
  stepLabel: string;
}

function NodeCircle({
  Icon,
  isInView,
  index,
}: {
  Icon: LucideIcon;
  isInView: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
      transition={{
        duration: 0.8,
        delay: index * 0.15 + 0.25,
        type: "spring",
        stiffness: 100,
      }}
      className="relative"
    >
      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/30 blur-2xl" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/30 bg-gradient-to-br from-primary to-red-700 shadow-2xl md:h-20 md:w-20">
        <Icon className="h-7 w-7 text-white md:h-9 md:w-9" />
      </div>
    </motion.div>
  );
}

const StepItem: React.FC<StepItemProps> = ({ step, index, isLeft, stepLabel }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative"
    >
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Card column */}
        <motion.div
          initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
          animate={
            isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isLeft ? -50 : 50 }
          }
          transition={{ duration: 0.8, delay: index * 0.15 + 0.15 }}
          className={`relative ${isLeft ? "lg:text-right" : "lg:order-2"}`}
        >
          {/* giant ghost number */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              isInView ? { opacity: 0.06, scale: 1 } : { opacity: 0, scale: 0.8 }
            }
            transition={{ duration: 1, delay: index * 0.15 }}
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center font-black leading-none text-white"
            style={{
              fontSize: "clamp(120px, 20vw, 280px)",
              [isLeft ? "right" : "left"]: "-15%",
            }}
          >
            {step.number}
          </motion.div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: index * 0.15 + 0.3 }}
              className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-black/40 p-7 shadow-2xl backdrop-blur-sm transition-colors duration-300 hover:border-primary/40 md:p-8"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {stepLabel} {step.number}
              </span>
              <h3 className="mb-4 mt-3 text-xl font-bold text-foreground sm:text-2xl lg:whitespace-nowrap">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-white/65 md:text-lg">
                {step.description}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* empty half (desktop) keeps the card on its side */}
        <div
          aria-hidden
          className={`hidden lg:block ${isLeft ? "lg:order-2" : "lg:order-1"}`}
        />
      </div>

      {/* Node — sits exactly ON the center timeline line (desktop) */}
      <div className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
        <NodeCircle Icon={Icon} isInView={isInView} index={index} />
      </div>
      {/* Node — mobile (inline, no center line on mobile) */}
      <div className="mt-8 flex justify-center lg:hidden">
        <NodeCircle Icon={Icon} isInView={isInView} index={index} />
      </div>
    </motion.div>
  );
};
