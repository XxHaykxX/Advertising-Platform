import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { TelegramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/brand-icons";
import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";

const CONTACTS = [
  { icon: Mail, label: "hello@igovazd.am", href: "mailto:hello@igovazd.am" },
  { icon: Phone, label: "+374 00 000 000", href: "tel:+37400000000" },
  { icon: TelegramIcon, label: "@igovazd", href: "https://t.me/igovazd" },
  { icon: WhatsAppIcon, label: "+374 00 000 000", href: "https://wa.me/37400000000" },
] as const;

const SOCIALS = [
  { icon: TelegramIcon, label: "Telegram", href: "https://t.me/igovazd" },
  { icon: WhatsAppIcon, label: "WhatsApp", href: "https://wa.me/37400000000" },
  { icon: YouTubeIcon, label: "YouTube", href: "https://youtube.com/@kinodaran" },
] as const;

/** Footer is rendered per-page by a server component (no shared root layout
 *  wrapper — see app/page.tsx), so it receives `locale`/`currency` as plain
 *  props from its server parent. That parent re-executes with the fresh
 *  cookie values on every router.refresh() after a locale/currency switch, so
 *  this stays in sync without any client-side cookie polling. */
export function Footer({
  locale = DEFAULT_LOCALE,
  currency = DEFAULT_CURRENCY,
  minimal = false,
}: {
  locale?: Locale;
  currency?: CurrencyCode;
  /** Compact footer for the signed-in member cabinet (brand/creator): drops the
   *  public-site nav columns (Product/Company/Legal) — they'd only bounce a
   *  cabinet-confined member back — keeping just wordmark, support contacts and
   *  the locale/currency switchers. */
  minimal?: boolean;
}) {
  const t = makeUI(locale);

  if (minimal) {
    return (
      <footer className="bg-section border-t border-border">
        <Container className="py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-lg font-bold text-foreground">
                <span className="text-primary">i</span>Govazd
              </span>
              <p className="mt-1 text-[13px] text-muted-foreground">
                © 2026 iGovazd. {t("footer.rights")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="mailto:hello@igovazd.am"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 shrink-0" />
                hello@igovazd.am
              </a>
              <a
                href="tel:+37400000000"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4 shrink-0" />
                +374 00 000 000
              </a>
              <a
                href="https://t.me/igovazd"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <TelegramIcon className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/37400000000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
              <div className="flex items-center gap-2">
                <LocaleSwitcher current={locale} openUp menuLeft />
                <CurrencySwitcher current={currency} openUp menuLeft />
              </div>
            </div>
          </div>
        </Container>
      </footer>
    );
  }

  return (
    <footer className="bg-section border-t border-border">
      <Container className="py-16 max-sm:py-12">
        {/* Top section: Wordmark and tagline */}
        <div className="mb-12">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-foreground">
              <span className="text-primary">i</span>Govazd
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>

        {/* Link columns */}
        <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t("footer.product")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/catalog"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("footer.browseProjects")}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("footer.howItWorks")}
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("footer.portfolio")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("footer.faq")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t("footer.company")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#about"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              {t("footer.contacts")}
            </h3>
            <ul className="space-y-3">
              {CONTACTS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="break-all">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social icons */}
        <div className="mb-6 flex gap-4">
          {SOCIALS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
            </a>
          ))}
        </div>

        {/* Bottom: Copyright + locale */}
        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-muted-foreground">
            © 2026 iGovazd. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-2">
            <LocaleSwitcher current={locale} openUp menuLeft />
            <CurrencySwitcher current={currency} openUp menuLeft />
          </div>
        </div>
      </Container>
    </footer>
  );
}
