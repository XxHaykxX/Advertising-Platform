import { describe, it, expect } from "vitest";
import { deleteAccountMessage } from "./delete-account";

describe("deleteAccountMessage", () => {
  it("mentions shortlist and applications for a BRAND account", () => {
    expect(deleteAccountMessage("Acme Studio", "BRAND")).toBe(
      "Acme Studio's account and their notifications, their saved shortlist and submitted applications will be permanently deleted. This can't be undone.",
    );
  });

  it("only mentions notifications for a CREATOR account", () => {
    expect(deleteAccountMessage("Mariam", "CREATOR")).toBe(
      "Mariam's account and their notifications will be permanently deleted. This can't be undone.",
    );
  });

  it("only mentions notifications for a staff account", () => {
    expect(deleteAccountMessage("Hrach", "MODERATOR")).toBe(
      "Hrach's account and their notifications will be permanently deleted. This can't be undone.",
    );
  });
});
