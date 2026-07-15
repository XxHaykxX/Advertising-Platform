"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

const BASE_TABS = [
  { id: "overview", labelKey: "report.tabs.overview" },
  { id: "cast", labelKey: "report.tabs.cast" },
] as const;

export function ReportTabs({
  hasCast = true,
  locale = DEFAULT_LOCALE,
}: {
  hasCast?: boolean;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const TABS = hasCast ? BASE_TABS : BASE_TABS.filter((tab) => tab.id !== "cast");
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    const sections = TABS.map((t) => document.getElementById(t.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <Container>
        <nav className="flex gap-1 overflow-x-auto py-2">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tab.labelKey)}
            </a>
          ))}
        </nav>
      </Container>
    </div>
  );
}
