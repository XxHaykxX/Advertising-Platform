import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createMember, authenticateMember, setMemberStatus } from "./members";
import { verifyUserPassword } from "./password";

// Integration: hits the local docker MySQL (DATABASE_URL from .env via the
// test:int setup). All rows use the qa-int- email prefix and are removed in
// beforeAll + afterAll so reruns stay clean and prod-shaped data is untouched.
const PREFIX = "qa-int-";
const cleanup = () =>
  prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });

beforeAll(async () => {
  await cleanup();
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("createMember", () => {
  it("creates an APPROVED member that can be found by email", async () => {
    const res = await createMember({
      name: "QA Brand",
      email: `${PREFIX}brand@test.local`,
      password: "correct-horse",
      role: "BRAND",
    });
    expect(res.ok).toBe(true);
    const row = await prisma.user.findUnique({ where: { email: `${PREFIX}brand@test.local` } });
    expect(row?.status).toBe("APPROVED");
    expect(row?.role).toBe("BRAND");
    expect(row?.isActive).toBe(true);
  });

  it("rejects a duplicate email", async () => {
    const res = await createMember({
      name: "QA Dup",
      email: `${PREFIX}brand@test.local`,
      password: "whatever",
      role: "CREATOR",
    });
    expect(res).toEqual({ ok: false, reason: "email_taken" });
  });
});

describe("authenticateMember — credentials + approval gate", () => {
  const email = `${PREFIX}creator@test.local`;
  const password = "s3cret-pass";

  beforeAll(async () => {
    await createMember({ name: "QA Creator", email, password, role: "CREATOR" });
  });

  it("succeeds with the right password on an APPROVED account", async () => {
    const res = await authenticateMember(email, password);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.user.role).toBe("CREATOR");
  });

  it("returns invalid for a wrong password", async () => {
    expect(await authenticateMember(email, "wrong")).toEqual({ ok: false, reason: "invalid" });
  });

  it("returns invalid for an unknown email", async () => {
    expect(await authenticateMember(`${PREFIX}ghost@test.local`, password)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("gates on status: BLOCKED → blocked, REJECTED → rejected, back to APPROVED → ok", async () => {
    const row = await prisma.user.findUnique({ where: { email } });
    expect(row).toBeTruthy();

    await setMemberStatus(row!.id, "BLOCKED");
    expect(await authenticateMember(email, password)).toEqual({ ok: false, reason: "blocked" });

    await setMemberStatus(row!.id, "REJECTED");
    expect(await authenticateMember(email, password)).toEqual({ ok: false, reason: "rejected" });

    await setMemberStatus(row!.id, "APPROVED");
    expect((await authenticateMember(email, password)).ok).toBe(true);
  });

  it("setMemberStatus is a no-op on a non-member id (never flips staff)", async () => {
    // A huge id that does not exist — updateMany scoped to BRAND/CREATOR affects 0 rows, no throw.
    await expect(setMemberStatus(2_000_000_000, "BLOCKED")).resolves.toBeUndefined();
  });
});

describe("verifyUserPassword (staff/generic path)", () => {
  const email = `${PREFIX}verify@test.local`;

  beforeAll(async () => {
    await createMember({ name: "QA Verify", email, password: "pw-verify-123", role: "BRAND" });
  });

  it("ok:true for correct password", async () => {
    const res = await verifyUserPassword(email, "pw-verify-123");
    expect(res.ok).toBe(true);
  });

  it("invalid for wrong password", async () => {
    expect(await verifyUserPassword(email, "nope")).toEqual({ ok: false, reason: "invalid" });
  });

  it("deactivated when isActive is false", async () => {
    await prisma.user.update({ where: { email }, data: { isActive: false } });
    expect(await verifyUserPassword(email, "pw-verify-123")).toEqual({
      ok: false,
      reason: "deactivated",
    });
  });
});
