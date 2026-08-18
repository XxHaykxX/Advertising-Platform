"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Users,
  Users2,
  Images,
  Megaphone,
  Handshake,
  MessageSquareQuote,
  FolderOpen,
  ShieldCheck,
  Bell,
  Send,
  Languages,
  Inbox,
  History,
  PhoneCall,
} from "lucide-react";
import type { Role } from "@prisma/client";
import {
  canEditContent,
  canHandleInterests,
  canEditTranslations,
  canManageUsers,
  canModerate,
  isTranslatorOnly,
} from "@/lib/auth/permissions";
import { getPendingModerationCount } from "./moderation/actions";
import { getPendingOfferCount } from "./interests/actions";
import { getPendingCallRequestCount } from "./call-requests/actions";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

// Per-role nav visibility. Dashboard is universal (except for TRANSLATOR,
// see below); everything else is gated by what that role is actually
// allowed to do:
//  - SUPERADMIN sees everything.
//  - PUBLISHER (content editor) sees Projects/Media, not the super-admin-only
//    platform-wide views (Interests, Portfolio, Testimonials, Partners, Users —
//    those three have no ownerId to scope by Publisher, and Users now also
//    hosts the Members/registrations tab).
//  - MODERATOR (project moderation only) sees Dashboard + Moderation — no
//    content-edit tools, no user/settings management.
//  - TRANSLATOR (content writer) sees only "Translations" (/admin/i18n) — no
//    Dashboard, no other section.
//
// Items are split into labelled groups (redesign §3.3): Dashboard stays
// top-level, then Content / Platform / Comms. A group whose every item is
// role-hidden renders nothing (including its header).
const NAV_GROUPS: {
  label: string | null;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    show: (role: Role) => boolean;
  }[];
}[] = [
  {
    label: null,
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        show: (role) => !isTranslatorOnly(role),
      },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck, show: canModerate },
      // Audit 2.1: the applications section was deleted in July, which left a
      // brand's message and contact stored but readable by nobody.
      { href: "/admin/interests", label: "Offers", icon: Inbox, show: canHandleInterests },
      // Stage 4b: the homepage "order a call" lead, same audience and guard
      // as Offers — a call request is the same kind of lead as a brand's
      // application, just without a project attached.
      { href: "/admin/call-requests", label: "Call requests", icon: PhoneCall, show: canHandleInterests },
      { href: "/admin/projects", label: "Projects", icon: Film, show: canEditContent },
      // Inventory that isn't sold through a film — billboards, lifts, transit,
      // radio, TV, video, banners (stage 3 of the multichannel plan).
      { href: "/admin/ad-spaces", label: "Ad spaces", icon: Megaphone, show: canEditContent },
      { href: "/admin/cast", label: "Cast & Crew", icon: Users2, show: canEditContent },
      { href: "/admin/media", label: "Media", icon: FolderOpen, show: canEditContent },
      // Audit: content damage used to be untraceable — no record of who
      // changed what, or when. Every staff role can read this feed (it's
      // "what happened on the site", not a content-edit tool); TRANSLATOR is
      // still excluded, same as Dashboard/Notifications below — its only
      // page is /admin/i18n.
      { href: "/admin/history", label: "History", icon: History, show: (role) => !isTranslatorOnly(role) },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/portfolio", label: "Portfolio", icon: Images, show: canManageUsers },
      { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, show: canManageUsers },
      { href: "/admin/partners", label: "Partners", icon: Handshake, show: canManageUsers },
      { href: "/admin/users", label: "Users", icon: Users, show: canManageUsers },
      { href: "/admin/i18n", label: "Translations", icon: Languages, show: canEditTranslations },
    ],
  },
  {
    label: "Comms",
    items: [
      { href: "/admin/broadcast", label: "Broadcast", icon: Send, show: canManageUsers },
      // Audit 3.4: TRANSLATOR's only admin page is /admin/i18n — hide the
      // link (the page itself now 404s for that role too).
      { href: "/admin/notifications", label: "Notifications", icon: Bell, show: (role) => !isTranslatorOnly(role) },
    ],
  },
];

export function AdminNav({ role, collapsed = false }: { role: Role; collapsed?: boolean }) {
  const pathname = usePathname();
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.show(role)),
  })).filter((group) => group.items.length > 0);

  // Pending-moderation badge — the count doubles as the "needs review"
  // notification. Fetched via a direct Server Action call (not a form), so
  // this stays a plain client-side read with no dedicated API route.
  // Refetches on every route change, which covers the common case of
  // reviewing the moderation queue then navigating elsewhere.
  const [pendingModerationCount, setPendingModerationCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  // Offers waiting for an answer. Without this the section gave no sign that
  // anything had arrived — a brand's offer sat unanswered until somebody
  // happened to open the page.
  const [pendingOfferCount, setPendingOfferCount] = useState(0);
  const [pendingCallRequestCount, setPendingCallRequestCount] = useState(0);
  useEffect(() => {
    let alive = true;
    getPendingModerationCount()
      .then((n) => {
        if (alive) setPendingModerationCount(n);
      })
      .catch(() => {});
    getPendingOfferCount()
      .then((n) => {
        if (alive) setPendingOfferCount(n);
      })
      .catch(() => {});
    getPendingCallRequestCount()
      .then((n) => {
        if (alive) setPendingCallRequestCount(n);
      })
      .catch(() => {});
    // Refetch when the tab regains focus too. Route changes alone meant a
    // count could sit stale for as long as the panel stayed on one page,
    // which is exactly how someone watching the section misses an arrival.
    function refresh() {
      if (document.visibilityState !== "visible") return;
      getPendingModerationCount()
        .then((n) => alive && setPendingModerationCount(n))
        .catch(() => {});
      getPendingOfferCount()
        .then((n) => alive && setPendingOfferCount(n))
        .catch(() => {});
      getPendingCallRequestCount()
        .then((n) => alive && setPendingCallRequestCount(n))
        .catch(() => {});
      getUnreadNotificationCount("staff")
        .then((n) => alive && setUnreadCount(n))
        .catch(() => {});
    }
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    getUnreadNotificationCount("staff")
      .then((n) => {
        if (alive) setUnreadCount(n);
      })
      .catch(() => {});
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

  return (
    <nav className="flex-1 p-3">
      {groups.map((group, gi) => (
        <div key={group.label ?? "top"}>
          {group.label && (
            <>
              {/* Full label when expanded; a hairline divider stands in for it
                  in the icon-only collapsed rail (md+ only — the mobile drawer
                  always shows the expanded layout). */}
              <p
                className={`px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${
                  collapsed ? "md:hidden" : ""
                }`}
              >
                {group.label}
              </p>
              {collapsed && (
                <div className={`mx-2 mb-2 hidden h-px bg-border md:block ${gi > 0 ? "mt-3" : ""}`} />
              )}
            </>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              // "/admin" is a prefix of every route, so match it exactly; all other
              // sections stay highlighted across their nested pages (e.g. edit forms).
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              const badge =
                item.href === "/admin/moderation"
                  ? pendingModerationCount
                  : item.href === "/admin/notifications"
                    ? unreadCount
                    : item.href === "/admin/interests"
                      ? pendingOfferCount
                      : item.href === "/admin/call-requests"
                        ? pendingCallRequestCount
                        : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    collapsed ? "md:justify-center md:px-2" : ""
                  } ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
                  {badge > 0 && (
                    <span
                      className={`ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground ${
                        collapsed
                          ? "md:absolute md:right-0.5 md:top-0.5 md:ml-0 md:h-4 md:min-w-4 md:px-1 md:text-[10px]"
                          : ""
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
