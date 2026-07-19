import Image from "next/image";
import { motion } from "framer-motion";
import { Film, TrendingUp } from "lucide-react";
import { AccentBadge } from "@/components/ui/badge";
import type { PortfolioDTO } from "@/lib/types";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { localizeMetricLabel, parseMetrics } from "./metrics";

export function CaseCard({
  data: c,
  index,
  onOpen,
  locale = DEFAULT_LOCALE,
}: {
  data: PortfolioDTO;
  index: number;
  onOpen: () => void;
  locale?: Locale;
}) {
  const metrics = Object.entries(parseMetrics(c.metrics)).slice(0, 3);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      onClick={onOpen}
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card text-left card-lift"
    >
      <div className="relative aspect-[16/10] shrink-0">
        {c.image ? (
          <Image
            src={c.image}
            alt={`${c.brand} — ${c.title}`}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Film className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <AccentBadge>{c.brand}</AccentBadge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold text-foreground md:text-xl">{c.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>

        {metrics.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            {metrics.map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
              >
                <TrendingUp className="h-3 w-3 shrink-0" />
                {value}
                <span className="font-normal text-primary/70">{localizeMetricLabel(locale, key)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
}
