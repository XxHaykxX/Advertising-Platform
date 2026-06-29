"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, Menu, X, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LOCALES, makeUI, type Locale } from "@/lib/i18n";
import { setLocale } from "@/app/actions/locale";

/* ── Config ──────── */
const NAV = [
  { key: "nav.how", href: "/how-it-works" },
  { key: "nav.catalog", href: "/catalog" },
  { key: "nav.portfolio", href: "/portfolio" },
  { key: "nav.partners", href: "/partners" },
  { key: "nav.contact", href: "/contact" },
] as const;
const PHONE = "+7 999 000-00-00";
const PHONE_HREF = `tel:${PHONE.replace(/\D/g, "")}`;
const WHATSAPP = "https://wa.me/79990000000";
const TELEGRAM = "https://t.me/placeholder";
const CTA_HREF = "/contact";

/* lucide has no WhatsApp/Telegram brand marks → inline SVG */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.17 0 4.2.85 5.74 2.38a8.06 8.06 0 0 1 2.38 5.73c0 4.48-3.65 8.12-8.12 8.12a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.19-.31a8.06 8.06 0 0 1-1.24-4.29c0-4.47 3.64-8.11 8.12-8.11Zm-4.5 4.33c-.21 0-.55.08-.84.4-.29.31-1.1 1.07-1.1 2.62 0 1.54 1.13 3.03 1.28 3.24.16.21 2.2 3.36 5.33 4.58 2.6 1.02 3.13.82 3.69.77.56-.05 1.82-.74 2.07-1.46.26-.72.26-1.34.18-1.46-.07-.13-.28-.21-.59-.36-.31-.16-1.82-.9-2.1-1-.28-.1-.49-.16-.69.16-.21.31-.79 1-.97 1.2-.18.21-.36.24-.66.08-.31-.16-1.29-.48-2.46-1.52-.91-.81-1.52-1.81-1.7-2.12-.18-.31-.02-.48.13-.63.14-.14.31-.36.46-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.69-1.67-.95-2.29-.25-.6-.5-.52-.69-.53-.18-.01-.39-.01-.6-.01Z" />
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

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="На главную">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_rgba(229,9,20,0.8)]">
        <Clapperboard className="h-5 w-5" />
      </span>
      <span className="text-base font-bold tracking-tight text-foreground">
        AD<span className="text-primary">PLACEMENT</span>
      </span>
    </Link>
  );
}

type Contacts = {
  phone: string;
  whatsapp: string;
  telegram: string;
};

export function SiteHeader({
  contacts,
  locale,
}: {
  contacts: Contacts;
  locale: Locale;
}) {
  const phoneHref = `tel:${(contacts.phone || PHONE).replace(/\D/g, "")}`;
  const whatsapp = contacts.whatsapp || WHATSAPP;
  const telegram = contacts.telegram || TELEGRAM;
  const ui = makeUI(locale);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startLang] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function changeLang(l: Locale) {
    startLang(async () => {
      await setLocale(l);
      router.refresh();
    });
  }

  return (
    <motion.header
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-[#0b0b0b]/80 shadow-2xl backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
          <Wordmark />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 xl:flex">
            {NAV.map((item, i) => {
              const active = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <Link
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-foreground ${
                      active ? "text-foreground" : "text-white/75"
                    }`}
                  >
                    {ui(item.key)}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="hidden items-center gap-3 xl:flex">
            <div className="flex items-center gap-2">
              <motion.a
                href={phoneHref}
                aria-label="Позвонить"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <Phone className="h-[18px] w-[18px]" />
              </motion.a>
              <motion.a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </motion.a>
              <motion.a
                href={telegram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <TelegramIcon className="h-5 w-5" />
              </motion.a>
            </div>
            {/* Language switcher */}
            <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    locale === l
                      ? "bg-primary text-primary-foreground"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link
              href={CTA_HREF}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-[0_6px_20px_-8px_rgba(229,9,20,0.7)] transition-all hover:scale-105 hover:bg-red-600"
            >
              {ui("nav.cta")}
            </Link>
          </div>

          {/* Mobile burger + Sheet */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Открыть меню"
                className="text-foreground hover:bg-white/10 xl:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full border-l border-white/10 bg-[#0b0b0b]/98 p-0 backdrop-blur-xl sm:max-w-sm [&>button:last-child]:hidden"
            >
              <SheetTitle className="sr-only">Меню</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <Wordmark />
                  <button
                    onClick={() => setMenuOpen(false)}
                    aria-label="Закрыть меню"
                    className="grid h-10 w-10 place-items-center rounded-md border border-white/15 bg-white/5 text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {NAV.map((item, i) => (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i + 0.1 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="block border-b border-white/5 pb-4 text-lg font-medium text-foreground transition-colors hover:text-primary"
                        >
                          {ui(item.key)}
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-6">
                    <a
                      href={phoneHref}
                      aria-label="Позвонить"
                      className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                      <WhatsAppIcon className="h-5 w-5" />
                    </a>
                    <a
                      href={telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Telegram"
                      className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                      <TelegramIcon className="h-5 w-5" />
                    </a>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    {LOCALES.map((l) => (
                      <button
                        key={l}
                        onClick={() => changeLang(l)}
                  type="button"
                        className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all ${
                          locale === l
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                        }`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <Link
                    href={CTA_HREF}
                    onClick={() => setMenuOpen(false)}
                    className="mt-6 block w-full rounded-full bg-primary py-4 text-center text-lg font-semibold text-primary-foreground"
                  >
                    {ui("nav.cta")}
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
