import { describe, it, expect, vi, beforeEach } from "vitest";

// deleteAccount() itself is exercised end-to-end against the docker DB in
// delete-account.integration.test.ts (self / not_found / last_superadmin /
// has_projects / success). Mocked here only for the one branch that isn't
// covered there — #60, found during QA-5: the guard counted Project but not
// AdSpace, so an account with ad spaces and no projects sailed past it and
// crashed on the AdSpace FK instead of getting a friendly refusal.
const userFindUnique = vi.fn();
const userCount = vi.fn();
const projectCount = vi.fn();
const adSpaceCount = vi.fn();
const userDelete = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => userFindUnique(...args),
      count: (...args: unknown[]) => userCount(...args),
      delete: (...args: unknown[]) => userDelete(...args),
    },
    project: { count: (...args: unknown[]) => projectCount(...args) },
    adSpace: { count: (...args: unknown[]) => adSpaceCount(...args) },
  },
}));

const { deleteAccount, deleteAccountMessage } = await import("./delete-account");

describe("deleteAccount", () => {
  beforeEach(() => {
    userFindUnique.mockReset();
    userCount.mockReset();
    projectCount.mockReset();
    adSpaceCount.mockReset();
    userDelete.mockReset();
  });

  it("refuses an account that owns ad spaces but no projects (#60)", async () => {
    userFindUnique.mockResolvedValue({ id: 2, role: "CREATOR" });
    projectCount.mockResolvedValue(0);
    adSpaceCount.mockResolvedValue(3);

    const res = await deleteAccount(1, 2);

    expect(res).toEqual({ ok: false, reason: "has_content", projectCount: 0, adSpaceCount: 3 });
    expect(userDelete).not.toHaveBeenCalled();
  });
});

describe("deleteAccountMessage", () => {
  it("mentions shortlist and applications for an account that can buy", () => {
    expect(deleteAccountMessage("Acme Studio", true)).toBe(
      "Acme Studio's account and their notifications, their saved shortlist and submitted applications will be permanently deleted. This can't be undone.",
    );
  });

  it("only mentions notifications for an account that can't buy", () => {
    expect(deleteAccountMessage("Mariam", false)).toBe(
      "Mariam's account and their notifications will be permanently deleted. This can't be undone.",
    );
  });

  // QA-5 (2026-08-11): a dual-side member's stored `role` is whichever side
  // they registered as first and doesn't track isBrand once they switch on
  // buying too — so the message has to key off the flag, not the role, or a
  // CREATOR-by-role member who also buys loses the applications/shortlist
  // line even though those rows are really about to be deleted.
  it("keys off isBrand, not the legacy role a dual-side member happens to have stored", () => {
    // A member who registered as CREATOR but later turned buying on too.
    expect(deleteAccountMessage("Dual Member", true)).toContain(
      "their saved shortlist and submitted applications",
    );
  });
});
