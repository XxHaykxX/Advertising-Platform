"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/ui/logo";
import { AdminNav } from "./admin-nav";

/**
 * Responsive admin chrome. On md+ the sidebar is a static 240px column (as
 * before). On mobile it's an off-canvas drawer toggled by a hamburger in a
 * fixed top bar; a backdrop closes it and navigation auto-closes it.
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
  const pathname = usePathname();

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
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-border bg-card transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <Logo href="/admin" suffix="Admin" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AdminNav role={role} />

        <form action={logout} className="border-t border-border p-3">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </aside>

      {/* Content — extra top padding on mobile to clear the fixed top bar */}
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 pt-20 sm:p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
