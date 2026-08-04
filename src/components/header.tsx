"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n-client";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";
import { PORTFOLIO_ENABLED } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";
import { logout as staffLogout } from "@/app/admin/actions";
import { logout as memberLogout } from "@/app/account/actions";

// framer-motion (~131 KB) lives entirely in mobile-nav-panel.tsx now, loaded
// only once someone actually opens the mobile menu — see the "Mobile
// slide-down panel" section below (bundle audit 2026-07-31).
const MobileNavPanel = dynamic(
  () => import("@/components/mobile-nav-panel").then((m) => m.MobileNavPanel),
  { ssr: false },
);

/** The subset of the signed-in user the header needs to render the avatar +
 *  dropdown. Loaded server-side by `SiteHeader` (see site-header.tsx) since
 *  Header itself is a client component and can't read the session cookie. */
export type SiteHeaderUser = {
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
};

const STAFF_ROLES: Role[] = ["SUPERADMIN", "PUBLISHER", "MODERATOR", "TRANSLATOR"];

/** Cabinet path for a signed-in user's role — staff (SUPERADMIN/PUBLISHER/
 *  MODERATOR) land in `/admin`, members (BRAND/CREATOR) in `/account`. A
 *  TRANSLATOR's only admin page is the dictionary editor, so send them there
 *  directly (the dashboard redirects anyway). Shared by UserMenu and the
 *  Wordmark so both routes stay in sync. */
function cabinetHrefFor(role: Role): string {
  if (role === "TRANSLATOR") return "/admin/i18n";
  return STAFF_ROLES.includes(role) ? "/admin" : "/account";
}

/** Pages opening on the dark cinematic hero (landing's own + every
 *  `PageHero` page) — see the `onDark` comment below. */
const DARK_HERO_PATHS = new Set([
  "/",
  "/about",
  "/catalog",
  "/portfolio",
  "/contact",
  "/how-it-works",
  "/for-creators",
  "/privacy",
  "/terms",
]);

function useNav(t: ReturnType<typeof makeUI>) {
  return [
    { label: t("nav.catalog"), href: "/catalog" },
    // Hidden behind PORTFOLIO_ENABLED while the owner keeps preparing cases
    // (see src/lib/feature-flags.ts) — the route itself 404s too.
    ...(PORTFOLIO_ENABLED ? [{ label: t("nav.portfolio"), href: "/portfolio" }] : []),
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

/** Exported for mobile-nav-panel.tsx, which the desktop header lazy-loads
 *  separately (see the MobileNavPanel dynamic import above). */
export function Avatar({ user, onDark }: { user: SiteHeaderUser; onDark: boolean }) {
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
  const cabinetHref = cabinetHrefFor(user.role);
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
          <LogoutButton
            action={logoutAction}
            locale={locale}
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </LogoutButton>
        </div>
      )}
    </div>
  );
}

function Wordmark({ onDark, user }: { onDark: boolean; user: SiteHeaderUser | null }) {
  return (
    <Link
      href={user ? cabinetHrefFor(user.role) : "/"}
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
  // Stays false until the mobile menu is opened for the first time, so
  // MobileNavPanel (and the framer-motion chunk behind it) is only mounted —
  // and only then fetched — once it's actually needed. AnimatePresence needs
  // it to stay mounted after that to animate subsequent closes.
  const [menuEverOpened, setMenuEverOpened] = useState(false);
  const pathname = usePathname();
  const t = makeUI(locale);
  const NAV = useNav(t);
  // Signed-in BRAND/CREATOR: header drops the marketing nav entirely — the
  // cabinet is reachable via the avatar menu / Wordmark instead
  // (see docs/superpowers/specs/2026-07-19-member-header-nav-design.md).
  const isMember = user != null && !STAFF_ROLES.includes(user.role);
  // Every page that opens on the dark cinematic PageHero (plus the landing
  // page, which has its own bespoke hero) — while the transparent header
  // floats over it, switch text to a light-on-dark scheme.
  const onDark =
    DARK_HERO_PATHS.has(pathname ?? "") && !scrolled && !menuOpen;
  // IA-32: a guest reading a project (or any page) used to land in the
  // cabinet after signing in via this header link, losing their place — carry
  // `?from=` the same way the report's own apply-button login links do
  // (report-interest-context.tsx). safeMemberRedirect() on the login/register
  // actions re-validates the target, so it's fine to be optimistic here; we
  // only guard against pointing the link at /login or /register themselves,
  // which would otherwise send someone signing in back to the auth flow they
  // just left. Path-only (no query string) — usePathname() doesn't carry one,
  // and every place that needs to preserve a query (e.g. `?offer=`) already
  // builds its own richer `from` value.
  const loginHref =
    pathname && pathname !== "/login" && pathname !== "/register"
      ? `/login?from=${encodeURIComponent(pathname)}`
      : "/login";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        // The bottom rule is a box-shadow, not a border: a 1px border would add
        // to the header's 64px height in flow, and the heroes pull themselves
        // under it with exactly -mt-16 (64px) — the leftover 1px showed as a
        // white hairline above every dark hero.
        "sticky top-0 z-50 transition-[color,background-color,box-shadow] duration-300",
        scrolled ? "bg-background/80 shadow-[0_1px_0_0_var(--border)] backdrop-blur-md" : "bg-transparent"
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Wordmark onDark={onDark} user={user} />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 lg:flex">
            {!isMember &&
              NAV.map((item) => (
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
            {/* Members (BRAND/CREATOR) get no language bar in the top nav — it
                lives in their cabinet footer instead. */}
            {!isMember && <LocaleSwitcher current={locale} onDark={onDark} />}
            {/* Currency switcher lives only in the footer now — removed from the
                top nav per product decision (V7). */}
            {user ? (
              <UserMenu user={user} locale={locale} onDark={onDark} />
            ) : (
              <Button asChild variant="primary" size="sm">
                <Link href={loginHref} className="group gap-2">
                  <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  {t("nav.signInUp")}
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setMenuEverOpened(true);
            }}
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

      {/* Mobile slide-down panel — unmounted (and framer-motion un-fetched)
          until the toggle above is pressed for the first time. */}
      {menuEverOpened && (
        <MobileNavPanel
          open={menuOpen}
          nav={NAV}
          isMember={isMember}
          user={user}
          locale={locale}
          loginHref={loginHref}
          // Audit 5.9: this used to hardcode /admin for every staff role,
          // sending a TRANSLATOR through an extra redirect hop (the dashboard
          // bounces that role straight to /admin/i18n anyway). cabinetHrefFor
          // is the same helper the desktop UserMenu/Wordmark already use.
          cabinetHref={user ? cabinetHrefFor(user.role) : ""}
          logoutAction={user && STAFF_ROLES.includes(user.role) ? staffLogout : memberLogout}
          signInLabel={t("nav.signInUp")}
          cabinetLabel={t("nav.cabinet")}
          logoutLabel={t("nav.logout")}
          onNavigate={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
