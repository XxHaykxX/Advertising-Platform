import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteAccount } from "./delete-account";

// Integration: hits the local docker MySQL, same setup as
// staff-roles.integration.test.ts. All rows use the qa-int-del- email prefix
// (and matching project codes) and are removed in beforeAll + afterAll.
// requireSuperadmin() is NOT exercised here, same split as
// staff-roles.integration.test.ts — that's the "use server" action's job (it
// needs a cookie-backed session); this file calls deleteAccount directly.
const PREFIX = "qa-int-del-";
const cleanup = async () => {
  await prisma.project.deleteMany({ where: { code: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
};

beforeAll(async () => {
  await cleanup();
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function makeUser(role: Role, email: string) {
  const u = await prisma.user.create({
    data: { email, name: `QA ${role}`, role, passwordHash: null },
  });
  return u.id;
}

describe("deleteAccount", () => {
  it("refuses to delete your own account", async () => {
    const actor = await makeUser("SUPERADMIN", `${PREFIX}self@test.local`);
    expect(await deleteAccount(actor, actor)).toEqual({ ok: false, reason: "self" });
    expect(await prisma.user.findUnique({ where: { id: actor } })).not.toBeNull();
  });

  it("refuses a target that no longer exists", async () => {
    const actor = await makeUser("SUPERADMIN", `${PREFIX}actor-nf@test.local`);
    expect(await deleteAccount(actor, 999_999_999)).toEqual({ ok: false, reason: "not_found" });
  });

  it("refuses to delete the only super-admin left", async () => {
    const target = await makeUser("SUPERADMIN", `${PREFIX}onlysuper@test.local`);
    const actor = await makeUser("MODERATOR", `${PREFIX}actor-ls@test.local`);

    // Isolate: every super-admin in the real DB besides our test row is
    // temporarily parked as MODERATOR, so `target` is genuinely the only
    // one — then restored in `finally`, whatever the assertion does.
    const others = await prisma.user.findMany({
      where: { role: "SUPERADMIN", id: { not: target } },
    });
    await prisma.user.updateMany({
      where: { id: { in: others.map((o) => o.id) } },
      data: { role: "MODERATOR" },
    });
    try {
      expect(await deleteAccount(actor, target)).toEqual({ ok: false, reason: "last_superadmin" });
      expect(await prisma.user.findUnique({ where: { id: target } })).not.toBeNull();
    } finally {
      await Promise.all(
        others.map((o) => prisma.user.update({ where: { id: o.id }, data: { role: o.role } })),
      );
    }
  });

  it("does not count a deactivated super-admin as the one who remains", async () => {
    // Mirrors staff-roles.integration.test.ts: requireUser() rejects
    // isActive=false, so a deactivated account can't sign back in and undo
    // this. Counting it would let the last usable super-admin be deleted
    // with no way back except editing the database.
    const target = await makeUser("SUPERADMIN", `${PREFIX}lastactive@test.local`);
    const deactivated = await makeUser("SUPERADMIN", `${PREFIX}deactivated@test.local`);
    await prisma.user.update({ where: { id: deactivated }, data: { isActive: false } });
    const actor = await makeUser("MODERATOR", `${PREFIX}actor-da@test.local`);

    const others = await prisma.user.findMany({
      where: { role: "SUPERADMIN", isActive: true, id: { not: target } },
    });
    await prisma.user.updateMany({
      where: { id: { in: others.map((o) => o.id) } },
      data: { role: "MODERATOR" },
    });
    try {
      expect(await deleteAccount(actor, target)).toEqual({ ok: false, reason: "last_superadmin" });
      expect(await prisma.user.findUnique({ where: { id: target } })).not.toBeNull();
    } finally {
      await Promise.all(
        others.map((o) => prisma.user.update({ where: { id: o.id }, data: { role: o.role } })),
      );
    }
  });

  it("refuses to delete an account that still owns projects", async () => {
    const actor = await makeUser("SUPERADMIN", `${PREFIX}actor-proj@test.local`);
    const target = await makeUser("CREATOR", `${PREFIX}creator-proj@test.local`);
    await prisma.project.create({
      data: {
        code: `${PREFIX}proj-1`,
        title: "QA project",
        genre: "Drama",
        synopsis: "…",
        ownerId: target,
      },
    });

    expect(await deleteAccount(actor, target)).toEqual({
      ok: false,
      reason: "has_projects",
      projectCount: 1,
    });
    expect(await prisma.user.findUnique({ where: { id: target } })).not.toBeNull();
  });

  it("deletes an account with no projects and cascades its dependent rows", async () => {
    const actor = await makeUser("SUPERADMIN", `${PREFIX}actor-ok@test.local`);
    const owner = await makeUser("CREATOR", `${PREFIX}owner-ok@test.local`);
    const project = await prisma.project.create({
      data: {
        code: `${PREFIX}proj-2`,
        title: "QA project 2",
        genre: "Drama",
        synopsis: "…",
        ownerId: owner,
      },
    });

    const target = await makeUser("BRAND", `${PREFIX}brand-ok@test.local`);
    await prisma.notification.create({
      data: { userId: target, type: "INTEREST", link: "" },
    });
    await prisma.favorite.create({ data: { brandId: target, projectId: project.id } });

    const res = await deleteAccount(actor, target);
    expect(res).toEqual({ ok: true });

    expect(await prisma.user.findUnique({ where: { id: target } })).toBeNull();
    expect(await prisma.notification.findMany({ where: { userId: target } })).toHaveLength(0);
    expect(await prisma.favorite.findMany({ where: { brandId: target } })).toHaveLength(0);
    // The project it never owned is untouched.
    expect(await prisma.project.findUnique({ where: { id: project.id } })).not.toBeNull();
  });
});
