import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { TelegramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/brand-icons";
import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

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
 *  wrapper — see app/page.tsx), so it receives `locale` as a plain prop from
 *  its server parent. That parent re-executes with the fresh cookie value on
 *  every router.refresh() after a locale switch, so this stays in sync
 *  without any client-side cookie polling. */
export function Footer({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);
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
                  href="/partners"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("footer.partners")}
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
          <LocaleSwitcher current={locale} openUp />
        </div>
      </Container>
    </footer>
  );
}
