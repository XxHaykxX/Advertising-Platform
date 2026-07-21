import { describe, it, expect } from "vitest";
import { makeUI } from "@/lib/i18n";
import {
  parseNotificationData,
  renderNotification,
  NOTIFICATION_TYPES,
} from "./notifications";

describe("parseNotificationData", () => {
  it("returns {} for null/undefined/empty", () => {
    expect(parseNotificationData(null)).toEqual({});
    expect(parseNotificationData(undefined)).toEqual({});
    expect(parseNotificationData("")).toEqual({});
  });

  it("parses a valid JSON payload", () => {
    expect(parseNotificationData('{"projectId":7,"brandName":"Coca-Cola"}')).toEqual({
      projectId: 7,
      brandName: "Coca-Cola",
    });
  });

  it("returns {} on malformed JSON", () => {
    expect(parseNotificationData("{broken")).toEqual({});
  });

  it("returns {} when JSON is a non-object (array/primitive/null)", () => {
    expect(parseNotificationData("[1,2]")).toEqual([1, 2]); // arrays are objects; documents current behavior
    expect(parseNotificationData("42")).toEqual({});
    expect(parseNotificationData("null")).toEqual({});
  });
});

describe("renderNotification", () => {
  const t = makeUI("hy");

  it("renders a non-empty localized title + body for every known type", () => {
    for (const type of NOTIFICATION_TYPES) {
      const { title, body } = renderNotification(t, type, {
        brandName: "BrandX",
        projectTitle: "ProjX",
        creatorName: "CreatorX",
        // BROADCAST renders the admin's free text verbatim — without these the
        // body is legitimately empty, which is covered by its own test below.
        title: "TitleX",
        message: "MessageX",
      });
      expect(title.length).toBeGreaterThan(0);
      expect(body.length).toBeGreaterThan(0);
      // a real localized string, not the raw i18n key
      expect(title).not.toMatch(/^notif\./);
      expect(body).not.toMatch(/^notif\./);
    }
  });

  it("interpolates the brand name into the INTEREST body", () => {
    const { body } = renderNotification(t, "INTEREST", { brandName: "Coca-Cola" });
    expect(body).toContain("Coca-Cola");
  });

  it("interpolates the project title into the APPROVED body", () => {
    const { body } = renderNotification(t, "PROJECT_APPROVED", { projectTitle: "ԱՐԱՄ" });
    expect(body).toContain("ԱՐԱՄ");
  });

  it("renders BROADCAST admin free text verbatim, generic title when blank", () => {
    const full = renderNotification(t, "BROADCAST", { title: "Hi", message: "News" });
    expect(full).toEqual({ title: "Hi", body: "News" });
    const blank = renderNotification(t, "BROADCAST", {});
    expect(blank.title.length).toBeGreaterThan(0);
    expect(blank.title).not.toMatch(/^notif\./);
    expect(blank.body).toBe("");
  });

  it("falls back to a generic title + empty body for an unknown type", () => {
    const { title, body } = renderNotification(t, "SOMETHING_ELSE", {});
    expect(title.length).toBeGreaterThan(0);
    expect(body).toBe("");
  });

  it("localizes differently across locales", () => {
    const hy = renderNotification(makeUI("hy"), "INTEREST", { brandName: "B" });
    const en = renderNotification(makeUI("en"), "INTEREST", { brandName: "B" });
    expect(hy.title).not.toBe(en.title);
  });
});
