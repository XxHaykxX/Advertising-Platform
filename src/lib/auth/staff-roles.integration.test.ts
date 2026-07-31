import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { changeStaffRole } from "./staff-roles";

// Integration: hits the local docker MySQL, same setup as
// members.integration.test.ts. All rows use the qa-int-staff- email prefix
// and are removed in beforeAll + afterAll. requireSuperadmin() is NOT
// exercised here — that's the "use server" action's job (it needs a
// cookie-backed session); this file calls changeStaffRole directly, the same
// split members.integration.test.ts uses for createMember/authenticateMember.
const PREFIX = "qa-int-staff-";
const cleanup = () => prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });

beforeAll(async () => {
  await cleanup();
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function makeStaff(role: Role, email: string) {
  const u = await prisma.user.create({
    data: { email, name: `QA ${role}`, role, passwordHash: null },
  });
  return u.id;
}

describe("changeStaffRole", () => {
  it("changes a staff member's role", async () => {
    const actor = await makeStaff("SUPERADMIN", `${PREFIX}actor1@test.local`);
    const target = await makeStaff("MODERATOR", `${PREFIX}target1@test.local`);

    const res = await changeStaffRole(actor, target, "PUBLISHER");
    expect(res).toEqual({ ok: true });

    const row = await prisma.user.findUnique({ where: { id: target } });
    expect(row?.role).toBe("PUBLISHER");
  });

  it("refuses to change your own role", async () => {
    const actor = await makeStaff("SUPERADMIN", `${PREFIX}self@test.local`);
    expect(await changeStaffRole(actor, actor, "MODERATOR")).toEqual({ ok: false, reason: "self" });
  });

  it("refuses a target that isn't a staff account (BRAND/CREATOR)", async () => {
    const actor = await makeStaff("SUPERADMIN", `${PREFIX}actor2@test.local`);
    const brandId = await makeStaff("BRAND", `${PREFIX}brand@test.local`);

    expect(await changeStaffRole(actor, brandId, "MODERATOR")).toEqual({ ok: false, reason: "not_staff" });
    // Untouched — the guard fired before any write.
    expect((await prisma.user.findUnique({ where: { id: brandId } }))?.role).toBe("BRAND");
  });

  it("refuses to assign BRAND/CREATOR through this path", async () => {
    const actor = await makeStaff("SUPERADMIN", `${PREFIX}actor3@test.local`);
    const target = await makeStaff("MODERATOR", `${PREFIX}target3@test.local`);

    expect(await changeStaffRole(actor, target, "BRAND")).toEqual({ ok: false, reason: "invalid_role" });
    expect((await prisma.user.findUnique({ where: { id: target } }))?.role).toBe("MODERATOR");
  });

  it("refuses to demote the only super-admin left", async () => {
    const target = await makeStaff("SUPERADMIN", `${PREFIX}onlysuper@test.local`);
    const actor = await makeStaff("MODERATOR", `${PREFIX}actor4@test.local`);

    // Isolate: every super-admin in the real DB besides our test row is
    // temporarily parked as MODERATOR, so `target` is genuinely the only one
    // — then restored in `finally`, whatever the assertion does.
    const others = await prisma.user.findMany({
      where: { role: "SUPERADMIN", id: { not: target } },
    });
    await prisma.user.updateMany({
      where: { id: { in: others.map((o) => o.id) } },
      data: { role: "MODERATOR" },
    });
    try {
      expect(await changeStaffRole(actor, target, "MODERATOR")).toEqual({
        ok: false,
        reason: "last_superadmin",
      });
      expect((await prisma.user.findUnique({ where: { id: target } }))?.role).toBe("SUPERADMIN");
    } finally {
      await Promise.all(
        others.map((o) => prisma.user.update({ where: { id: o.id }, data: { role: o.role } })),
      );
    }
  });

  it("allows demoting a super-admin when another one remains", async () => {
    const keep = await makeStaff("SUPERADMIN", `${PREFIX}keep@test.local`);
    const target = await makeStaff("SUPERADMIN", `${PREFIX}demote@test.local`);

    expect(await changeStaffRole(keep, target, "MODERATOR")).toEqual({ ok: true });
    expect((await prisma.user.findUnique({ where: { id: target } }))?.role).toBe("MODERATOR");
  });

  it("does not count a deactivated super-admin as the one who remains", async () => {
    // requireUser() rejects isActive=false, so a deactivated owner cannot sign
    // in. If they counted, demoting the last ACTIVE super-admin would lock
    // everyone out of the panel with no way back except editing the database.
    const target = await makeStaff("SUPERADMIN", `${PREFIX}lastactive@test.local`);
    const deactivated = await makeStaff("SUPERADMIN", `${PREFIX}deactivated@test.local`);
    await prisma.user.update({ where: { id: deactivated }, data: { isActive: false } });
    const actor = await makeStaff("MODERATOR", `${PREFIX}actor5@test.local`);

    const others = await prisma.user.findMany({
      where: { role: "SUPERADMIN", isActive: true, id: { not: target } },
    });
    await prisma.user.updateMany({
      where: { id: { in: others.map((o) => o.id) } },
      data: { role: "MODERATOR" },
    });
    try {
      expect(await changeStaffRole(actor, target, "MODERATOR")).toEqual({
        ok: false,
        reason: "last_superadmin",
      });
      expect((await prisma.user.findUnique({ where: { id: target } }))?.role).toBe("SUPERADMIN");
    } finally {
      await Promise.all(
        others.map((o) => prisma.user.update({ where: { id: o.id }, data: { role: o.role } })),
      );
    }
  });
});
