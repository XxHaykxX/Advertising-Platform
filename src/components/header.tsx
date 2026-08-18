"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Check, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";
import { DEFAULT_LOCALE, useUI, type Locale } from "@/lib/i18n-client";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";
import { ADS_ENABLED, PORTFOLIO_ENABLED } from "@/lib/feature-flags";
import {
  AD_CHANNELS,
  AD_CHANNEL_GROUPS,
  AD_GROUP_SLUGS,
  adChannelsByGroup,
  type AdChannelGroup,
} from "@/lib/ad-channels";
import { canSell } from "@/lib/auth/capabilities";
import { useDismissable } from "@/lib/use-dismissable";
import { useBodyScrollLock } from "@/lib/body-scroll-lock";
import { cn } from "@/lib/utils";
import { logout as staffLogout } from "@/app/admin/actions";
import {
  logout as memberLogout,
  enableBrandSide,
  enableCreatorSide,
  type EnableSideResult,
} from "@/app/account/actions";

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
  isCreator: boolean;
  isBrand: boolean;
  // Subtitle counts for the side-switcher panel ("Создатель · 2 проекта" /
  // "Бренд · 1 заявка") — only fetched for the side that's actually on.
  projectCount: number;
  interestCount: number;
};

const STAFF_ROLES: Role[] = ["SUPERADMIN", "PUBLISHER", "MODERATOR", "TRANSLATOR"];

/** Cabinet path for a signed-in user — staff (SUPERADMIN/PUBLISHER/
 *  MODERATOR) land in `/admin`, members in whichever cabinet they can sell
 *  from (or /account/brand if they can't). A TRANSLATOR's only admin page is
 *  the dictionary editor, so send them there directly (the dashboard
 *  redirects anyway). Takes the whole user, not just `role`, since 2026-08-11:
 *  a dual member's role no longer says which side to land on. Shared by
 *  UserMenu and the Wordmark so both routes stay in sync. */
function cabinetHrefFor(user: SiteHeaderUser): string {
  if (user.role === "TRANSLATOR") return "/admin/i18n";
  if (STAFF_ROLES.includes(user.role)) return "/admin";
  return canSell(user) ? "/account" : "/account/brand";
}

/** Pages opening on the dark cinematic hero (landing's own + every
 *  `PageHero` page) — see the `onDark` comment below. */
const DARK_HERO_PATHS = new Set([
  "/",
  "/about",
  "/portfolio",
  "/contact",
  "/how-it-works",
  "/for-creators",
  "/privacy",
  "/terms",
  // The four group pages and the nine per-channel pages (src/lib/ad-channels.ts)
  // — spread from the directory so a tenth channel doesn't need remembering
  // here. /ads itself is a redirect and never renders a hero.
  ...AD_CHANNEL_GROUPS.map((g) => `/ads/${AD_GROUP_SLUGS[g]}`),
  ...AD_CHANNELS.map((c) => `/ads/${c.slug}`),
]);

/** One heading inside the "Advertising" dropdown — a channel group plus its
 *  channels, in adChannelsByGroup() order. Shared with MobileNavPanel, which
 *  renders the same channels as a flat indented list instead of grouping them
 *  under headings (see mobile-nav-panel.tsx, plan's C2 — no accordion). */
export type NavChildGroup = {
  group: AdChannelGroup;
  groupLabel: string;
  /** The group's own page — the heading is a link, not just a caption, since
   *  a group lists all of its channels' inventory at once (2026-08-18). */
  groupHref: string;
  channels: { code: string; label: string; href: string }[];
};

export type NavItem = { label: string; href: string; children?: NavChildGroup[] };

function useNav(t: ReturnType<typeof useUI>): NavItem[] {
  return [
    // Sections and sub-sections (2026-08-18): the four groups are the headings
    // and each one's channels sit under it, in both the desktop dropdown
    // (AdsNavDropdown below) and the mobile panel. Both levels are real pages,
    // so both are links.
    //
    // `href` is where the item points with the dropdown unavailable — with
    // ADS_ENABLED off there are no channel pages to open, and /ads redirects to
    // the homepage section holding the four type cards. The item itself is NOT
    // behind the flag: gating it would leave the site with no link to its own
    // inventory at all.
    {
      label: t("nav.ads"),
      href: "/#ad-types",
      ...(ADS_ENABLED
        ? {
            children: adChannelsByGroup().map(({ group, channels }) => ({
              group,
              groupLabel: t(`adGroup.${group}`),
              groupHref: `/ads/${AD_GROUP_SLUGS[group]}`,
              channels: channels.map((c) => ({
                code: c.code,
                label: t(`adChannel.${c.code}`),
                href: `/ads/${c.slug}`,
              })),
            })),
          }
        : {}),
    },
    // Hidden behind PORTFOLIO_ENABLED while the owner keeps preparing cases
    // (see src/lib/feature-flags.ts) — the route itself 404s too.
    ...(PORTFOLIO_ENABLED ? [{ label: t("nav.portfolio"), href: "/portfolio" }] : []),
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.contact"), href: "/contact" },
  ];
}

/** Desktop-only dropdown under "Advertising" (C2/C3) — a plain `<ul>` of
 *  links, not `role="menu"`: that role promises arrow-key navigation, which
 *  neither this list nor UserMenu's actually implements, and a link list
 *  already gets correct Tab order and screen-reader announcement for free.
 *  Opens on click (not hover — hover-only menus are the classic touch-device
 *  failure), closes on outside click/Escape/route change, and Escape returns
 *  focus to the trigger button. */
function AdsNavDropdown({
  item,
  t,
  onDark,
}: {
  item: NavItem & { children: NavChildGroup[] };
  t: ReturnType<typeof useUI>;
  onDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef, triggerRef);

  // Close the menu on navigation. Adjusted during render, not from an effect,
  // so it is closed in the same commit that renders the new route.
  const [seenPathname, setSeenPathname] = useState(pathname);
  if (seenPathname !== pathname) {
    setSeenPathname(pathname);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
          onDark ? "text-white/75" : "text-muted-foreground"
        )}
      >
        {item.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        // Two columns, not one (2026-08-10): nine channels under five group
        // headings plus the two full-width rows stack to 584px, and 70vh on a
        // 720px-tall laptop is 502 — the catalog row, the whole point of the
        // panel, sat below the fold. Side by side it's ~330 and fits every
        // screen; max-h stays as the backstop.
        <ul className="absolute left-0 top-full z-50 mt-2 grid max-h-[70vh] w-[30rem] grid-cols-2 gap-x-2 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg shadow-black/10">
          {/* The full-width "everything at once" row that used to open this
              panel is gone with the /ads list it led to (2026-08-18). The four
              group headings below are the top level now — and they are links,
              because a group is a page listing all of its channels. */}
          {item.children.map((g) => (
            <li key={g.group}>
              <Link
                href={g.groupHref}
                onClick={() => setOpen(false)}
                className="block px-4 pt-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
              >
                {g.groupLabel}
              </Link>
              <ul>
                {g.channels.map((c) => (
                  <li key={c.code}>
                    <Link
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small avatar, arbitrary user-uploaded URL
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

/** One row of the side-switcher panel (A5, 2026-08-11) — either a link into
 *  a side that's already on (checkmark if it's the one currently open, a
 *  subtitle count under the name) or, when that side is off, an invitation
 *  that turns it on via the given action. Both rows share this shape so
 *  Instagram's "both always visible" fix isn't undone by a special case for
 *  the off side. */
export function SideRow({
  active,
  href,
  label,
  subtitle,
  inviteLabel,
  onInvite,
  pending,
  onNavigate,
  user,
  onDark,
}: {
  active: boolean;
  href: string | null;
  label: string;
  subtitle: string | null;
  inviteLabel: string;
  onInvite: () => void;
  pending: boolean;
  onNavigate: () => void;
  user: SiteHeaderUser;
  onDark: boolean;
}) {
  const content = (
    <>
      <span className="grid h-4 w-4 shrink-0 place-items-center">
        {active && <Check className="h-4 w-4 text-primary" />}
      </span>
      <Avatar user={user} onDark={onDark} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle ?? <span className="text-primary">{inviteLabel}</span>}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        role="menuitem"
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-primary/10"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={pending}
      onClick={onInvite}
      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary/10 disabled:opacity-60"
    >
      {content}
    </button>
  );
}

/** Avatar button + dropdown (side switcher / own account link / logout)
 *  shown instead of the guest "Sign In / Up" button once a session is
 *  present. Modeled on CurrencySwitcher's outside-click / Escape pattern. */
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
  const t = useUI(locale);
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const isStaff = STAFF_ROLES.includes(user.role);
  const cabinetHref = cabinetHrefFor(user);
  const logoutAction = isStaff ? staffLogout : memberLogout;
  // Which cabinet the switcher panel checkmarks — only meaningful inside
  // /account/**, same "mode lives in the URL, nowhere else" rule as A2's
  // redirects; elsewhere neither row claims to be the active one.
  const brandActive = pathname?.startsWith("/account/brand") ?? false;

  function enableSide(action: () => Promise<EnableSideResult>) {
    startTransition(async () => {
      try {
        const res = await action();
        if (res.ok) window.location.assign(res.redirect);
      } catch {
        // Same fallback as LogoutButton: reload so the app re-evaluates
        // auth/side state instead of leaving the row stuck disabled.
        window.location.reload();
      }
    });
  }

  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, ref);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.name || user.email}
        className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
      >
        <Avatar user={user} onDark={onDark} />
        <span
          className={cn(
            "hidden max-w-[9rem] truncate text-sm font-medium xl:inline",
            onDark ? "text-white" : "text-foreground"
          )}
        >
          {user.name || user.email}
        </span>
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
          {/* Side switcher (A5) — both rows always shown once either side is
              on; nothing renders for staff or a member with neither flag set
              (can't happen for an approved member, only for staff, whose
              isCreator/isBrand are both false). */}
          {(user.isCreator || user.isBrand) && (
            <div className="border-b border-border py-1">
              <SideRow
                user={user}
                onDark={onDark}
                active={user.isCreator && !brandActive}
                href={user.isCreator ? "/account" : null}
                label={t("nav.sideCreator")}
                subtitle={user.isCreator ? t("nav.sideCreatorSubtitle", { n: user.projectCount }) : null}
                inviteLabel={t("nav.startSelling")}
                onInvite={() => enableSide(enableCreatorSide)}
                pending={pending}
                onNavigate={() => setOpen(false)}
              />
              <SideRow
                user={user}
                onDark={onDark}
                active={user.isBrand && brandActive}
                href={user.isBrand ? "/account/brand" : null}
                label={t("nav.sideBrand")}
                subtitle={user.isBrand ? t("nav.sideBrandSubtitle", { n: user.interestCount }) : null}
                inviteLabel={t("nav.startBuying")}
                onInvite={() => enableSide(enableBrandSide)}
                pending={pending}
                onNavigate={() => setOpen(false)}
              />
            </div>
          )}
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
      href={user ? cabinetHrefFor(user) : "/"}
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
  const t = useUI(locale);
  const NAV = useNav(t);
  // Signed-in BRAND/CREATOR: header drops the marketing nav entirely — the
  // cabinet is reachable via the avatar menu / Wordmark instead
  // (see docs/superpowers/specs/2026-07-19-member-header-nav-design.md).
  // Brands used to be the exception (IA-46 promoted "Кабинет" + "Избранное"
  // into this bar), which meant "Кабинет" existed both here and in the avatar
  // dropdown while "Избранное" sat apart from the rest of the cabinet. Both
  // links live in BrandSidebar again since 2026-08-12; the rule is now the
  // same for both member sides.
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

  // The mobile panel slides down inside the header rather than covering the
  // page, so nothing stopped the page itself from scrolling under it — a
  // touch drag anywhere below the panel moved the content while the menu sat
  // open on top. Shared counter (body-scroll-lock.ts) rather than a private
  // save/restore, so it composes with the filter sheet and the dialogs; on
  // the marketing side it also pins Lenis, whose scroll range collapses with
  // the body's.
  useBodyScrollLock(menuOpen);

  // 🔴 Both the toggle button and the panel are `lg:hidden`. Rotating a
  // tablet to landscape (or widening a desktop window) past 1024px with the
  // menu open used to hide the panel AND its close button while `menuOpen`
  // stayed true — leaving the page scroll-locked with no visible control to
  // release it. Close the menu when the layout switches to the desktop nav,
  // which is where those links live at that width anyway.
  // A plain resize listener rather than matchMedia("(min-width:1024px)"):
  // media-query change events don't fire under CDP viewport emulation, so the
  // matchMedia version couldn't be verified in the browser at all. 1024 is
  // Tailwind's `lg`, the breakpoint both `lg:hidden` classes use.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={cn(
        // The bottom rule is a box-shadow, not a border: a 1px border would add
        // to the header's 64px height in flow, and the heroes pull themselves
        // under it with exactly -mt-16 (64px) — the leftover 1px showed as a
        // white hairline above every dark hero.
        "sticky top-0 z-50 transition-[color,background-color,box-shadow] duration-300",
        // Opaque, not `bg-background/80 backdrop-blur-md` (dropped 2026-08-10):
        // a full-width blur behind a sticky element is re-rasterised on every
        // scrolled frame, and this one spans the viewport for the entire page.
        // It was the most expensive thing running during a scroll; at 80%
        // opacity over the same background the difference is barely visible.
        scrolled ? "bg-background shadow-[0_1px_0_0_var(--border)]" : "bg-transparent"
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Wordmark onDark={onDark} user={user} />

          {/* Desktop nav — marketing links only, centred between the wordmark
              and the right cluster. Renders empty for signed-in members. */}
          <nav className="hidden items-center gap-8 lg:flex">
            {!isMember &&
              NAV.map((item) =>
                item.children ? (
                  <AdsNavDropdown
                    key={item.href}
                    item={item as NavItem & { children: NavChildGroup[] }}
                    t={t}
                    onDark={onDark}
                  />
                ) : (
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
                )
              )}
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

      {/* Scrim under the open menu. The page is scroll-locked while the panel
          is open but was still fully tappable through it, so a stray tap
          opened a card or a dialog on a page that couldn't be scrolled. Also
          gives the expected tap-outside-to-close. Sits before the panel in the
          DOM so the panel paints over it. */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          aria-hidden
          className="fixed inset-x-0 bottom-0 top-16 bg-black/40 lg:hidden"
        />
      )}

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
          cabinetHref={user ? cabinetHrefFor(user) : ""}
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
