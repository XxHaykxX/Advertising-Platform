import { describe, it, expect, vi, beforeEach } from "vitest";

// QA-5 (2026-08-11): name/avatar/phone/website live on the same User row for
// both cabinets. Saving from either profile form has to invalidate the
// OTHER side's Router Cache segment too, or a dual-side member keeps seeing
// the pre-edit value there until it expires on its own. Mocked instead of
// integration-tested: both actions are otherwise plain DB writes already
// covered by manual QA, the one thing worth pinning down here is which
// paths get revalidated.
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath, updateTag: vi.fn() }));

const requireMember = vi.fn();
vi.mock("@/lib/auth/require", () => ({ requireMember: () => requireMember() }));

vi.mock("@/lib/data/locale", () => ({ getLocale: async () => "en" as const }));

const userUpdate = vi.fn().mockResolvedValue({});
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: (...args: unknown[]) => userUpdate(...args) } },
}));

const { updateCreatorProfile } = await import("./actions");
const { updateBrandProfile } = await import("./brand/actions");

const DUAL_USER = { id: 42, isCreator: true, isBrand: true, name: "Dual Member", email: "d@x.com" };

describe("profile saves revalidate both cabinets for a dual-side member", () => {
  beforeEach(() => {
    revalidatePath.mockClear();
    userUpdate.mockClear();
    requireMember.mockResolvedValue(DUAL_USER);
  });

  it("updateCreatorProfile also revalidates the brand profile page", async () => {
    const fd = new FormData();
    fd.set("name", "New Name");
    fd.set("avatar", "");
    fd.set("phone", "");
    fd.set("website", "");

    const res = await updateCreatorProfile({}, fd);

    expect(res.ok).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/account/brand/profile");
  });

  it("updateBrandProfile also revalidates the creator profile page", async () => {
    const fd = new FormData();
    fd.set("name", "New Name");
    fd.set("avatar", "");
    fd.set("company", "");
    fd.set("website", "");
    fd.set("phone", "");
    fd.set("brandCategories", "[]");
    fd.set("budgetRange", "");

    const res = await updateBrandProfile({}, fd);

    expect(res.ok).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/account/profile");
  });
});
