"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Users,
  Images,
  Handshake,
  FolderOpen,
  ShieldCheck,
  Heart,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { canEditContent, canManageUsers, canModerate } from "@/lib/auth/permissions";
import { getPendingModerationCount } from "./moderation/actions";

// Per-role nav visibility. Dashboard is universal; everything else is gated
// by what that role is actually allowed to do:
//  - SUPERADMIN sees everything.
//  - PUBLISHER (content editor) sees Projects/Media, not the super-admin-only
//    platform-wide views (Interests, Portfolio, Partners, Users — Portfolio/
//    Partners have no ownerId to scope by Publisher, and Users now also hosts
//    the Members/registrations tab).
//  - MODERATOR (project moderation only) sees Dashboard + Moderation — no
//    content-edit tools, no user/settings management.
const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, show: () => true },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck, show: canModerate },
  { href: "/admin/projects", label: "Projects", icon: Film, show: canEditContent },
  { href: "/admin/media", label: "Media", icon: FolderOpen, show: canEditContent },
  { href: "/admin/interests", label: "Interests", icon: Heart, show: canManageUsers },
  { href: "/admin/portfolio", label: "Portfolio", icon: Images, show: canManageUsers },
  { href: "/admin/partners", label: "Partners", icon: Handshake, show: canManageUsers },
  { href: "/admin/users", label: "Users", icon: Users, show: canManageUsers },
];

export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV.filter((item) => item.show(role));

  // Pending-moderation badge — the count doubles as the "needs review"
  // notification. Fetched via a direct Server Action call (not a form), so
  // this stays a plain client-side read with no dedicated API route.
  // Refetches on every route change, which covers the common case of
  // reviewing the moderation queue then navigating elsewhere.
  const [pendingModerationCount, setPendingModerationCount] = useState(0);
  useEffect(() => {
    let alive = true;
    getPendingModerationCount()
      .then((n) => {
        if (alive) setPendingModerationCount(n);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  return (
    <nav className="flex-1 space-y-1 p-3">
      {items.map((item) => {
        // "/admin" is a prefix of every route, so match it exactly; all other
        // sections stay highlighted across their nested pages (e.g. edit forms).
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.href === "/admin/moderation" && pendingModerationCount > 0 && (
              <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {pendingModerationCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
