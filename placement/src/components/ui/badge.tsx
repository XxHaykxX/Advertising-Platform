import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Safety = "SAFE" | "REVIEW" | "RISK";

const safetyConfig: Record<Safety, { label: string; className: string }> = {
  SAFE: { label: "Safe", className: "bg-success/10 text-success" },
  REVIEW: { label: "Review", className: "bg-warn/10 text-warn" },
  RISK: { label: "Risk", className: "bg-danger/10 text-danger" },
};

export function SafetyBadge({ safety }: { safety: Safety }) {
  const { label, className } = safetyConfig[safety];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        className
      )}
    >
      {label}
    </span>
  );
}

export function GenreBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

export function AccentBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}
