"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Heart, User, Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import type { Locale } from "@/lib/i18n";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

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
 *  highlight (usePathname); the actual logout goes through the shared
 *  LogoutButton around the account/actions.ts logout Server Action. */
export function BrandSidebar({
  labels,
  logoutAction,
  locale,
}: {
  labels: {
    dashboard: string;
    browse: string;
    favorites: string;
    profile: string;
    notifications: string;
    logout: string;
  };
  logoutAction: () => Promise<{ redirect: string }>;
  locale?: Locale;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/account/brand", label: labels.dashboard, icon: LayoutDashboard, exact: true },
    { href: "/account/brand/browse", label: labels.browse, icon: Search },
    { href: "/account/brand/favorites", label: labels.favorites, icon: Heart },
    { href: "/account/brand/notifications", label: labels.notifications, icon: Bell },
    { href: "/account/brand/profile", label: labels.profile, icon: User },
  ];

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  // Notifications badge — same direct-Server-Action-call pattern as
  // admin-nav's getPendingModerationCount: refetched on every route change,
  // which covers navigating back to a page after it changes elsewhere.
  // Favorites (#22) is a private shortlist and gets no badge.
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    let alive = true;
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
    <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:h-fit lg:w-60 lg:self-start">
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
              {item.href === "/account/brand/notifications" && unreadCount > 0 && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-border pt-4">
        <LogoutButton
          action={logoutAction}
          locale={locale}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {labels.logout}
        </LogoutButton>
      </div>
    </aside>
  );
}
