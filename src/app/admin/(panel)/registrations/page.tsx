import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import type { AccountStatus } from "@prisma/client";
import { RowActions } from "./row-actions";

const STATUS_PILL: Record<AccountStatus, string> = {
  PENDING: "border-warn/25 bg-warn/10 text-warn",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
  BLOCKED: "border-border bg-muted text-muted-foreground",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
}

export default async function RegistrationsAdminPage() {
  // Backend APIs already re-verify authz on every action; requireUser() here
  // gates the page itself to logged-in staff (SUPERADMIN or PUBLISHER).
  await requireUser();
  const locale = await getLocale();
  const ui = makeUI(locale);

  // MySQL orders an ENUM column by declaration order, not alphabetically —
  // AccountStatus is declared PENDING, APPROVED, REJECTED, BLOCKED, so
  // `status: "asc"` naturally surfaces pending registrations first.
  const members = await prisma.user.findMany({
    where: { role: { in: ["BRAND", "CREATOR"] } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const STATUS_LABEL: Record<AccountStatus, string> = {
    PENDING: ui("admin.registrations.statusPending"),
    APPROVED: ui("admin.registrations.statusApproved"),
    REJECTED: ui("admin.registrations.statusRejected"),
    BLOCKED: ui("admin.registrations.statusBlocked"),
  };

  const ROLE_LABEL: Record<"BRAND" | "CREATOR", string> = {
    BRAND: ui("account.roleBrand"),
    CREATOR: ui("account.roleCreator"),
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{ui("admin.registrations.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{ui("admin.registrations.subtitle")}</p>
      </div>

      {members.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          {ui("admin.registrations.empty")}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">{ui("admin.registrations.colName")}</th>
                <th className="px-4 py-3 font-medium">{ui("admin.registrations.colEmail")}</th>
                <th className="px-4 py-3 font-medium">{ui("admin.registrations.colRole")}</th>
                <th className="px-4 py-3 font-medium">{ui("admin.registrations.colCompany")}</th>
                <th className="px-4 py-3 font-medium">{ui("admin.registrations.colStatus")}</th>
                <th className="px-4 py-3 font-medium">{ui("admin.registrations.colDate")}</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border align-top last:border-b-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ROLE_LABEL[m.role as "BRAND" | "CREATOR"]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.company || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_PILL[m.status]}`}
                    >
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      userId={m.id}
                      status={m.status}
                      approveLabel={ui("admin.registrations.approve")}
                      rejectLabel={ui("admin.registrations.reject")}
                      blockLabel={ui("admin.registrations.block")}
                      unblockLabel={ui("admin.registrations.unblock")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
