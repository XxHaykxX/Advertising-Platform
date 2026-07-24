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
  Handshake,
  FolderOpen,
  ShieldCheck,
  Bell,
  Send,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { canEditContent, canManageUsers, canModerate } from "@/lib/auth/permissions";
import { getPendingModerationCount } from "./moderation/actions";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

// Per-role nav visibility. Dashboard is universal; everything else is gated
// by what that role is actually allowed to do:
//  - SUPERADMIN sees everything.
//  - PUBLISHER (content editor) sees Projects/Media, not the super-admin-only
//    platform-wide views (Interests, Portfolio, Partners, Users — Portfolio/
//    Partners have no ownerId to scope by Publisher, and Users now also hosts
//    the Members/registrations tab).
//  - MODERATOR (project moderation only) sees Dashboard + Moderation — no
//    content-edit tools, no user/settings management.
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
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, show: () => true }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck, show: canModerate },
      { href: "/admin/projects", label: "Projects", icon: Film, show: canEditContent },
      { href: "/admin/cast", label: "Cast & Crew", icon: Users2, show: canEditContent },
      { href: "/admin/media", label: "Media", icon: FolderOpen, show: canEditContent },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/portfolio", label: "Portfolio", icon: Images, show: canManageUsers },
      { href: "/admin/partners", label: "Partners", icon: Handshake, show: canManageUsers },
      { href: "/admin/users", label: "Users", icon: Users, show: canManageUsers },
    ],
  },
  {
    label: "Comms",
    items: [
      { href: "/admin/broadcast", label: "Broadcast", icon: Send, show: canManageUsers },
      { href: "/admin/notifications", label: "Notifications", icon: Bell, show: () => true },
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
  useEffect(() => {
    let alive = true;
    getPendingModerationCount()
      .then((n) => {
        if (alive) setPendingModerationCount(n);
      })
      .catch(() => {});
    getUnreadNotificationCount()
      .then((n) => {
        if (alive) setUnreadCount(n);
      })
      .catch(() => {});
    return () => {
      alive = false;
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
