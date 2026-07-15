"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Film, Inbox, Users, Images, Handshake, FolderOpen, UserCheck } from "lucide-react";
import type { Role } from "@prisma/client";
import { getPendingCount } from "./registrations/actions";

// Full nav for SUPERADMIN. A PUBLISHER only sees Dashboard + Projects —
// Applications, Users, Portfolio and Partners are platform-wide, super-admin-
// only views (Portfolio/Partners have no ownerId to scope by Publisher).
// Registrations (brand/creator sign-ups) is likewise platform-wide but both
// staff roles can review it — it's gated by requireUser(), not requireSuperadmin().
const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, superadminOnly: false },
  { href: "/admin/projects", label: "Projects", icon: Film, superadminOnly: false },
  { href: "/admin/media", label: "Media", icon: FolderOpen, superadminOnly: false },
  { href: "/admin/registrations", label: "Registrations", icon: UserCheck, superadminOnly: false },
  { href: "/admin/applications", label: "Applications", icon: Inbox, superadminOnly: true },
  { href: "/admin/portfolio", label: "Portfolio", icon: Images, superadminOnly: true },
  { href: "/admin/partners", label: "Partners", icon: Handshake, superadminOnly: true },
  { href: "/admin/users", label: "Users", icon: Users, superadminOnly: true },
];

export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = role === "SUPERADMIN" ? NAV : NAV.filter((item) => !item.superadminOnly);

  // Pending-registrations badge — the count doubles as the "new sign-up"
  // notification. Fetched via a direct Server Action call (not a form), so
  // this stays a plain client-side read with no dedicated API route. Refetches
  // on every route change, which covers the common case of reviewing
  // registrations then navigating elsewhere.
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    let alive = true;
    getPendingCount()
      .then((n) => {
        if (alive) setPendingCount(n);
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
            {item.href === "/admin/registrations" && pendingCount > 0 && (
              <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
