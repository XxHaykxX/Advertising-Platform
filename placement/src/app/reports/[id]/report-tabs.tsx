"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "safety", label: "Safety" },
  { id: "investment", label: "Investment" },
  { id: "more", label: "More" },
] as const;

export function ReportTabs() {
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
    <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
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
              {tab.label}
            </a>
          ))}
        </nav>
      </Container>
    </div>
  );
}
