"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle, Phone, Send, Video } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n";

const CONTACTS = [
  { icon: Mail, label: "hello@fpplacement.com", href: "mailto:hello@fpplacement.com" },
  { icon: Phone, label: "+374 00 000 000", href: "tel:+37400000000" },
  { icon: Send, label: "@fpplacement", href: "https://t.me/fpplacement" },
  { icon: MessageCircle, label: "+374 00 000 000", href: "https://wa.me/37400000000" },
] as const;

const SOCIALS = [
  { icon: Send, label: "Telegram", href: "https://t.me/fpplacement" },
  { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/37400000000" },
  { icon: Video, label: "YouTube", href: "https://youtube.com/@kinodaran" },
] as const;

/** Reads the `locale` cookie client-side, same convention as header.tsx —
 *  keeps Footer usable from both server pages and client views (e.g. catalog). */
function useLocaleFromCookie(): Locale {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
    const v = match ? decodeURIComponent(match[1]) : undefined;
    if (isLocale(v)) setLocale(v);
  }, []);
  return locale;
}

export function Footer() {
  const locale = useLocaleFromCookie();
  return (
    <footer className="bg-section border-t border-border">
      <Container className="py-16 max-sm:py-12">
        {/* Top section: Wordmark and tagline */}
        <div className="mb-12">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-foreground">
              <span className="text-primary">FP</span> Placement
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Discover premium brand placement opportunities in film and TV.
          </p>
        </div>

        {/* Link columns */}
        <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/catalog"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Browse Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  href="/partners"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Partners
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#about"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Contacts
            </h3>
            <ul className="space-y-3">
              {CONTACTS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
              <item.icon size={20} />
            </a>
          ))}
        </div>

        {/* Bottom: Copyright + locale */}
        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-muted-foreground">
            © 2026 FP Placement. All rights reserved.
          </p>
          <LocaleSwitcher current={locale} />
        </div>
      </Container>
    </footer>
  );
}
