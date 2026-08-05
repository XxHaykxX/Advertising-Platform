import { Download, FileText } from "lucide-react";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

// The creator's sales deck (IA-44 §1, 2026-08-05). Optional: most projects
// won't have one, and a section that renders an empty box for them would be
// worse than no section at all — so it disappears entirely when unset.
//
// Placed right after the key facts and before the offers: a brand that wants
// the deck wants it BEFORE reading the packages, and by then it has already
// seen what the project is.
export function PresentationDownload({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  const href = project.presentationPdf;
  if (!href) return null;
  const t = makeUI(locale);

  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 py-6 max-sm:px-4">
      <a
        href={href}
        // The file sits on our own origin, so `download` is honoured and the
        // PDF lands in the brand's downloads instead of taking over the tab
        // they were reading the offer in. target=_blank as well, so a browser
        // that ignores `download` for PDFs (Safari) still doesn't navigate away.
        download
        target="_blank"
        rel="noopener noreferrer"
        className="no-print flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto"
      >
        <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        {t("report.downloadPresentation")}
        <Download className="ml-auto h-4 w-4 shrink-0 sm:ml-1" aria-hidden="true" />
      </a>
    </section>
  );
}
