import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, Phone, Globe, Inbox } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getInterestsForOwner } from "@/lib/data/interests";
import { formatFullDate } from "@/lib/data/format";
import { formatMoney } from "@/lib/currency";
import { intlLocale, makeUI } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { InterestStatus } from "@prisma/client";
import { RowActions } from "./row-actions";

/* Wave 2 of the audit (2.1) — the creator's own applications inbox. Before
   this page a CREATOR got an "brand X is interested" notification with no
   text, no contact and no way to answer (the Interest was write-only); this
   reads the same rows the admin sees at /admin/interests, scoped to the
   creator's own projects (getInterestsForOwner). Layout mirrors
   account/brand/interests/page.tsx (card list, same status-pill/date
   conventions) rather than the admin table, since this cabinet renders bare
   inside account/layout.tsx's sidebar shell. */

const STATUS_PILL: Record<InterestStatus, string> = {
  SENT: "border-warn/25 bg-warn/10 text-warn",
  MUTUAL: "border-success/30 bg-success/10 text-success",
  DECLINED: "border-danger/30 bg-danger/10 text-danger",
};

// Tiers are always priced in AMD by the creator's own form — no visitor
// currency preference applies inside this cabinet.
const AMD_ONLY = { AMD: 1, USD: 1, EUR: 1, RUB: 1 };

export default async function AccountInterestsPage() {
  const user = await requireMember();
  if (user.role !== "CREATOR") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);
  const interests = await getInterestsForOwner(user.id, locale);

  const STATUS_LABEL: Record<InterestStatus, string> = {
    SENT: t("interests.status.SENT"),
    MUTUAL: t("interests.status.MUTUAL"),
    DECLINED: t("interests.status.DECLINED"),
  };

  return (
    <>
      <Reveal>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t("interests.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("interests.subtitle")}</p>
      </Reveal>

      {interests.length === 0 ? (
        <Reveal delay={0.05}>
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t("interests.empty")}</p>
          </div>
        </Reveal>
      ) : (
        <div className="mt-10 flex flex-col gap-4">
          {interests.map((interest, i) => (
            <Reveal key={interest.id} delay={0.05 * (i % 6)}>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/reports/${interest.project.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {interest.project.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{interest.project.code}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium",
                        STATUS_PILL[interest.status],
                      )}
                    >
                      {STATUS_LABEL[interest.status]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFullDate(interest.createdAt, intlLocale(locale))}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("interests.from")}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">{interest.brand.name}</p>
                    {interest.brand.company ? (
                      <p className="text-xs text-muted-foreground">{interest.brand.company}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("interests.contact")}
                    </p>
                    <div className="mt-1 flex flex-col gap-1 text-sm">
                      <a
                        href={`mailto:${interest.brand.email}`}
                        className="flex items-center gap-1.5 text-foreground hover:text-primary"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {interest.brand.email}
                      </a>
                      {interest.brand.phone ? (
                        <a
                          href={`tel:${interest.brand.phone}`}
                          className="flex items-center gap-1.5 text-foreground hover:text-primary"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {interest.brand.phone}
                        </a>
                      ) : null}
                      {interest.brand.website ? (
                        <a
                          href={interest.brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 truncate text-foreground hover:text-primary"
                        >
                          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {interest.brand.website}
                        </a>
                      ) : null}
                      {interest.contact ? (
                        <p className="text-muted-foreground">{interest.contact}</p>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("interests.package")}
                    </p>
                    {interest.tier ? (
                      <>
                        <p className="mt-1 text-sm font-medium text-foreground">{interest.tier.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatMoney(interest.tier.priceAmd, "AMD", AMD_ONLY, locale)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">{t("interests.noPackage")}</p>
                    )}
                  </div>
                </div>

                {interest.message ? (
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("interests.message")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{interest.message}</p>
                  </div>
                ) : null}

                {interest.status !== "SENT" && interest.responseNote ? (
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("interests.answered")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{interest.responseNote}</p>
                  </div>
                ) : null}

                {interest.events.length > 0 ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                      {t("interests.history")}
                    </summary>
                    <ul className="mt-2 flex flex-col gap-2 border-l border-border pl-3">
                      {interest.events.map((event) => (
                        <li key={event.id} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {event.kind === "APPLICATION" ? t("interests.eventApplication") : t("interests.eventResponse")}
                          </span>{" "}
                          · {formatFullDate(event.createdAt, intlLocale(locale))}
                          {event.body ? (
                            <p className="mt-0.5 whitespace-pre-wrap text-foreground">{event.body}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                <div className="mt-4">
                  <RowActions
                    interestId={interest.id}
                    status={interest.status}
                    acceptLabel={t("interests.accept")}
                    declineLabel={t("interests.decline")}
                    answerPrompt={t("interests.answerPrompt")}
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
