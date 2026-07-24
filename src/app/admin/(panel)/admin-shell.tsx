"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { logout } from "@/app/admin/actions";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/ui/logo";
import { AdminNav } from "./admin-nav";

const COLLAPSED_KEY = "admin.sidebar.collapsed";

/**
 * Responsive admin chrome. On md+ the sidebar is a static column that can be
 * collapsed to an icon-only rail (w-60 ↔ w-14, persisted in localStorage). On
 * mobile it's an off-canvas drawer toggled by a hamburger in a fixed top bar;
 * a backdrop closes it and navigation auto-closes it. The collapsed state only
 * affects md+ — the mobile drawer always renders the full expanded layout.
 */
export function AdminShell({
  role,
  name,
  email,
  children,
}: {
  role: Role;
  name: string;
  email: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Starts expanded and syncs from localStorage after mount — reading storage
  // during render would mismatch the server-rendered HTML on hydration.
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // Storage unavailable (private mode etc.) — stay expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Best-effort persistence only.
      }
      return next;
    });
  }

  // Close the drawer whenever the route changes (link tap on mobile).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-section">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo href="/admin" suffix="Admin" />
      </header>

      {/* Backdrop (mobile, when open) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-border bg-card transition-[width,transform] duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 md:self-start md:overflow-y-auto ${
          collapsed ? "md:w-14" : "md:w-60"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex items-center justify-between border-b border-border p-5 ${
            collapsed ? "md:justify-center md:p-3" : ""
          }`}
        >
          <Logo href="/admin" suffix="Admin" className={collapsed ? "md:hidden" : ""} />
          {/* Collapse toggle — md+ only; mobile uses the drawer instead. */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:grid"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AdminNav role={role} collapsed={collapsed} />

        <div className="border-t border-border p-3">
          <div className={`mb-2 px-3 ${collapsed ? "md:hidden" : ""}`}>
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <LogoutButton
            action={logout}
            locale="en"
            title={collapsed ? "Sign out" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
              collapsed ? "md:justify-center md:px-2" : ""
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={collapsed ? "md:hidden" : ""}>Sign out</span>
          </LogoutButton>
        </div>
      </aside>

      {/* Content — extra top padding on mobile to clear the fixed top bar.
          Full-width working area (backlog #6): no max-w cap here, and the md+
          padding is deliberately tight (px-6/py-6 instead of the old p-10). */}
      {/* overflow-x-clip (not -hidden): clips horizontal overflow WITHOUT
          establishing a scroll container, so `position: sticky` descendants
          (e.g. the project-form section rail) stick to the viewport instead of
          silently scrolling away. */}
      <main className="min-w-0 flex-1 overflow-x-clip p-4 pt-20 sm:p-6 md:px-6 md:py-6">
        {children}
      </main>
    </div>
  );
}
