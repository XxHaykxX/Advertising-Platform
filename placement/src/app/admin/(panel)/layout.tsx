import { Clapperboard, LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth/require";
import { logout } from "@/app/admin/actions";
import { AdminNav } from "./admin-nav";

export default async function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Defense in depth — the proxy guard already checks the JWT alone;
  // requireUser() re-checks isActive against the DB, so a deactivated
  // Publisher is locked out of every panel page on the very next request
  // (redirects to /admin/login). Nav-hiding (inside AdminNav) is UX only —
  // every super-admin-only route still enforces requireSuperadmin() server
  // side, so a Publisher typing the URL directly is blocked regardless of
  // what's rendered here.
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-section">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2.5 border-b border-border p-5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Clapperboard className="h-4 w-4" />
          </span>
          <div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              <span className="text-primary">i</span>Govazd Admin
            </span>
          </div>
        </div>
        <AdminNav role={user.role} />
        <form action={logout} className="border-t border-border p-3">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
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

      {/* Content */}
      <main className="flex-1 overflow-x-hidden p-6 md:p-10">{children}</main>
    </div>
  );
}
