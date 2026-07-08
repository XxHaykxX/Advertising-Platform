"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, MessageCircle, Phone, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function useNav(t: ReturnType<typeof makeUI>) {
  return [
    { label: t("nav.catalog"), href: "/catalog" },
    { label: t("nav.portfolio"), href: "/portfolio" },
    { label: t("nav.partners"), href: "/partners" },
    { label: t("nav.contact"), href: "/contact" },
  ] as const;
}

function useContactLinks(t: ReturnType<typeof makeUI>) {
  return [
    { icon: Phone, label: t("nav.callUs"), href: "tel:+37400000000" },
    { icon: Send, label: "Telegram", href: "https://t.me/igovazd" },
    { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/37400000000" },
  ] as const;
}

function Wordmark({ onDark }: { onDark: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "text-lg font-bold tracking-tight",
        onDark ? "text-white" : "text-foreground"
      )}
    >
      <span className="text-primary">i</span>Govazd
    </Link>
  );
}

export function Header({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = makeUI(locale);
  const NAV = useNav(t);
  const CONTACT_LINKS = useContactLinks(t);
  // Landing hero is a dark cinematic poster wall — while the transparent
  // header floats over it, switch text to a light-on-dark scheme.
  const onDark = pathname === "/" && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Wordmark onDark={onDark} />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                  onDark ? "text-white/75" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster (desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            <div className={cn("flex items-center gap-1 border-r pr-3", onDark ? "border-white/15" : "border-border")}>
              {CONTACT_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={item.label}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl transition-colors hover:bg-primary/10 hover:text-primary",
                    onDark ? "text-white/75" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <LocaleSwitcher current={locale} onDark={onDark} />
            {/* Brand sign-in disabled until brand auth is built — kept for
                restore. See docs/superpowers/plans parity plan + /login page.
            <Link
              href="/login"
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                onDark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
              )}
            >
              {t("nav.signIn")}
            </Link>
            */}
            <Button asChild variant="primary" size="sm">
              <Link href="/catalog">{t("nav.browseProjects")}</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl transition-colors md:hidden",
              onDark ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
            )}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile slide-down panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-border bg-background md:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-4">
                {CONTACT_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    aria-label={item.label}
                    className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <item.icon className="h-4 w-4" />
                  </a>
                ))}
                <LocaleSwitcher current={locale} className="ml-auto" />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                {/* Brand sign-in disabled until brand auth is built — kept for restore.
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {t("nav.signIn")}
                </Link>
                */}
                <Button asChild variant="primary" size="sm" onClick={() => setMenuOpen(false)}>
                  <Link href="/catalog">{t("nav.browseProjects")}</Link>
                </Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
