import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { STAFF_ROLES, type StaffRole } from "@/lib/auth/staff-roles";
import { makeUI } from "@/lib/i18n";
import type { AccountStatus } from "@prisma/client";
import { RowActions as StaffRowActions, RoleControl, DeleteAccountButton } from "./user-form";
import { RowActions as MemberRowActions, SideBadges } from "../registrations/row-actions";
import { UsersTabs } from "./users-tabs";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
}

const STATUS_PILL: Record<AccountStatus, string> = {
  PENDING: "border-warn/25 bg-warn/10 text-warn",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
  BLOCKED: "border-border bg-muted text-muted-foreground",
};

export default async function UsersAdminPage() {
  const me = await requireSuperadmin();
  // English like the rest of the panel: these labels come from the site
  // dictionary, and reading the visitor's locale cookie printed "Одобрен" /
  // "Заблокировать" in the middle of an English table (QA, 2026-08-11).
  const ui = makeUI("en");

  const [staff, members] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: [...STAFF_ROLES] } },
      orderBy: { createdAt: "asc" },
      // adSpaces alongside projects — both are required, unguarded relations
      // to User (#60), so the delete button needs both counts to gate itself
      // the same way deleteAccount() does.
      include: { _count: { select: { projects: true, adSpaces: true } } },
    }),
    // MySQL orders an ENUM column by declaration order, not alphabetically —
    // AccountStatus is declared PENDING, APPROVED, REJECTED, BLOCKED, so
    // `status: "asc"` naturally surfaces pending registrations first.
    prisma.user.findMany({
      where: { role: { in: ["BRAND", "CREATOR"] } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { projects: true, adSpaces: true } } },
    }),
  ]);

  const STATUS_LABEL: Record<AccountStatus, string> = {
    PENDING: ui("admin.registrations.statusPending"),
    APPROVED: ui("admin.registrations.statusApproved"),
    REJECTED: ui("admin.registrations.statusRejected"),
    BLOCKED: ui("admin.registrations.statusBlocked"),
  };

  const MEMBER_ROLE_LABEL: Record<"BRAND" | "CREATOR", string> = {
    BRAND: ui("account.roleBrand"),
    CREATOR: ui("account.roleCreator"),
  };

  const staffTab = (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{staff.length} accounts</p>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[--primary-hover] btn-glow"
        >
          <Plus className="h-4 w-4" />
          Create member
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Company name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Projects</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u.id} className="border-b border-border align-top last:border-b-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <RoleControl id={u.id} name={u.name} role={u.role as StaffRole} isSelf={u.id === me.id} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      u.isActive
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {u.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u._count.projects}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <StaffRowActions
                    id={u.id}
                    name={u.name}
                    isActive={u.isActive}
                    isSelf={u.id === me.id}
                    projectCount={u._count.projects}
                    adSpaceCount={u._count.adSpaces}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const membersTab = (
    <div>
      <p className="text-sm text-muted-foreground">{members.length} accounts</p>

      {members.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          {ui("admin.registrations.empty")}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
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
                  <td className="px-4 py-3">
                    <SideBadges
                      userId={m.id}
                      isCreator={m.isCreator}
                      isBrand={m.isBrand}
                      creatorLabel={MEMBER_ROLE_LABEL.CREATOR}
                      brandLabel={MEMBER_ROLE_LABEL.BRAND}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {ui("admin.registrations.registeredAs")}: {MEMBER_ROLE_LABEL[m.role as "BRAND" | "CREATOR"]}
                    </p>
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
                    <div className="flex items-center gap-2">
                      <MemberRowActions
                        userId={m.id}
                        status={m.status}
                        approveLabel={ui("admin.registrations.approve")}
                        rejectLabel={ui("admin.registrations.reject")}
                        blockLabel={ui("admin.registrations.block")}
                        unblockLabel={ui("admin.registrations.unblock")}
                      />
                      <DeleteAccountButton
                        id={m.id}
                        name={m.name}
                        isBrand={m.isBrand}
                        isSelf={m.id === me.id}
                        projectCount={m._count.projects}
                        adSpaceCount={m._count.adSpaces}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Users</h1>
      <UsersTabs staffTab={staffTab} membersTab={membersTab} />
    </div>
  );
}
