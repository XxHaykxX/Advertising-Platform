"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { useModalDialog } from "@/lib/use-modal-dialog";
import { submitApplication } from "@/app/account/brand/actions";
import type { makeUI } from "@/lib/i18n-client";
import { NO_OFFER_KEY, offerValue, parseOfferValue } from "@/lib/offer-value";
import { RequiredMark } from "@/components/ui/field";

/** Application popup (#23) for the report page's Express Interest button —
 *  same accessible-overlay shape as LogoutConfirmDialog (logout-button.tsx):
 *  role="dialog" + backdrop click / Escape to close. On success it shows the
 *  apply.success state in place of the form (manual Close, no auto-dismiss
 *  timer) and calls onSubmitted so the caller can flip the button to its
 *  "already applied" state right away — the dialog itself only closes when
 *  the brand dismisses it. */
/** One thing a brand can apply for. Since 2026-07-29 that is EITHER a product
 *  placement (the brand inside the story) or a sponsorship package (logo,
 *  credits, premiere) — the picker used to list packages only, so a brand that
 *  came for a placement, which is what the catalog advertises first, could
 *  only describe it in prose and the seller had to guess which scene and at
 *  what price. */
export type ApplicationOffer = {
  id: number;
  kind: "PLACEMENT" | "TIER";
  name: string;
  /** Formatted in AMD — the currency the creator priced in. Null for a
   *  placement left unpriced, which the picker shows as "on request". */
  priceNative: string | null;
  /** The same price in the visitor's currency, or null when they are already
   *  browsing in AMD (nothing to convert) or the price is on request. Shown as
   *  an aside, never as the sum being applied for. */
  priceConverted: string | null;
  availableSlots: number | null;
};

/** Shortest application the seller is asked to answer, when one is written at
 *  all. Enforced server-side too (submitApplication) — this constant only
 *  drives the hint and the disabled submit button. */
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

/** Digits only, grouped in threes with a non-breaking space — 2 500 000 reads
 *  as a price, 2500000 reads as a serial number. Same treatment the admin
 *  price fields got (form-shared.groupDigits); duplicated rather than imported
 *  so the public bundle doesn't pull in an admin module. */
function formatAmount(digits: string): string {
  // NBSP, not a plain space — a price must not wrap mid-number.
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

export function ApplicationDialog({
  projectId,
  offers = [],
  initialOffer = "",
  appliedOffers,
  brandPhone = "",
  t,
  onClose,
  onSubmitted,
}: {
  projectId: number;
  /** offerValue of the card the visitor clicked ("P:5"), preselected in the
   *  picker. Empty when the popup was opened from a page-level button, which
   *  names no particular offer. */
  initialOffer?: string;
  /** offerKeys this brand has already applied for on this project. Sending
   *  replaces an application only when the picked offer is one of them —
   *  applying for a second placement now creates a second application rather
   *  than overwriting the first (owner decision 2026-07-29). */
  appliedOffers?: ReadonlySet<string>;
  /** Seeds the required phone field from the brand's profile. */
  brandPhone?: string;
  /** What this project sells — placements first, then sponsorship packages.
   *  Audit 2.3: an application used to carry no offer at all, so nobody knew
   *  which placement (or price) it was about, and two brands could each be
   *  told the same exclusive slot was theirs. Empty list → the picker is
   *  hidden and the application is sent without one, exactly as before. */
  offers?: ApplicationOffer[];
  t: ReturnType<typeof makeUI>;
  onClose: () => void;
  /** Reports the offerKey the application was sent for, so the page can flip
   *  that one card — and only that one — to "already sent". */
  onSubmitted: (offer: string) => void;
}) {
  const [message, setMessage] = useState("");
  // Required since 2026-07-26: the seller has to be able to call the buyer
  // back. If the profile already holds a usable number the popup doesn't ask
  // again — retyping what the account already knows is busywork. Otherwise the
  // field starts on Armenia's dial code, so the expected format is obvious.
  const hasProfilePhone = isValidPhone(brandPhone);
  const [phone, setPhone] = useState(hasProfilePhone ? brandPhone : DEFAULT_DIAL_CODE);
  // The brief (2026-07-26): what is being placed, when, and how the brand
  // intends to pay. "What is being placed" is the one the seller cannot work
  // without, so since 2026-07-29 it is the required field and the free-text
  // message is the optional one — it used to be the other way round.
  const [productInfo, setProductInfo] = useState("");
  const [desiredTiming, setDesiredTiming] = useState("");
  const [dealType, setDealType] = useState("");
  // What the brand is prepared to pay, digits only, in AMD. Kept as a string
  // so the field can be genuinely empty ("didn't say") rather than 0.
  const [offerAmount, setOfferAmount] = useState("");
  const placements = useMemo(() => offers.filter((o) => o.kind === "PLACEMENT"), [offers]);
  const tiers = useMemo(() => offers.filter((o) => o.kind === "TIER"), [offers]);
  // Preselected by the card the visitor clicked; failing that, when there is
  // only one thing on sale — a single-option dropdown is just a click that can
  // only go one way.
  const [selected, setSelected] = useState<string>(
    initialOffer || (offers.length === 1 ? offerValue(offers[0]) : ""),
  );
  const selectedOffer = offers.find((o) => offerValue(o) === selected) ?? null;
  // Focus into the dialog, Tab kept inside it, focus back on the trigger when
  // it closes, and the page behind frozen while it is open — see the hook.
  const panelRef = useRef<HTMLDivElement>(null);
  useModalDialog(panelRef);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Sending now would overwrite an application that already exists for the
  // offer currently picked. "" (nothing picked) is its own slot — a brand can
  // hold one unattached application per project, and re-sending replaces that.
  const replaces = (appliedOffers ?? new Set<string>()).has(selected || NO_OFFER_KEY);

  const trimmedProduct = productInfo.trim();
  const trimmedMessage = message.trim();
  const canSubmit =
    trimmedProduct.length > 0 &&
    (trimmedMessage.length === 0 || trimmedMessage.length >= MIN_MESSAGE) &&
    isValidPhone(phone);

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
      const res = await submitApplication(projectId, message, phone, parseOfferValue(selected), {
        productInfo,
        desiredTiming,
        dealType,
        phone,
        offerAmountAmd: offerAmount ? Number(offerAmount) : null,
      });
      if (!res.ok) {
        setError(res.error ?? t("apply.error"));
        return;
      }
      onSubmitted(selected || NO_OFFER_KEY);
      setSent(true);
    });
  }

  /** "Package · 2 500 000 ֏", or the on-request wording for an unpriced
   *  placement. The converted figure deliberately stays out of the option
   *  label: it belongs under the picker, marked as a rate that moves. */
  function optionLabel(offer: ApplicationOffer): string {
    const price = offer.priceNative ?? t("report.priceOnRequest");
    const soldOut = offer.availableSlots === 0 ? ` · ${t("apply.tierSoldOut")}` : "";
    return `${offer.name} · ${price}${soldOut}`;
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div
      // data-lenis-prevent: the public side runs Lenis, which owns the wheel
      // globally and preventDefault()s it. Without this a wheel anywhere over
      // the popup — including its own scrollable form, which is taller than
      // 70vh on a phone — scrolls the report underneath instead.
      data-lenis-prevent
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-dialog-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        // tabIndex -1: something for the focus trap to fall back on before the
        // form's own fields (or after they are replaced by the success text).
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl outline-none"
      >
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
          <form onSubmit={handleSubmit} className="mt-4 flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
            {/* An application belongs to ONE offer, and re-sending for that
                same offer replaces it — including an answer the creator has
                already given. Picking a different offer creates a second
                application and leaves the first alone, so the warning follows
                the picker rather than sitting there for the whole project. */}
            {replaces ? (
              <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
                {t("apply.replaceWarning")}
              </p>
            ) : null}
            {offers.length > 0 ? (
              <div>
                <label htmlFor="apply-offer" className={labelClass}>
                  {t("apply.offerLabel")}
                </label>
                <select
                  id="apply-offer"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t("apply.tierNone")}</option>
                  {/* Placements lead: an in-story integration is what most
                      brands arrive for, sponsorship is the second offer. The
                      groups are labelled because the two are priced and
                      delivered differently. */}
                  {placements.length > 0 ? (
                    <optgroup label={t("apply.offerGroupPlacements")}>
                      {placements.map((offer) => (
                        <option
                          key={offerValue(offer)}
                          value={offerValue(offer)}
                          // A sold-out row can still be picked — the seller may
                          // free a slot up — but say so plainly.
                          disabled={offer.availableSlots === 0}
                        >
                          {optionLabel(offer)}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {tiers.length > 0 ? (
                    <optgroup label={t("apply.offerGroupTiers")}>
                      {tiers.map((offer) => (
                        <option
                          key={offerValue(offer)}
                          value={offerValue(offer)}
                          disabled={offer.availableSlots === 0}
                        >
                          {optionLabel(offer)}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
                {/* The visitor may be browsing in EUR while the seller prices
                    in AMD. Show the conversion, but as an approximation tied to
                    today's rate — the deal is the AMD figure above. */}
                {selectedOffer?.priceConverted ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("apply.approxRate").replace("{x}", selectedOffer.priceConverted)}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <label htmlFor="apply-product" className={labelClass}>
                {t("apply.productLabel")}
                <RequiredMark />
              </label>
              <input
                id="apply-product"
                type="text"
                required
                value={productInfo}
                onChange={(e) => setProductInfo(e.target.value)}
                placeholder={t("apply.productPlaceholder")}
                className={inputClass}
              />
              {/* IA-29: the only required field in the form, and the button
                  gave no sign of it — say so here, the same way the message
                  field already explains its own 20-character floor below. */}
              {trimmedProduct.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">{t("apply.productRequiredHint")}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="apply-offer-amount" className={labelClass}>
                  {t("apply.offerAmountLabel")}
                </label>
                <input
                  id="apply-offer-amount"
                  type="text"
                  inputMode="numeric"
                  value={formatAmount(offerAmount)}
                  // Digits only: the grouping spaces are display, and a stray
                  // letter would reach the server as NaN.
                  onChange={(e) => setOfferAmount(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="0"
                  className={inputClass}
                />
                {/* The reason this field exists: a placement priced "on
                    request" is an invitation for the brand to name a sum. */}
                <p className="mt-1 text-xs text-muted-foreground">{t("apply.offerAmountHint")}</p>
              </div>
              <div>
                <label htmlFor="apply-deal" className={labelClass}>
                  {t("apply.dealLabel")}
                </label>
                <select
                  id="apply-deal"
                  value={dealType}
                  onChange={(e) => setDealType(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t("apply.dealUnset")}</option>
                  <option value="CASH">{t("apply.dealCash")}</option>
                  <option value="BARTER">{t("apply.dealBarter")}</option>
                  <option value="BOTH">{t("apply.dealBoth")}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="apply-timing" className={labelClass}>
                {t("apply.timingLabel")}
              </label>
              <input
                id="apply-timing"
                type="text"
                value={desiredTiming}
                onChange={(e) => setDesiredTiming(e.target.value)}
                placeholder={t("apply.timingPlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="apply-message" className={labelClass}>
                {t("apply.messageLabel")}
              </label>
              <textarea
                id="apply-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("apply.messagePlaceholder")}
                className={inputClass}
              />
              {/* Optional, but a one-word "hi" is not worth the seller reading:
                  once something is typed it has to say something. IA-29: the
                  hint used to read as an unconditional demand ("please
                  describe... at least 20 characters") that contradicted the
                  "(optional)" label above it — reworded so it only reads as a
                  floor on what's already been typed. */}
              {trimmedMessage.length > 0 && trimmedMessage.length < MIN_MESSAGE ? (
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
                <label htmlFor="apply-phone" className={labelClass}>
                  {t("apply.phoneLabel")}
                  <RequiredMark />
                </label>
                {/* Country picker with the flag and dial code (2026-07-29) —
                    the field used to be a bare text box where the whole
                    "+374 …" had to be typed, and a number without a country
                    code is a lead nobody can call. */}
                <PhoneInput id="apply-phone" required value={phone} onChange={setPhone} />
                {/* IA-29: shown as soon as the number isn't a real one yet —
                    including the untouched default dial code — not only
                    after it's been typed into and is still wrong. Otherwise a
                    visitor who never touches this field sees no reason at all
                    for the button staying disabled. */}
                {!isValidPhone(phone) ? (
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
              <Button type="submit" variant="primary" className="flex-1" disabled={pending || !canSubmit}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("apply.submit")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
