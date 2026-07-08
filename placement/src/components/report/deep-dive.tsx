"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Lock, ShieldCheck } from "lucide-react";
import { AccentBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gauge } from "@/components/ui/gauge";
import { ScoreBar } from "@/components/ui/score-bar";
import { Reveal } from "@/components/ui/reveal";
import { moneyShort } from "@/lib/data/format";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";
import { OpportunityItem } from "./opportunity-item";
import { ExpressInterestBanner } from "./roi-snapshot";

const RECOMMENDED_FOR = ["Beverages", "Technology", "Fashion", "Consumer Electronics"];
const USE_CAUTION_WITH = ["Alcohol", "Gambling", "Firearms"];

function safetyColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warn";
  return "text-danger";
}

function verdict(score: number, t: (key: string) => string) {
  if (score >= 80) return t("deepDive.suitable");
  if (score >= 60) return t("deepDive.needsReview");
  return t("deepDive.highRisk");
}

function formatScreenTime(totalSec: number) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}m ${seconds}s`;
}

interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function AccordionItem({ title, isOpen, onToggle, children }: AccordionItemProps) {
  const reduce = useReducedMotion();

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-foreground">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {reduce ? (
        isOpen ? <div className="px-5 pb-5">{children}</div> : null
      ) : (
        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">{children}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}
    </div>
  );
}

export function DeepDive({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const [openId, setOpenId] = useState<string | null>("opportunities");
  const [showAllOpps, setShowAllOpps] = useState(false);
  const [showGarm, setShowGarm] = useState(false);

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  const shownOpps = showAllOpps ? project.opportunities : project.opportunities.slice(0, 4);
  const uniqueScenes = new Set(project.opportunities.map((o) => o.sceneNo)).size;
  const totalScreenTime = project.opportunities.reduce((sum, o) => sum + o.durationSec, 0);
  const risks = project.safetyCats.filter((cat) => cat.score < 80);
  const safetyLabel = verdict(project.safetyScore, t);
  const safetyClass = safetyColor(project.safetyScore);

  return (
    <section id="more" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <h2 className="text-2xl font-bold text-foreground">{t("deepDive.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("deepDive.subtitle")}</p>
        </Reveal>

        <div className="mt-6 flex flex-col gap-3">
          <Reveal delay={0.05}>
            <AccordionItem
              title={t("deepDive.allOpportunities", { n: project.opportunitiesCount })}
              isOpen={openId === "opportunities"}
              onToggle={() => toggle("opportunities")}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <AccentBadge>{t("deepDive.categoryExclusive")}</AccentBadge>
                <span className="text-sm text-muted-foreground">
                  {t("deepDive.totalExposure")}{" "}
                  <span className="font-semibold text-foreground">
                    {moneyShort(project.exposureTotal)}
                  </span>
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {shownOpps.map((opp, idx) => (
                  <OpportunityItem key={`${opp.sceneNo}-${idx}`} opp={opp} />
                ))}
              </div>

              {project.opportunities.length > 4 ? (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {t("deepDive.showing", {
                      shown: showAllOpps ? project.opportunities.length : 4,
                      total: project.opportunities.length,
                    })}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => setShowAllOpps((v) => !v)}>
                    {showAllOpps ? t("btn.showLess") : t("btn.showAll")}
                  </Button>
                </div>
              ) : null}
            </AccordionItem>
          </Reveal>

          <Reveal delay={0.08}>
            <AccordionItem
              title={t("deepDive.psychographicsTitle")}
              isOpen={openId === "psychographics"}
              onToggle={() => toggle("psychographics")}
            >
              <p className="text-sm text-muted-foreground">
                {t("deepDive.noData")}
              </p>
            </AccordionItem>
          </Reveal>

          <Reveal delay={0.11}>
            <AccordionItem
              title={t("deepDive.valueAlignmentTitle")}
              isOpen={openId === "value-alignment"}
              onToggle={() => toggle("value-alignment")}
            >
              <ExpressInterestBanner project={project} locale={locale} />
            </AccordionItem>
          </Reveal>

          <Reveal delay={0.14}>
            <AccordionItem
              title={t("deepDive.signalsTitle")}
              isOpen={openId === "signals"}
              onToggle={() => toggle("signals")}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {project.opportunitiesCount}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("deepDive.placements")}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{uniqueScenes}</div>
                  <div className="text-xs text-muted-foreground">{t("deepDive.uniqueScenes")}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {formatScreenTime(totalScreenTime)}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("deepDive.totalScreenTime")}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">Q2 2026</div>
                  <div className="text-xs text-muted-foreground">{t("deepDive.analysisDate")}</div>
                </div>
              </div>
            </AccordionItem>
          </Reveal>

          <Reveal delay={0.17}>
            <AccordionItem
              title={t("deepDive.fullSafetyTitle")}
              isOpen={openId === "full-safety"}
              onToggle={() => toggle("full-safety")}
            >
              <div className="flex flex-col items-center gap-3 rounded-xl bg-muted p-6 sm:flex-row sm:items-center sm:gap-6">
                <Gauge value={project.safetyScore} size={120} />
                <div>
                  <div className={`flex items-center gap-1.5 text-lg font-bold ${safetyClass}`}>
                    <ShieldCheck className="h-5 w-5" />
                    {safetyLabel} <span className="text-sm font-normal text-muted-foreground">({project.safetyScore}/100)</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("deepDive.clearedNote")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGarm((v) => !v)}
                className="mt-4 flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground"
                aria-expanded={showGarm}
              >
                {t("deepDive.viewGarmBreakdown", { n: project.safetyCats.length })}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ${showGarm ? "rotate-180" : ""}`}
                />
              </button>
              {showGarm ? (
                <div className="mt-3 grid grid-cols-1 gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
                  {project.safetyCats.map((cat) => (
                    <ScoreBar key={cat.name} label={cat.name} score={cat.score} aiText={cat.aiText} />
                  ))}
                </div>
              ) : null}

              {risks.length > 0 ? (
                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-foreground">{t("deepDive.potentialRisks")}</h4>
                  <ul className="mt-2 space-y-1.5">
                    {risks.map((cat) => (
                      <li key={cat.name} className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{cat.name}:</span>{" "}
                        {cat.aiText}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-5">
                <h4 className="text-sm font-semibold text-foreground">{t("deepDive.recommendations")}</h4>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                  <li>{t("deepDive.rec1")}</li>
                  <li>{t("deepDive.rec2")}</li>
                  <li>{t("deepDive.rec3")}</li>
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{t("deepDive.recommendedFor")}</span>
                {RECOMMENDED_FOR.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{t("deepDive.useCautionWith")}</span>
                {USE_CAUTION_WITH.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-warn/10 px-2.5 py-1 text-xs font-medium text-warn"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </AccordionItem>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
