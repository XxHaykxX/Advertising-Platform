import { describe, it, expect } from "vitest";
import { isValidPhone } from "@/components/report/application-dialog";

/* The application's phone field (2026-07-26). Armenian numbers are exactly
   8 digits after +374 — one digit short or long is a typo, and a typo'd
   number is a lead the seller cannot call back. These pin that length so a
   later refactor of the regex can't quietly loosen it. */

describe("isValidPhone — Armenia (+374)", () => {
  it("accepts the exact 8-digit national part", () => {
    expect(isValidPhone("+37499105115")).toBe(true);
  });

  it("accepts the same number written with separators", () => {
    expect(isValidPhone("+374 99 105 115")).toBe(true);
    expect(isValidPhone("+374-99-105-115")).toBe(true);
    expect(isValidPhone("+374 (99) 105-115")).toBe(true);
  });

  it("rejects one digit too few", () => {
    expect(isValidPhone("+3749910511")).toBe(false);
  });

  it("rejects one digit too many", () => {
    expect(isValidPhone("+374991051155")).toBe(false);
  });

  it("rejects the bare dial code the field starts with", () => {
    expect(isValidPhone("+374")).toBe(false);
  });
});

describe("isValidPhone — general", () => {
  it("requires a leading +", () => {
    expect(isValidPhone("37499105115")).toBe(false);
    expect(isValidPhone("099105115")).toBe(false);
  });

  it("rejects empty and non-numeric input", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("+")).toBe(false);
    expect(isValidPhone("+374 не номер")).toBe(false);
  });

  it("rejects a country code starting with zero", () => {
    expect(isValidPhone("+0374991051")).toBe(false);
  });

  it("accepts other countries within the loose international range", () => {
    expect(isValidPhone("+7 495 123 45 67")).toBe(true); // Russia
    expect(isValidPhone("+1 202 555 0134")).toBe(true); // USA
  });

  it("rejects numbers that are far too short or too long anywhere", () => {
    expect(isValidPhone("+7495")).toBe(false);
    expect(isValidPhone("+74951234567890123")).toBe(false);
  });
});
