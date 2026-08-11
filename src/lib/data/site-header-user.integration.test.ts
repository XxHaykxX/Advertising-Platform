import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { getSiteHeaderUser } from "./site-header-user";
import type { AuthedUser } from "@/lib/auth/require";

// IA-47 (2026-08-11, commit 8c28d8b) gave getSiteHeaderUser a second job: for a
// staff row it also looks for a member session, so the menu can offer a way
// back to the cabinet that lost the staff-wins tie. That reads cookies(), which
// only exists inside a request — so from here it threw "`cookies` was called
// outside a request scope" and the staff case went red.
//
// Only that one call is stubbed, and only to "no member session": everything
// this file is actually about — the real function, the real database, the
// _count select shape — stays real.
vi.mock("@/lib/auth/require", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/require")>()),
  loadCurrentMember: async () => null,
}));

// Integration: hits the local docker MySQL, same setup as the auth files.
//
// This exists because of one bug (2026-08-10). The header's project/interest
// counters were first written as `_count: { select: { projects: isCreator,
// interests: isBrand } }` — "don't pay for the side that's off". Staff rows
// have BOTH sides off, so the select came out all-false and Prisma refused it
// with "needs at least one truthy value": every page 500'd for signed-in
// staff, while guests (early return) and members (at least one side on) were
// fine. Nothing but a staff session reaches that shape, which is exactly why
// no test and no click-through caught it.
//
// So: call the real function against the real database, once per flag
// combination. It asserts almost nothing about the values — the point is that
// the query is accepted at all.
const PREFIX = "qa-int-header-";
const cleanup = () => prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });

beforeAll(async () => {
  await cleanup();
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function seed(label: string, isCreator: boolean, isBrand: boolean) {
  const row = await prisma.user.create({
    data: {
      email: `${PREFIX}${label}@test.local`,
      name: `QA ${label}`,
      role: isCreator ? "CREATOR" : isBrand ? "BRAND" : "SUPERADMIN",
      passwordHash: null,
      isCreator,
      isBrand,
    },
  });
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isCreator: row.isCreator,
    isBrand: row.isBrand,
  } as AuthedUser;
}

describe("getSiteHeaderUser", () => {
  it.each([
    ["staff, neither side", false, false],
    ["creator only", true, false],
    ["brand only", false, true],
    ["both sides", true, true],
  ])("loads the header user for %s", async (label, isCreator, isBrand) => {
    const user = await seed(label.replace(/[^a-z]/gi, ""), isCreator, isBrand);

    const header = await getSiteHeaderUser(user);

    expect(header).not.toBeNull();
    expect(header?.isCreator).toBe(isCreator);
    expect(header?.isBrand).toBe(isBrand);
    expect(header?.projectCount).toBe(0);
    expect(header?.interestCount).toBe(0);
  });

  it("returns null for a guest", async () => {
    expect(await getSiteHeaderUser(null)).toBeNull();
  });
});
