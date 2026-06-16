import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LayoutDashboard, Inbox, Film, Image as ImageIcon, Users, Type, Settings, LogOut } from "lucide-react";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { logout } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Заявки", icon: Inbox },
  { href: "/admin/projects", label: "Проекты", icon: Film },
  { href: "/admin/portfolio", label: "Портфолио", icon: ImageIcon },
  { href: "/admin/partners", label: "Партнёры", icon: Users },
  { href: "/admin/content", label: "Тексты", icon: Type },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export default async function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Defense in depth — middleware already guards, but never render the panel
  // without a valid session.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) redirect("/admin/login");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#0e0e0e]">
        <div className="border-b border-white/10 p-5">
          <span className="text-base font-bold tracking-tight">
            AD<span className="text-primary">PLACEMENT</span>
          </span>
          <p className="mt-0.5 text-xs text-white/40">Админка</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="border-t border-white/10 p-3">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </form>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-x-hidden p-6 md:p-10">{children}</main>
    </div>
  );
}
