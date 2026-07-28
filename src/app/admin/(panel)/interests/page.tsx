import Link from "next/link";
import { Mail, Phone, Globe, Inbox } from "lucide-react";
import { requireContentEditor } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getAllInterests } from "@/lib/data/interests";
import { formatFullDate } from "@/lib/data/format";
import { formatMoney } from "@/lib/currency";
import { intlLocale, makeUI } from "@/lib/i18n";
import { BUDGET_RANGES } from "@/lib/brand-categories";
import { cn } from "@/lib/utils";
import type { InterestStatus } from "@prisma/client";
import { RowActions } from "./row-actions";

/** "5-20M" → "5,000,000 – 20,000,000 AMD" (admin panel stays English-only). */
function budgetLabel(value: string): string {
  return BUDGET_RANGES.find((b) => b.value === value)?.label ?? value;
}

const DEAL_LABEL: Record<string, string> = {
  CASH: "Cash",
  BARTER: "Barter",
  BOTH: "Cash and barter",
};

/* Wave 2 of the audit (2.1) — the admin half of the applications inbox that
   was deleted in cd7fb5a, which is what made a brand's Interest write-only:
   the message and contact were saved but no admin page ever read them back.
   Mirrors moderation/page.tsx's layout (staff-only list, same pill/table
   conventions); the creator's own view of the same data is
   /account/interests, sharing this module's getAllInterests/getInterestsForOwner. */

const STATUS_PILL: Record<InterestStatus, string> = {
  SENT: "border-warn/25 bg-warn/10 text-warn",
  MUTUAL: "border-success/30 bg-success/10 text-success",
  DECLINED: "border-danger/30 bg-danger/10 text-danger",
};

// AMD is the only currency staff enter/see here — tiers are always priced in
// AMD (see tiers-editor.tsx), so the other rates are unused placeholders.
const AMD_ONLY = { AMD: 1, USD: 1, EUR: 1, RUB: 1 };

export default async function InterestsAdminPage() {
  const staff = await requireContentEditor();
  // The admin panel is English-only (see admin-nav.tsx and the other
  // sections, which hardcode English) — pin the translator, but keep the
  // visitor's locale for date/number formatting.
  const locale = await getLocale();
  const t = makeUI("en");
  const interests = await getAllInterests(locale);

  const STATUS_LABEL: Record<InterestStatus, string> = {
    SENT: t("interests.status.SENT"),
    MUTUAL: t("interests.status.MUTUAL"),
    DECLINED: t("interests.status.DECLINED"),
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("interests.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("interests.subtitleAdmin")}</p>
      </div>

      {interests.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          <Inbox className="h-8 w-8 text-muted-foreground/50" />
          {t("interests.empty")}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {interests.map((interest) => (
            <div key={interest.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {/* Opens the project, not its edit form — you come here to
                      judge an application, and a form is not what you need to
                      read to do that. */}
                  <Link
                    href={`/reports/${interest.project.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    {interest.project.title}
                  </Link>
                  {/* The #PP-… code is internal bookkeeping and is not shown
                      anywhere in the UI (owner decision, repeated). */}
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
                  {/* Budget bracket + categories from the brand's own profile —
                      filled in at registration and, until now, read by nobody
                      (same addition as the creator's inbox). */}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Budget:{" "}
                    <span className="font-medium text-foreground">
                      {budgetLabel(interest.brand.budgetRange) || "not specified"}
                    </span>
                  </p>
                  {interest.brand.categories.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Categories: <span className="text-foreground">{interest.brand.categories.join(", ")}</span>
                    </p>
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
                    {/* interest.contact is what the brand typed in the application
                        form itself, kept distinct from their profile contact above
                        (it may be a different phone/email/messenger). */}
                    {interest.contact ? (
                      <p className="text-muted-foreground">{interest.contact}</p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {/* An application names EITHER a placement OR a tier — never
                        both — so the label says which one this is (2026-07-29). */}
                    {interest.placement
                      ? t("interests.packagePlacement")
                      : interest.tier
                        ? t("interests.packageSponsorship")
                        : t("interests.package")}
                  </p>
                  {interest.placement ? (
                    <>
                      <p className="mt-1 text-sm font-medium text-foreground">{interest.placement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {interest.placement.priceAmd != null
                          ? formatMoney(interest.placement.priceAmd, "AMD", AMD_ONLY, locale)
                          : t("report.priceOnRequest")}
                      </p>
                    </>
                  ) : interest.tier ? (
                    <>
                      <p className="mt-1 text-sm font-medium text-foreground">{interest.tier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(interest.tier.priceAmd, "AMD", AMD_ONLY, locale)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">{t("interests.noPackage")}</p>
                  )}
                  {/* The sum the brand offers to pay (2026-07-29) — always AMD,
                      never converted to a visitor currency (that drift was the
                      bug the owner reported). */}
                  {interest.offerAmountAmd != null ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("interests.offerAmount")}:{" "}
                      <span className="font-medium text-foreground">
                        {formatMoney(interest.offerAmountAmd, "AMD", AMD_ONLY, locale)}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>

              {/* The brief (2026-07-26) — admin panel stays English-only. */}
              {interest.productInfo || interest.desiredTiming || interest.dealType ? (
                <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-3">
                  {interest.productInfo ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        What is being placed
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{interest.productInfo}</p>
                    </div>
                  ) : null}
                  {interest.desiredTiming ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Preferred timing
                      </p>
                      <p className="mt-1 text-sm text-foreground">{interest.desiredTiming}</p>
                    </div>
                  ) : null}
                  {interest.dealType ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Deal type</p>
                      <p className="mt-1 text-sm text-foreground">{DEAL_LABEL[interest.dealType] ?? interest.dealType}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

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
                        {event.offerAmountAmd != null ? (
                          <>
                            {" "}
                            · {t("interests.offerAmount")}: {formatMoney(event.offerAmountAmd, "AMD", AMD_ONLY, locale)}
                          </>
                        ) : null}
                        {event.body ? <p className="mt-0.5 whitespace-pre-wrap text-foreground">{event.body}</p> : null}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              {/* Answering is the seller's call, but a superadmin can answer
                  any application: they own the marketplace, and restricting it
                  to the exact owner id meant nobody could answer at all once
                  projects belong to creators. Publishers and moderators still
                  only see who decides. */}
              <div className="mt-4">
                {interest.project.ownerId === staff.id || staff.role === "SUPERADMIN" ? (
                  <RowActions
                    interestId={interest.id}
                    status={interest.status}
                    acceptLabel={t("interests.accept")}
                    declineLabel={t("interests.decline")}
                    answerPrompt={t("interests.answerPrompt")}
                  />
                ) : interest.status === "SENT" ? (
                  <p className="text-xs text-muted-foreground">{t("interests.ownerDecides")}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
