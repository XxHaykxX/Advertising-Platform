"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, FileUp, Bell, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import type { Locale } from "@/lib/i18n";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

/** Left-nav for the CREATOR cabinet — the mirror of BrandSidebar (see
 *  account/brand/brand-sidebar.tsx). Client component only for the active-link
 *  highlight (usePathname) and the unread-notifications badge; logout goes
 *  through the shared LogoutButton around account/actions.ts's logout Server
 *  Action. Sticky (non-scrolling) positioning is applied by the wrapping
 *  account/layout.tsx shell. */
export function CreatorSidebar({
  labels,
  logoutAction,
  locale,
}: {
  labels: {
    home: string;
    projects: string;
    submit: string;
    notifications: string;
    profile: string;
    logout: string;
  };
  logoutAction: () => Promise<{ redirect: string }>;
  locale?: Locale;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/account", label: labels.home, icon: LayoutDashboard, exact: true },
    { href: "/account/projects", label: labels.projects, icon: FolderKanban, exact: true },
    { href: "/account/projects/new", label: labels.submit, icon: FileUp },
    { href: "/account/notifications", label: labels.notifications, icon: Bell },
    { href: "/account/profile", label: labels.profile, icon: User },
  ];

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  // Unread-notifications badge — same direct-Server-Action-call pattern as
  // BrandSidebar/admin-nav: refetched on every route change.
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
              {item.href === "/account/notifications" && unreadCount > 0 && (
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
