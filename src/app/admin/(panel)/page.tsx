import Link from "next/link";
import { Inbox, Film, Image as ImageIcon, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [newApps, totalApps, projects, portfolio, partners] = await Promise.all([
    prisma.application.count({ where: { status: "new" } }),
    prisma.application.count(),
    prisma.project.count(),
    prisma.portfolio.count(),
    prisma.partner.count(),
  ]);

  const cards = [
    { label: "New applications", value: newApps, sub: `total ${totalApps}`, icon: Inbox, href: "/admin/applications", accent: true },
    { label: "Projects", value: projects, sub: "in catalog", icon: Film, href: "/admin" },
    { label: "Portfolio", value: portfolio, sub: "cases", icon: ImageIcon, href: "/admin" },
    { label: "Partners", value: partners, sub: "logos", icon: Users, href: "/admin" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-white/55">Platform overview.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-2xl border p-5 transition-colors ${
              c.accent
                ? "border-primary/30 bg-primary/10 hover:border-primary/50"
                : "border-white/10 bg-white/[0.03] hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-white/45">
                {c.label}
              </span>
              <c.icon className={`h-5 w-5 ${c.accent ? "text-primary" : "text-white/40"}`} />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground">{c.value}</p>
            <p className="mt-1 text-xs text-white/45">{c.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
