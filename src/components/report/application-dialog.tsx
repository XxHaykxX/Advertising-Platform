"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitApplication } from "@/app/account/brand/actions";
import type { makeUI } from "@/lib/i18n";

/** Application popup (#23) for the report page's Express Interest button —
 *  same accessible-overlay shape as LogoutConfirmDialog (logout-button.tsx):
 *  role="dialog" + backdrop click / Escape to close. On success it shows the
 *  apply.success state in place of the form (manual Close, no auto-dismiss
 *  timer) and calls onSubmitted so the caller can flip the button to its
 *  "already applied" state right away — the dialog itself only closes when
 *  the brand dismisses it. */
/** The packages a brand can apply for, as shown in the picker. */
export type ApplicationTier = {
  id: number;
  name: string;
  priceDisplay: string;
  availableSlots: number | null;
};

/** Shortest application the seller is asked to answer. Enforced server-side
 *  too (submitApplication) — this constant only drives the hint and the
 *  disabled submit button. */
const MIN_MESSAGE = 20;

/** Armenia — the marketplace's home country, so an empty phone field starts
 *  here. A brand from elsewhere just types its own code over it. */
const DEFAULT_DIAL_CODE = "+374";

/** Exact national-number lengths per dial code. Armenia is always 8 digits
 *  after +374 (+37499105115), so a number one digit short or long is a typo,
 *  not a variant — and a typo'd number is a lead the seller can't call back.
 *  Codes not listed fall back to the loose international range. */
const PHONE_RULES: Array<{ code: string; digits: number }> = [{ code: "+374", digits: 8 }];

/** Accepts an international number: a "+", a country code, then the national
 *  part. Separators (spaces, dashes, parens) are ignored. Mirrored
 *  server-side — this copy only drives the hint and the disabled button. */
export function isValidPhone(value: string): boolean {
  const cleaned = value.replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{6,15}$/.test(cleaned)) return false;
  const rule = PHONE_RULES.find((r) => cleaned.startsWith(r.code));
  if (rule) return cleaned.length === rule.code.length + rule.digits;
  return cleaned.length >= 8 && cleaned.length <= 16;
}

export function ApplicationDialog({
  projectId,
  tiers = [],
  brandPhone = "",
  t,
  onClose,
  onSubmitted,
}: {
  projectId: number;
  /** Seeds the required phone field from the brand's profile. */
  brandPhone?: string;
  /** Sponsorship packages of this project — audit 2.3: an application used to
   *  carry no package at all, so nobody knew which placement (or price) it was
   *  about, and two brands could each be told the same exclusive slot was
   *  theirs. Empty list → the picker is hidden and the application is sent
   *  without one, exactly as before. */
  tiers?: ApplicationTier[];
  t: ReturnType<typeof makeUI>;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [message, setMessage] = useState("");
  // Required since 2026-07-26: the seller has to be able to call the buyer
  // back. If the profile already holds a usable number the popup doesn't ask
  // again — retyping what the account already knows is busywork. Otherwise the
  // field starts on Armenia's dial code, so the expected format is obvious.
  const hasProfilePhone = isValidPhone(brandPhone);
  const [phone, setPhone] = useState(hasProfilePhone ? brandPhone : DEFAULT_DIAL_CODE);
  // The brief (2026-07-26): what is being placed, when, and how the brand
  // intends to pay. Optional — a brand that writes it all in the message still
  // gets through — but asked for explicitly, because the seller was otherwise
  // answering a package worth millions off one paragraph of prose.
  const [productInfo, setProductInfo] = useState("");
  const [desiredTiming, setDesiredTiming] = useState("");
  const [dealType, setDealType] = useState("");
  // Preselect when there is only one package — a single-option dropdown is
  // just a click that can only go one way.
  const [tierId, setTierId] = useState<string>(tiers.length === 1 ? String(tiers[0].id) : "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitApplication(projectId, message, phone, tierId ? Number(tierId) : null, {
        productInfo,
        desiredTiming,
        dealType,
        phone,
      });
      if (!res.ok) {
        setError(res.error ?? t("apply.error"));
        return;
      }
      onSubmitted();
      setSent(true);
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-dialog-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 id="apply-dialog-title" className="text-base font-bold text-foreground">
          {t("apply.title")}
        </h2>

        {sent ? (
          <>
            <p className="mt-4 text-sm text-foreground">{t("apply.success")}</p>
            <div className="mt-6 flex justify-end">
              <Button type="button" variant="primary" onClick={onClose}>
                {t("apply.cancel")}
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            {tiers.length > 0 ? (
              <div>
                <label
                  htmlFor="apply-tier"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {t("apply.tierLabel")}
                </label>
                <select
                  id="apply-tier"
                  value={tierId}
                  onChange={(e) => setTierId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">{t("apply.tierNone")}</option>
                  {tiers.map((tier) => (
                    <option
                      key={tier.id}
                      value={tier.id}
                      // A package with every slot taken can still be picked —
                      // the seller may free one up — but say so plainly.
                      disabled={tier.availableSlots === 0}
                    >
                      {tier.name} · {tier.priceDisplay}
                      {tier.availableSlots === 0 ? ` · ${t("apply.tierSoldOut")}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label
                htmlFor="apply-product"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {t("apply.productLabel")}
              </label>
              <input
                id="apply-product"
                type="text"
                value={productInfo}
                onChange={(e) => setProductInfo(e.target.value)}
                placeholder={t("apply.productPlaceholder")}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="apply-timing"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {t("apply.timingLabel")}
                </label>
                <input
                  id="apply-timing"
                  type="text"
                  value={desiredTiming}
                  onChange={(e) => setDesiredTiming(e.target.value)}
                  placeholder={t("apply.timingPlaceholder")}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="apply-deal"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {t("apply.dealLabel")}
                </label>
                <select
                  id="apply-deal"
                  value={dealType}
                  onChange={(e) => setDealType(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">{t("apply.dealUnset")}</option>
                  <option value="CASH">{t("apply.dealCash")}</option>
                  <option value="BARTER">{t("apply.dealBarter")}</option>
                  <option value="BOTH">{t("apply.dealBoth")}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="apply-message" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("apply.messageLabel")}
              </label>
              <textarea
                id="apply-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("apply.messagePlaceholder")}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
              {/* A one-word "hi" used to be a valid application. The seller has
                  to answer it, so it has to say something. */}
              {message.trim().length > 0 && message.trim().length < MIN_MESSAGE ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("apply.messageTooShort").replace("{n}", String(MIN_MESSAGE))}
                </p>
              ) : null}
            </div>

            {/* A phone already on file is not asked for again — it is shown as
                a line the brand can read, not a box it has to refill. The
                field only appears when the profile has nothing usable. */}
            {hasProfilePhone ? (
              <p className="text-xs text-muted-foreground">
                {t("apply.phoneLabel")}: <span className="text-foreground">{brandPhone}</span>
              </p>
            ) : (
              <div>
                <label
                  htmlFor="apply-phone"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {t("apply.phoneLabel")}
                </label>
                <input
                  id="apply-phone"
                  type="tel"
                  required
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("apply.phonePlaceholder")}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                {phone.trim() !== "" && phone.trim() !== DEFAULT_DIAL_CODE && !isValidPhone(phone) ? (
                  <p className="mt-1 text-xs text-muted-foreground">{t("apply.phoneInvalid")}</p>
                ) : null}
              </div>
            )}

            {/* The free-text "Contact" box is gone: it existed because there
                was no phone field, and now it would only ask a second time for
                what the account already carries (email in the profile, phone
                above). Interest.contact keeps the phone. */}

            {error ? <p className="text-xs text-danger">{error}</p> : null}

            <div className="mt-2 flex items-center gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={pending}>
                {t("apply.cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={pending || message.trim().length < MIN_MESSAGE || !isValidPhone(phone)}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("apply.submit")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
