import { Download, FileText } from "lucide-react";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

// The creator's sales deck (IA-44 §1, 2026-08-05). Optional: most projects
// won't have one, and a link that renders empty for them would be worse than
// no link at all — so it disappears entirely when unset.
//
// One place only, and that place is the hero's deal card, directly ABOVE the
// apply button (owner decision 2026-08-05). The deck is what a brand reaches
// for BEFORE it is ready to apply — to read the offer properly, or to forward
// it to whoever signs off — so it belongs next to the price and the deadline,
// not somewhere further down the page. Two earlier positions were tried and
// dropped: a standalone section between the key facts and the timeline (an
// orphan row with no owning block), and a closing row after the offer cards
// (a second copy right above the footer, which the owner cut as noise).
export function PresentationDownload({
  href,
  locale = DEFAULT_LOCALE,
}: {
  /** `project.presentationPdf`; empty string means the creator never uploaded one. */
  href: string;
  locale?: Locale;
}) {
  if (!href) return null;
  const t = makeUI(locale);

  return (
    <a
      href={href}
      // The file sits on our own origin, so `download` is honoured and the
      // PDF lands in the brand's downloads instead of taking over the tab
      // they were reading the offer in. target=_blank as well, so a browser
      // that ignores `download` for PDFs (Safari) still doesn't navigate away.
      download
      target="_blank"
      rel="noopener noreferrer"
      // An outlined button, not a bare text link: it sits above the primary
      // CTA, and at text weight it read as a caption on the button below
      // rather than as its own action. Border + tinted fill make it findable;
      // the fill stays a wash and the label stays foreground (not primary), so
      // the solid CTA under it still wins the eye.
      className="no-print flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
    >
      <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      {t("report.downloadPresentation")}
      <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  );
}
