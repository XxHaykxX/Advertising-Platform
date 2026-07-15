"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { logout as staffLogout } from "@/app/admin/actions";
import { logout as memberLogout } from "@/app/account/actions";

/** The subset of the signed-in user the header needs to render the avatar +
 *  dropdown. Loaded server-side by `SiteHeader` (see site-header.tsx) since
 *  Header itself is a client component and can't read the session cookie. */
export type SiteHeaderUser = {
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
};

const STAFF_ROLES: Role[] = ["SUPERADMIN", "PUBLISHER", "MODERATOR"];

function useNav(t: ReturnType<typeof makeUI>) {
  return [
    { label: t("nav.catalog"), href: "/catalog" },
    { label: t("nav.portfolio"), href: "/portfolio" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.contact"), href: "/contact" },
  ] as const;
}

/** "Hayk Karapetyan" → "HK"; "Hayk" → "H"; falls back to the email's first
 *  letter when the name is blank. */
function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return email ? email[0].toUpperCase() : "?";
}

function Avatar({ user, onDark }: { user: SiteHeaderUser; onDark: boolean }) {
  const ring = onDark ? "ring-2 ring-white/25" : "ring-2 ring-border";
  if (user.avatar) {
    // eslint-disable-next-line @next/next/no-img-element -- small avatar, arbitrary user-uploaded URL
    return (
      <img
        src={user.avatar}
        alt=""
        className={cn("h-9 w-9 rounded-full object-cover", ring)}
      />
    );
  }
  return (
    <div
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground",
        ring
      )}
    >
      {initials(user.name, user.email)}
    </div>
  );
}

/** Avatar button + dropdown (own account link / logout) shown instead of the
 *  guest "Sign In / Up" button once a session is present. Modeled on
 *  CurrencySwitcher's outside-click / Escape pattern. */
function UserMenu({
  user,
  locale,
  onDark,
}: {
  user: SiteHeaderUser;
  locale: Locale;
  onDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = makeUI(locale);
  const isStaff = STAFF_ROLES.includes(user.role);
  const cabinetHref = isStaff ? "/admin" : "/account";
  const logoutAction = isStaff ? staffLogout : memberLogout;

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.name || user.email}
        className="block rounded-full transition-opacity hover:opacity-80"
      >
        <Avatar user={user} onDark={onDark} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[14rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg shadow-black/10"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.name || user.email}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Link
            href={cabinetHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("nav.cabinet")}
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
              {t("nav.logout")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
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

export function Header({
  user = null,
  locale = DEFAULT_LOCALE,
  currency = DEFAULT_CURRENCY,
}: {
  user?: SiteHeaderUser | null;
  locale?: Locale;
  currency?: CurrencyCode;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = makeUI(locale);
  const NAV = useNav(t);
  // Landing + About open on a dark cinematic hero — while the transparent
  // header floats over it, switch text to a light-on-dark scheme.
  const onDark = (pathname === "/" || pathname === "/about") && !scrolled && !menuOpen;

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
          <nav className="hidden items-center gap-8 lg:flex">
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
          <div className="hidden items-center gap-3 lg:flex">
            <LocaleSwitcher current={locale} onDark={onDark} />
            <CurrencySwitcher current={currency} onDark={onDark} />
            {user ? (
              <UserMenu user={user} locale={locale} onDark={onDark} />
            ) : (
              <Button asChild variant="primary" size="sm">
                <Link href="/login" className="group gap-2">
                  <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  {t("nav.signInUp")}
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl transition-colors lg:hidden",
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
            className="overflow-hidden border-b border-border bg-background lg:hidden"
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
                <div className="ml-auto flex items-center gap-2">
                  <LocaleSwitcher current={locale} />
                  <CurrencySwitcher current={currency} />
                </div>
              </div>
              {user ? (
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <Link
                    href={STAFF_ROLES.includes(user.role) ? "/admin" : "/account"}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary/10"
                  >
                    <Avatar user={user} onDark={false} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {user.name || user.email}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t("nav.cabinet")}
                      </span>
                    </span>
                  </Link>
                  <form
                    action={STAFF_ROLES.includes(user.role) ? staffLogout : memberLogout}
                  >
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild variant="primary" size="sm" onClick={() => setMenuOpen(false)}>
                    <Link href="/login" className="group gap-2">
                      <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      {t("nav.signInUp")}
                    </Link>
                  </Button>
                </div>
              )}
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
