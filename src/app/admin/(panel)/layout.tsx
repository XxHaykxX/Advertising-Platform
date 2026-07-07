import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth/require";
import { logout } from "@/app/admin/actions";
import { AdminNav } from "./admin-nav";

export default async function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Defense in depth — middleware already guards on the JWT alone; requireUser()
  // re-checks isActive against the DB, so a deactivated Publisher is locked out
  // of every panel page on the very next request (redirects to /admin/login).
  // Nav-hiding (inside AdminNav) is UX only — every non-Projects route still
  // enforces requireSuperadmin() server-side, so a Publisher typing the URL is
  // blocked regardless of what's rendered here.
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#0e0e0e]">
        <div className="border-b border-white/10 p-5">
          <span className="text-base font-bold tracking-tight">
            AD<span className="text-primary">PLACEMENT</span>
          </span>
          <p className="mt-0.5 text-xs text-white/40">Admin</p>
        </div>
        <AdminNav role={user.role} />
        <form action={logout} className="border-t border-white/10 p-3">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-foreground"
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
