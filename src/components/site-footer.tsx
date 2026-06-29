"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, Phone, Mail } from "lucide-react";
import { LOCALES, makeUI, type Locale } from "@/lib/i18n";
import { setLocale } from "@/app/actions/locale";

const NAV = [
  { key: "nav.how", href: "/how-it-works" },
  { key: "nav.catalog", href: "/catalog" },
  { key: "nav.portfolio", href: "/portfolio" },
  { key: "nav.partners", href: "/partners" },
  { key: "nav.contact", href: "/contact" },
];
const PHONE_DISPLAY = "+7 999 000-00-00";
const PHONE_HREF = "tel:+79990000000";
const EMAIL = "hello@adplacement.example";
const WHATSAPP = "https://wa.me/79990000000";
const TELEGRAM = "https://t.me/placeholder";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm-4.5 6.13c-.21 0-.55.08-.84.4-.29.31-1.1 1.07-1.1 2.62 0 1.54 1.13 3.03 1.28 3.24.16.21 2.2 3.36 5.33 4.58 2.6 1.02 3.13.82 3.69.77.56-.05 1.82-.74 2.07-1.46.26-.72.26-1.34.18-1.46-.07-.13-.28-.21-.59-.36-.31-.16-1.82-.9-2.1-1-.28-.1-.49-.16-.69.16-.21.31-.79 1-.97 1.2-.18.21-.36.24-.66.08-.31-.16-1.29-.48-2.46-1.52-.91-.81-1.52-1.81-1.7-2.12-.18-.31-.02-.48.13-.63.14-.14.31-.36.46-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.69-1.67-.95-2.29-.25-.6-.5-.52-.69-.53-.18-.01-.39-.01-.6-.01Z" />
    </svg>
  );
}
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.94 4.7 18.9 19.05c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73L18.66 6.5c.37-.33-.08-.51-.58-.18L7.43 13.2l-4.57-1.43c-.99-.31-1.01-.99.21-1.47l17.87-6.89c.83-.31 1.55.18 1 1.29Z" />
    </svg>
  );
}

type Contacts = {
  phone: string;
  email: string;
  whatsapp: string;
  telegram: string;
};

export function SiteFooter({
  contacts,
  tagline,
  disclaimer,
  locale,
}: {
  contacts: Contacts;
  tagline?: string;
  disclaimer?: string;
  locale: Locale;
}) {
  const phoneDisplay = contacts.phone || PHONE_DISPLAY;
  const phoneHref = `tel:${(contacts.phone || PHONE_DISPLAY).replace(/\D/g, "")}`;
  const email = contacts.email || EMAIL;
  const whatsapp = contacts.whatsapp || WHATSAPP;
  const telegram = contacts.telegram || TELEGRAM;
  const ui = makeUI(locale);

  const router = useRouter();
  const [, startLang] = useTransition();

  function changeLang(l: Locale) {
    startLang(async () => {
      await setLocale(l);
      router.refresh();
    });
  }

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-[#080808]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[60%] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Clapperboard className="h-5 w-5" />
              </span>
              <span className="text-base font-bold tracking-tight text-foreground">
                AD<span className="text-primary">PLACEMENT</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              {tagline ||
                "Платформа размещения брендов в будущих фильмах и проектах. Бронируйте кадр заранее."}
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-sm font-semibold text-white/90">{ui("footer.nav")}</h4>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="text-sm text-white/55 transition-colors hover:text-foreground"
                  >
                    {ui(n.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-sm font-semibold text-white/90">{ui("footer.contacts")}</h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href={phoneHref} className="flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-foreground">
                  <Phone className="h-4 w-4" />
                  {phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-foreground">
                  <Mail className="h-4 w-4" />
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-3 pt-1">
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-primary/40 hover:text-white">
                  <WhatsAppIcon className="h-4.5 w-4.5" />
                </a>
                <a href={telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-primary/40 hover:text-white">
                  <TelegramIcon className="h-4.5 w-4.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal + lang */}
          <div>
            <h4 className="text-sm font-semibold text-white/90">{ui("footer.docs")}</h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/privacy" className="text-sm text-white/55 transition-colors hover:text-foreground">
                  {ui("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/consent" className="text-sm text-white/55 transition-colors hover:text-foreground">
                  {ui("footer.consent")}
                </Link>
              </li>
            </ul>
            <div className="mt-5 flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 w-max">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => changeLang(l)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    locale === l ? "bg-primary text-primary-foreground" : "text-white/55 hover:text-white"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© 2026 AD PLACEMENT. {ui("footer.rights")}</p>
          {disclaimer && <p>{disclaimer}</p>}
        </div>
      </div>
    </footer>
  );
}
