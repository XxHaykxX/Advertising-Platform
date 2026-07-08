import { requireUser } from "@/lib/auth/require";
import { AdminShell } from "./admin-shell";

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
    <AdminShell role={user.role} name={user.name} email={user.email}>
      {children}
    </AdminShell>
  );
}
