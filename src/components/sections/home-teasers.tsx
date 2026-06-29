"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Film, Workflow, Images, Users, Mail, ArrowRight, type LucideIcon } from "lucide-react";
import { SectionBackdrop } from "@/components/sections/section-backdrop";
import { makeUI, type Locale } from "@/lib/i18n";

type Teaser = {
  href: string;
  icon: LucideIcon;
  navKey: string;
  descKey: string;
  featured?: boolean;
};

const TEASERS: Teaser[] = [
  { href: "/catalog", icon: Film, navKey: "nav.catalog", descKey: "catalog.subtitle", featured: true },
  { href: "/how-it-works", icon: Workflow, navKey: "nav.how", descKey: "how.subtitle" },
  { href: "/portfolio", icon: Images, navKey: "nav.portfolio", descKey: "portfolio.subtitle" },
  { href: "/partners", icon: Users, navKey: "nav.partners", descKey: "partners.subtitle" },
  { href: "/contact", icon: Mail, navKey: "nav.contact", descKey: "contact.subtitle" },
];

export function HomeTeasers({
  t,
  locale,
}: {
  t: Record<string, string>;
  locale: Locale;
}) {
  const ui = makeUI(locale);

  return (
    <section
      id="explore"
      className="relative isolate overflow-hidden bg-background py-24 md:py-32"
    >
      <SectionBackdrop emberCount={12} />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid auto-rows-[200px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEASERS.map((teaser, i) => {
            const Icon = teaser.icon;
            return (
              <motion.div
                key={teaser.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                className={teaser.featured ? "sm:col-span-2 sm:row-span-2 lg:row-span-2" : ""}
              >
                <Link
                  href={teaser.href}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-black/30 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_50px_-20px_rgba(229,9,20,0.5)]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className={teaser.featured ? "h-7 w-7" : "h-6 w-6"} />
                  </span>
                  <div>
                    <h3
                      className={`font-bold tracking-tight text-foreground ${
                        teaser.featured ? "text-3xl sm:text-4xl" : "text-xl"
                      }`}
                    >
                      {ui(teaser.navKey)}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60 line-clamp-2">
                      {t[teaser.descKey]}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      {ui("card.more")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
