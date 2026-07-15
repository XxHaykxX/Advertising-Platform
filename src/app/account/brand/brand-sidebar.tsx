"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Heart, User, Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  disabled?: boolean;
  badge?: string;
};

/** Left-nav for the BRAND cabinet (#23) — mirrors the filmustageplacement.com
 *  reference (Dashboard / Browse Projects / My Interests / My Profile /
 *  Notifications-soon / Log Out). Client component only for the active-link
 *  highlight (usePathname); the actual logout is a plain <form action>
 *  around the shared account/actions.ts logout Server Action. */
export function BrandSidebar({
  labels,
  logoutAction,
}: {
  labels: {
    dashboard: string;
    browse: string;
    interests: string;
    profile: string;
    notifications: string;
    soon: string;
    logout: string;
  };
  logoutAction: () => void | Promise<void>;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/account/brand", label: labels.dashboard, icon: LayoutDashboard, exact: true },
    { href: "/account/brand/browse", label: labels.browse, icon: Search },
    { href: "/account/brand/interests", label: labels.interests, icon: Heart },
    { href: "/account/brand/profile", label: labels.profile, icon: User },
  ];

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-2 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground/60">
          <span className="flex items-center gap-3">
            <Bell className="h-4 w-4 shrink-0" />
            {labels.notifications}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {labels.soon}
          </span>
        </div>
      </nav>

      <form action={logoutAction} className="mt-6 border-t border-border pt-4">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {labels.logout}
        </button>
      </form>
    </aside>
  );
}
