import { describe, it, expect } from "vitest";
import { normalizeProjectRestore } from "./restore";

// ── normalizeProjectRestore (review finding, 2026-08-02) ──────────────────
// A ContentVersion snapshot taken before IA-42 (2026-08-01) has no
// applicationDeadlineOngoing / releasePrecision keys at all; restoring one
// onto a row currently marked Ongoing (or a non-DAY precision) must not leave
// those two columns disagreeing with the date the restore brings back.

describe("normalizeProjectRestore", () => {
  it("defaults the two IA-42 columns when a legacy snapshot doesn't carry them", () => {
    const legacy = { applicationDeadline: "2026-09-01T00:00:00.000Z", releaseDate: "2026-10-01T00:00:00.000Z" };
    const out = normalizeProjectRestore(legacy);
    expect(out.applicationDeadlineOngoing).toBe(false);
    expect(out.releasePrecision).toBe("DAY");
    // The date itself is untouched — only the two missing columns are added.
    expect(out.applicationDeadline).toBe(legacy.applicationDeadline);
  });

  it("forces applicationDeadline back to null when the restored row is Ongoing", () => {
    // A row that is (or, via this same defaulting, becomes) Ongoing must
    // never carry a concrete date alongside it — isArchived() trusts the
    // flag alone and would otherwise never archive a project that has one.
    const out = normalizeProjectRestore({
      applicationDeadline: "2026-09-01T00:00:00.000Z",
      applicationDeadlineOngoing: true,
    });
    expect(out.applicationDeadline).toBeNull();
    expect(out.applicationDeadlineOngoing).toBe(true);
  });

  it("leaves an already-correct post-IA-42 snapshot alone", () => {
    const modern = {
      applicationDeadline: null,
      applicationDeadlineOngoing: true,
      releaseDate: "2027-01-01T00:00:00.000Z",
      releasePrecision: "YEAR",
    };
    expect(normalizeProjectRestore(modern)).toEqual(modern);
  });

  it("does not touch unrelated fields", () => {
    const out = normalizeProjectRestore({ title: "Some Title", genre: "Drama" });
    expect(out.title).toBe("Some Title");
    expect(out.genre).toBe("Drama");
  });
});
