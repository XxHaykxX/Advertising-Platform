import { describe, it, expect, vi, beforeEach } from "vitest";

// #63/QA-10: with both a staff and a member session cookie in the same
// browser (IA-47), the notification actions used to resolve via
// loadCurrentUser() — staff wins unconditionally — so the member cabinet's
// badge/toaster/mark-read ended up reading and mutating the STAFF account's
// notifications. Both loaders below resolve to a *different* user, exactly
// like a browser holding both cookies, so a test that picks the wrong one
// fails loudly instead of passing by coincidence.
const STAFF_USER = { id: 1, isCreator: false, isBrand: false };
const MEMBER_USER = { id: 2, isCreator: true, isBrand: false };

const loadStaffUser = vi.fn(async () => STAFF_USER);
const loadCurrentMember = vi.fn(async () => MEMBER_USER);
vi.mock("@/lib/auth/require", () => ({
  loadStaffUser: () => loadStaffUser(),
  loadCurrentMember: () => loadCurrentMember(),
}));

const getUnreadCount = vi.fn(async (userId: number) => userId * 100);
vi.mock("@/lib/data/notifications", () => ({
  getUnreadCount: (userId: number) => getUnreadCount(userId),
  getUnreadNotifications: vi.fn(async () => []),
  markRead: vi.fn(async () => {}),
  markAllRead: vi.fn(async () => {}),
}));

const { getUnreadNotificationCount } = await import("./notifications");

describe("getUnreadNotificationCount (both session cookies present)", () => {
  beforeEach(() => {
    getUnreadCount.mockClear();
  });

  it("resolves the member on the member cabinet's scope", async () => {
    await getUnreadNotificationCount("member");
    expect(getUnreadCount).toHaveBeenCalledWith(MEMBER_USER.id);
  });

  it("resolves the staff account on the admin panel's scope", async () => {
    await getUnreadNotificationCount("staff");
    expect(getUnreadCount).toHaveBeenCalledWith(STAFF_USER.id);
  });
});
