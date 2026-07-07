"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Film,
  Image as ImageIcon,
  Users,
  Type,
  Settings,
} from "lucide-react";

// Full nav for SUPERADMIN. A PUBLISHER only ever sees the Projects link —
// everything else is scoped to the super-admin.
const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: Inbox },
  { href: "/admin/projects", label: "Projects", icon: Film },
  { href: "/admin/portfolio", label: "Portfolio", icon: ImageIcon },
  { href: "/admin/partners", label: "Partners", icon: Users },
  { href: "/admin/content", label: "Content", icon: Type },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ role }: { role: "SUPERADMIN" | "PUBLISHER" }) {
  const pathname = usePathname();
  const items =
    role === "SUPERADMIN"
      ? NAV
      : NAV.filter((item) => item.href === "/admin/projects");

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
                ? "bg-primary/15 text-foreground"
                : "text-white/70 hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
