import { describe, it, expect } from "vitest";
import { isStaffRole, roleChangeMessage, STAFF_ROLES } from "./staff-roles";

describe("isStaffRole", () => {
  it("accepts the four staff roles", () => {
    for (const r of STAFF_ROLES) expect(isStaffRole(r)).toBe(true);
  });

  it("rejects the member roles", () => {
    expect(isStaffRole("BRAND")).toBe(false);
    expect(isStaffRole("CREATOR")).toBe(false);
  });

  it("rejects garbage", () => {
    expect(isStaffRole("OWNER")).toBe(false);
    expect(isStaffRole("")).toBe(false);
  });
});

describe("roleChangeMessage", () => {
  it("frames a promotion to super-admin as a gain", () => {
    expect(roleChangeMessage("Mariam", "SUPERADMIN")).toBe(
      "Mariam will gain full access to everything, including staff and settings.",
    );
  });

  it("frames a demotion as what the person will be limited to", () => {
    expect(roleChangeMessage("Mariam", "TRANSLATOR")).toBe(
      "Mariam will be limited to the translations editor.",
    );
    expect(roleChangeMessage("Hrach", "MODERATOR")).toBe(
      "Hrach will be limited to moderating submitted projects.",
    );
    expect(roleChangeMessage("Hrach", "PUBLISHER")).toBe(
      "Hrach will be limited to creating and editing project content.",
    );
  });
});
